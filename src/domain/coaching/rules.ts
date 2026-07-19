import type { AudioQualityFlag } from '../audio/types';
import type { ExerciseType } from '../contracts/domain';
import { selectExerciseCandidate } from '../exercises/candidatePolicy';
import {
  calculateTargetDifficulty,
  selectFeedbackFocus,
} from './adaptation';
import {
  COACH_RULES_V1_CONFIG,
  COACH_RULES_VERSION,
  REQUIRED_EXERCISE_TYPES,
} from './config';
import { selectCoachTemplate } from './templates';
import type {
  CoachDecision,
  CoachErrorCode,
  CoachInput,
  CoachResult,
  CoachRuleId,
  CoachTemplate,
  FeedbackFocus,
} from './types';
import { validateCoachInput } from './validation';

const BLOCKING_AUDIO_QUALITY_FLAGS = Object.freeze([
  'audio_too_short',
  'no_speech_detected',
  'too_quiet',
  'possible_clipping',
] as const satisfies readonly AudioQualityFlag[]);

function coachError(code: CoachErrorCode, message: string): CoachResult {
  return { ok: false, error: { code, message } };
}

function isBlockingCapture(input: CoachInput): boolean {
  return (
    input.audioMetrics.qualityFlags.some((flag) =>
      BLOCKING_AUDIO_QUALITY_FLAGS.some(
        (blockingFlag) => blockingFlag === flag,
      ),
    ) ||
    input.audioMetrics.silenceRatio >=
      COACH_RULES_V1_CONFIG.blockingSilenceRatio
  );
}

function findPendingRequiredExerciseType(
  coveredExerciseTypes: readonly ExerciseType[],
): ExerciseType | null {
  return (
    REQUIRED_EXERCISE_TYPES.find(
      (type) => !coveredExerciseTypes.includes(type),
    ) ?? null
  );
}

function ruleIdForFocus(focus: FeedbackFocus): CoachRuleId {
  switch (focus) {
    case 'follow_pause_cues':
      return 'continue_follow_pause_cues';
    case 'steady_pace':
      return 'continue_steady_pace';
    case 'repeat_calmly':
      return 'continue_repeat_calmly';
    case 'continue':
      return 'continue_default';
    case 'clear_capture':
      return 'capture_quality_blocking';
    case 'complete':
      return 'complete_fifth_valid_attempt';
  }
}

function buildDecision(
  template: CoachTemplate,
  selectedExerciseId: string | null,
  textMetricsAreAvailable: boolean,
): CoachDecision {
  const evidenceKeys = template.allowedEvidenceKeys.filter(
    (key) => key !== 'textSimilarity' || textMetricsAreAvailable,
  );

  return {
    rulesVersion: COACH_RULES_VERSION,
    ruleId: template.ruleId,
    templateId: template.id,
    shortFeedback: template.shortFeedback,
    focus: template.focus,
    action: template.action,
    explanation: template.explanation,
    evidenceKeys,
    selectedExerciseId,
  };
}

function decisionFromTemplate(
  ruleId: CoachRuleId,
  input: CoachInput,
  selectedExerciseId: string | null,
): CoachResult {
  const template = selectCoachTemplate(ruleId, input.textSource);
  if (template === null) {
    return coachError(
      'invalid_input',
      'No existe una plantilla compatible para la decisión de coaching.',
    );
  }

  return {
    ok: true,
    decision: buildDecision(
      template,
      selectedExerciseId,
      input.textMetrics !== null,
    ),
  };
}

export function evaluateCoach(input: unknown): CoachResult {
  const validation = validateCoachInput(input);
  if (!validation.ok) {
    return validation;
  }

  const validatedInput = validation.input;

  if (isBlockingCapture(validatedInput)) {
    return decisionFromTemplate(
      'capture_quality_blocking',
      validatedInput,
      null,
    );
  }

  const nextValidAttemptCount =
    validatedInput.validAttemptCountBeforeCurrent + 1;
  if (nextValidAttemptCount === 5) {
    return decisionFromTemplate(
      'complete_fifth_valid_attempt',
      validatedInput,
      null,
    );
  }

  const coveredExerciseTypesAfterCurrent = [
    ...validatedInput.coveredExerciseTypesBeforeCurrent,
  ];
  if (
    !coveredExerciseTypesAfterCurrent.includes(
      validatedInput.currentExercise.type,
    )
  ) {
    coveredExerciseTypesAfterCurrent.push(validatedInput.currentExercise.type);
  }
  const pendingRequiredExerciseType = findPendingRequiredExerciseType(
    coveredExerciseTypesAfterCurrent,
  );

  const textSimilarity = validatedInput.textMetrics?.textSimilarity ?? null;
  const targetDifficulty = calculateTargetDifficulty(
    validatedInput.currentDifficulty,
    textSimilarity,
  );
  const focus = selectFeedbackFocus({
    currentExercise: validatedInput.currentExercise,
    audioMetrics: validatedInput.audioMetrics,
    textSimilarity,
  });

  const selectedExercise = selectExerciseCandidate({
    allowedExercises: validatedInput.allowedExercises,
    currentExerciseId: validatedInput.currentExercise.id,
    targetDifficulty,
    pendingRequiredExerciseType,
  });

  if (selectedExercise === null && pendingRequiredExerciseType !== null) {
    return coachError(
      'missing_required_exercise_type',
      `El catálogo permitido no contiene el siguiente tipo obligatorio: ${pendingRequiredExerciseType}.`,
    );
  }
  if (selectedExercise === null) {
    return coachError(
      'empty_allowed_exercises',
      'El catálogo permitido no contiene candidatos seleccionables.',
    );
  }

  return decisionFromTemplate(
    ruleIdForFocus(focus),
    validatedInput,
    selectedExercise.id,
  );
}

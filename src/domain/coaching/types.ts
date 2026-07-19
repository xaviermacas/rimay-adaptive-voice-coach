import type { DeterministicMetrics } from '../audio/types';
import type {
  Difficulty,
  Exercise,
  ExerciseType,
} from '../contracts/domain';
import type { SpeechTextSource } from '../contracts/speech';
import type { TextMetrics } from '../text/types';

export type CoachRulesVersion = 'coach-rules-v1';
export type CoachTemplateCatalogVersion = 'coach-templates-v1';

export type FeedbackFocus =
  | 'repeat_calmly'
  | 'steady_pace'
  | 'follow_pause_cues'
  | 'clear_capture'
  | 'continue'
  | 'complete';

export type CoachAction =
  | 'repeat_current'
  | 'continue'
  | 'complete_session';

export type CoachRuleId =
  | 'capture_quality_blocking'
  | 'complete_fifth_valid_attempt'
  | 'continue_follow_pause_cues'
  | 'continue_steady_pace'
  | 'continue_repeat_calmly'
  | 'continue_default';

export type CoachTemplateId =
  | 'capture-clear-v1'
  | 'session-complete-v1'
  | 'pause-cues-v1'
  | 'steady-pace-v1'
  | 'repeat-text-browser-v1'
  | 'repeat-text-manual-v1'
  | 'repeat-text-demo-v1'
  | 'continue-text-browser-v1'
  | 'continue-text-manual-v1'
  | 'continue-text-demo-v1'
  | 'continue-no-text-v1';

export type MetricEvidenceKey =
  | keyof DeterministicMetrics
  | keyof TextMetrics
  | 'pauseCues'
  | 'expectedMaxDurationMs'
  | 'currentDifficulty'
  | 'validAttemptCountBeforeCurrent';

export interface CoachInput {
  readonly attemptId: string;
  readonly currentExercise: Exercise;
  readonly textSource: SpeechTextSource | null;
  readonly audioMetrics: DeterministicMetrics;
  readonly textMetrics: TextMetrics | null;
  readonly currentDifficulty: Difficulty;
  readonly validAttemptCountBeforeCurrent: number;
  readonly coveredExerciseTypesBeforeCurrent: readonly ExerciseType[];
  readonly allowedExercises: readonly Exercise[];
}

export interface CoachDecision {
  readonly rulesVersion: CoachRulesVersion;
  readonly ruleId: CoachRuleId;
  readonly templateId: CoachTemplateId;
  readonly shortFeedback: string;
  readonly focus: FeedbackFocus;
  readonly action: CoachAction;
  readonly explanation: string;
  readonly evidenceKeys: readonly MetricEvidenceKey[];
  readonly selectedExerciseId: string | null;
}

export type CoachErrorCode =
  | 'invalid_input'
  | 'invalid_attempt_state'
  | 'incompatible_algorithm_version'
  | 'empty_allowed_exercises'
  | 'duplicate_exercise_id'
  | 'invalid_exercise'
  | 'missing_required_exercise_type'
  | 'inconsistent_audio_metrics'
  | 'inconsistent_text_metrics';

export interface CoachError {
  readonly code: CoachErrorCode;
  readonly message: string;
}

export type CoachResult =
  | { readonly ok: true; readonly decision: CoachDecision }
  | { readonly ok: false; readonly error: CoachError };

export interface CoachTemplate {
  readonly catalogVersion: CoachTemplateCatalogVersion;
  readonly id: CoachTemplateId;
  readonly ruleId: CoachRuleId;
  readonly action: CoachAction;
  readonly focus: FeedbackFocus;
  readonly shortFeedback: string;
  readonly explanation: string;
  readonly allowedEvidenceKeys: readonly MetricEvidenceKey[];
  readonly allowedTextSources: readonly (SpeechTextSource | null)[];
}

export type CoachValidationResult =
  | { readonly ok: true; readonly input: CoachInput }
  | { readonly ok: false; readonly error: CoachError };

import type {
  AudioQualityFlag,
  DeterministicMetrics,
} from '../audio/types';
import type {
  Difficulty,
  Exercise,
  ExerciseType,
} from '../contracts/domain';
import type { SpeechTextSource } from '../contracts/speech';
import type { TextMetrics } from '../text/types';
import {
  COACH_RULES_V1_CONFIG,
  REQUIRED_EXERCISE_TYPES,
} from './config';
import type {
  CoachError,
  CoachErrorCode,
  CoachValidationResult,
} from './types';

const AUDIO_QUALITY_FLAGS = Object.freeze([
  'audio_too_short',
  'no_speech_detected',
  'too_quiet',
  'possible_clipping',
  'transcription_missing',
] as const satisfies readonly AudioQualityFlag[]);

const SPEECH_TEXT_SOURCES = Object.freeze([
  'browser',
  'demo',
  'manual',
] as const satisfies readonly SpeechTextSource[]);

const WPM_UNAVAILABLE_REASONS = Object.freeze([
  'no_real_recording',
  'invalid_total_duration',
  'demo_source',
  'insufficient_voice_activity',
] as const);

function coachError(code: CoachErrorCode, message: string): CoachError {
  return { code, message };
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isNonnegativeFiniteNumber(value: unknown): value is number {
  return isFiniteNumber(value) && value >= 0;
}

function isNonnegativeInteger(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 0
  );
}

function isNullableNonnegativeFiniteNumber(
  value: unknown,
): value is number | null {
  return value === null || isNonnegativeFiniteNumber(value);
}

function hasOnlyFiniteNumbers(
  value: unknown,
  visited: WeakSet<object> = new WeakSet<object>(),
): boolean {
  if (typeof value === 'number') {
    return Number.isFinite(value);
  }

  if (value === null || typeof value !== 'object') {
    return true;
  }

  if (visited.has(value)) {
    return false;
  }
  visited.add(value);

  if (Array.isArray(value)) {
    return value.every((item) => hasOnlyFiniteNumbers(item, visited));
  }

  return Object.values(value).every((item) =>
    hasOnlyFiniteNumbers(item, visited),
  );
}

function isExerciseType(value: unknown): value is ExerciseType {
  return REQUIRED_EXERCISE_TYPES.some((type) => type === value);
}

function isDifficulty(value: unknown): value is Difficulty {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= COACH_RULES_V1_CONFIG.minimumDifficulty &&
    value <= COACH_RULES_V1_CONFIG.maximumDifficulty
  );
}

function isSortedPauseCueList(value: unknown): value is readonly number[] {
  if (!Array.isArray(value)) {
    return false;
  }

  let previous = -1;
  for (const cue of value) {
    if (!isFiniteNumber(cue) || cue < 0 || cue < previous) {
      return false;
    }
    previous = cue;
  }
  return true;
}

export function isValidExercise(value: unknown): value is Exercise {
  if (!isRecord(value)) {
    return false;
  }

  const {
    id,
    type,
    difficulty,
    instruction,
    targetText,
    pauseCues,
    expectedMaxDurationMs,
  } = value;

  return (
    typeof id === 'string' &&
    id.trim().length > 0 &&
    isExerciseType(type) &&
    isDifficulty(difficulty) &&
    typeof instruction === 'string' &&
    instruction.trim().length > 0 &&
    typeof targetText === 'string' &&
    targetText.trim().length > 0 &&
    isSortedPauseCueList(pauseCues) &&
    isFiniteNumber(expectedMaxDurationMs) &&
    expectedMaxDurationMs > 0
  );
}

function isAudioQualityFlag(value: unknown): value is AudioQualityFlag {
  return AUDIO_QUALITY_FLAGS.some((flag) => flag === value);
}

function hasUniqueAudioQualityFlags(
  value: unknown,
): value is readonly AudioQualityFlag[] {
  return (
    Array.isArray(value) &&
    value.every(isAudioQualityFlag) &&
    new Set(value).size === value.length
  );
}

function isStringList(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isDeterministicMetricsShape(
  value: unknown,
): value is DeterministicMetrics {
  if (!isRecord(value) || !hasOnlyFiniteNumbers(value)) {
    return false;
  }

  const {
    algorithmVersion,
    sampleRateHz,
    channelCount,
    totalDurationMs,
    analyzedDurationMs,
    estimatedSpeechDurationMs,
    silenceDurationMs,
    silenceRatio,
    pauseCount,
    averagePauseDurationMs,
    maximumPauseDurationMs,
    rms,
    peak,
    estimatedNoiseFloorRms,
    adaptiveVoiceThresholdRms,
    clippedSampleRatio,
    possibleClipping,
    wordCount,
    wordsPerMinute,
    promptSimilarity,
    qualityFlags,
    analysisWarnings,
  } = value;

  return (
    algorithmVersion === 'audio-metrics-v1' &&
    isFiniteNumber(sampleRateHz) &&
    sampleRateHz > 0 &&
    isNonnegativeInteger(channelCount) &&
    channelCount > 0 &&
    isNonnegativeFiniteNumber(totalDurationMs) &&
    isNonnegativeFiniteNumber(analyzedDurationMs) &&
    isNonnegativeFiniteNumber(estimatedSpeechDurationMs) &&
    isNonnegativeFiniteNumber(silenceDurationMs) &&
    isFiniteNumber(silenceRatio) &&
    silenceRatio >= 0 &&
    silenceRatio <= 1 &&
    isNonnegativeInteger(pauseCount) &&
    isNullableNonnegativeFiniteNumber(averagePauseDurationMs) &&
    isNullableNonnegativeFiniteNumber(maximumPauseDurationMs) &&
    isNonnegativeFiniteNumber(rms) &&
    isNonnegativeFiniteNumber(peak) &&
    isNonnegativeFiniteNumber(estimatedNoiseFloorRms) &&
    isNonnegativeFiniteNumber(adaptiveVoiceThresholdRms) &&
    isFiniteNumber(clippedSampleRatio) &&
    clippedSampleRatio >= 0 &&
    clippedSampleRatio <= 1 &&
    typeof possibleClipping === 'boolean' &&
    wordCount === null &&
    wordsPerMinute === null &&
    promptSimilarity === null &&
    hasUniqueAudioQualityFlags(qualityFlags) &&
    isStringList(analysisWarnings)
  );
}

function isSpeechTextSource(value: unknown): value is SpeechTextSource {
  return SPEECH_TEXT_SOURCES.some((source) => source === value);
}

function isIndexedToken(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }
  const { index, token } = value;
  return isNonnegativeInteger(index) && typeof token === 'string';
}

function isWordMatch(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }
  const { targetIndex, transcribedIndex, token } = value;
  return (
    isNonnegativeInteger(targetIndex) &&
    isNonnegativeInteger(transcribedIndex) &&
    typeof token === 'string'
  );
}

function isWordSubstitution(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }
  const { targetIndex, transcribedIndex, targetToken, transcribedToken } = value;
  return (
    isNonnegativeInteger(targetIndex) &&
    isNonnegativeInteger(transcribedIndex) &&
    typeof targetToken === 'string' &&
    typeof transcribedToken === 'string'
  );
}

function isListOf(value: unknown, guard: (item: unknown) => boolean): boolean {
  return Array.isArray(value) && value.every(guard);
}

function isTextMetricsShape(value: unknown): value is TextMetrics {
  if (!isRecord(value) || !hasOnlyFiniteNumbers(value)) {
    return false;
  }

  const {
    algorithmVersion,
    source,
    targetText,
    transcribedText,
    targetWordCount,
    transcribedWordCount,
    matchedWordCount,
    matchedWords,
    omittedWords,
    additionalWords,
    substitutedWords,
    wordErrorCount,
    wordErrorRate,
    textSimilarity,
    wordsPerMinute,
    wordsPerMinuteUnavailableReason,
    warnings,
  } = value;

  const unavailableReasonIsValid =
    wordsPerMinuteUnavailableReason === null ||
    WPM_UNAVAILABLE_REASONS.some(
      (reason) => reason === wordsPerMinuteUnavailableReason,
    );

  return (
    algorithmVersion === 'text-metrics-v1' &&
    isSpeechTextSource(source) &&
    typeof targetText === 'string' &&
    typeof transcribedText === 'string' &&
    isNonnegativeInteger(targetWordCount) &&
    isNonnegativeInteger(transcribedWordCount) &&
    isNonnegativeInteger(matchedWordCount) &&
    isListOf(matchedWords, isWordMatch) &&
    isListOf(omittedWords, isIndexedToken) &&
    isListOf(additionalWords, isIndexedToken) &&
    isListOf(substitutedWords, isWordSubstitution) &&
    isNonnegativeInteger(wordErrorCount) &&
    isNonnegativeFiniteNumber(wordErrorRate) &&
    isFiniteNumber(textSimilarity) &&
    textSimilarity >= 0 &&
    textSimilarity <= 1 &&
    isNullableNonnegativeFiniteNumber(wordsPerMinute) &&
    unavailableReasonIsValid &&
    isStringList(warnings)
  );
}

function validateAlgorithmVersions(
  audioMetrics: unknown,
  textMetrics: unknown,
): CoachError | null {
  if (isRecord(audioMetrics)) {
    const { algorithmVersion } = audioMetrics;
    if (
      typeof algorithmVersion === 'string' &&
      algorithmVersion !== 'audio-metrics-v1'
    ) {
      return coachError(
        'incompatible_algorithm_version',
        'La versión de métricas acústicas no es compatible con coach-rules-v1.',
      );
    }
  }

  if (isRecord(textMetrics)) {
    const { algorithmVersion } = textMetrics;
    if (
      typeof algorithmVersion === 'string' &&
      algorithmVersion !== 'text-metrics-v1'
    ) {
      return coachError(
        'incompatible_algorithm_version',
        'La versión de métricas textuales no es compatible con coach-rules-v1.',
      );
    }
  }

  return null;
}

function validateCoverage(
  validAttemptCountBeforeCurrent: number,
  coveredExerciseTypesBeforeCurrent: readonly ExerciseType[],
  currentExercise: Exercise,
): CoachError | null {
  const expectedCoverage = REQUIRED_EXERCISE_TYPES.slice(
    0,
    Math.min(validAttemptCountBeforeCurrent, REQUIRED_EXERCISE_TYPES.length),
  );

  if (
    coveredExerciseTypesBeforeCurrent.length !== expectedCoverage.length ||
    coveredExerciseTypesBeforeCurrent.some(
      (type, index) => type !== expectedCoverage[index],
    )
  ) {
    return coachError(
      'invalid_attempt_state',
      'La cobertura anterior no coincide con los intentos válidos terminados.',
    );
  }

  const requiredCurrentType =
    validAttemptCountBeforeCurrent < REQUIRED_EXERCISE_TYPES.length
      ? REQUIRED_EXERCISE_TYPES[validAttemptCountBeforeCurrent]
      : undefined;
  if (
    requiredCurrentType !== undefined &&
    currentExercise.type !== requiredCurrentType
  ) {
    return coachError(
      'invalid_attempt_state',
      'El ejercicio actual no corresponde al siguiente tipo obligatorio.',
    );
  }

  return null;
}

export function validateCoachInput(input: unknown): CoachValidationResult {
  if (!isRecord(input)) {
    return {
      ok: false,
      error: coachError('invalid_input', 'La entrada de coaching no es válida.'),
    };
  }

  const {
    attemptId,
    currentExercise,
    textSource,
    audioMetrics,
    textMetrics,
    currentDifficulty,
    validAttemptCountBeforeCurrent,
    coveredExerciseTypesBeforeCurrent,
    allowedExercises,
  } = input;

  if (typeof attemptId !== 'string' || attemptId.trim() === '') {
    return {
      ok: false,
      error: coachError('invalid_input', 'El identificador del intento es obligatorio.'),
    };
  }

  if (
    typeof validAttemptCountBeforeCurrent !== 'number' ||
    !Number.isInteger(validAttemptCountBeforeCurrent) ||
    validAttemptCountBeforeCurrent < 0 ||
    validAttemptCountBeforeCurrent >
      COACH_RULES_V1_CONFIG.maximumValidAttemptCountBeforeCurrent
  ) {
    return {
      ok: false,
      error: coachError(
        'invalid_attempt_state',
        'El contador anterior debe ser un entero entre 0 y 4.',
      ),
    };
  }

  if (!isDifficulty(currentDifficulty)) {
    return {
      ok: false,
      error: coachError('invalid_input', 'La dificultad actual debe estar entre 1 y 3.'),
    };
  }

  if (!isValidExercise(currentExercise)) {
    return {
      ok: false,
      error: coachError('invalid_exercise', 'El ejercicio actual no es válido.'),
    };
  }

  if (!Array.isArray(allowedExercises)) {
    return {
      ok: false,
      error: coachError('invalid_input', 'El catálogo permitido no es válido.'),
    };
  }
  if (allowedExercises.length === 0) {
    return {
      ok: false,
      error: coachError(
        'empty_allowed_exercises',
        'El catálogo permitido no puede estar vacío.',
      ),
    };
  }
  if (!allowedExercises.every(isValidExercise)) {
    return {
      ok: false,
      error: coachError('invalid_exercise', 'El catálogo contiene un ejercicio inválido.'),
    };
  }

  const exerciseIds = allowedExercises.map((exercise) => exercise.id);
  if (new Set(exerciseIds).size !== exerciseIds.length) {
    return {
      ok: false,
      error: coachError(
        'duplicate_exercise_id',
        'El catálogo permitido contiene identificadores repetidos.',
      ),
    };
  }

  const versionError = validateAlgorithmVersions(audioMetrics, textMetrics);
  if (versionError !== null) {
    return { ok: false, error: versionError };
  }

  if (!isDeterministicMetricsShape(audioMetrics)) {
    return {
      ok: false,
      error: coachError('invalid_input', 'Las métricas acústicas no son válidas.'),
    };
  }

  const hasClippingFlag = audioMetrics.qualityFlags.includes(
    'possible_clipping',
  );
  if (audioMetrics.possibleClipping !== hasClippingFlag) {
    return {
      ok: false,
      error: coachError(
        'inconsistent_audio_metrics',
        'La bandera de clipping contradice el booleano acústico derivado.',
      ),
    };
  }

  if (textSource !== null && !isSpeechTextSource(textSource)) {
    return {
      ok: false,
      error: coachError('invalid_input', 'La procedencia textual no es válida.'),
    };
  }

  if (textMetrics !== null && !isTextMetricsShape(textMetrics)) {
    return {
      ok: false,
      error: coachError('invalid_input', 'Las métricas textuales no son válidas.'),
    };
  }

  if (
    (textSource === null && textMetrics !== null) ||
    (textSource !== null && textMetrics === null) ||
    (textMetrics !== null && textMetrics.source !== textSource)
  ) {
    return {
      ok: false,
      error: coachError(
        'invalid_attempt_state',
        'La procedencia y las métricas textuales no son coherentes.',
      ),
    };
  }

  if (
    textMetrics !== null &&
    textMetrics.targetText !== currentExercise.targetText
  ) {
    return {
      ok: false,
      error: coachError(
        'inconsistent_text_metrics',
        'Las métricas textuales no corresponden al texto objetivo del ejercicio actual.',
      ),
    };
  }

  if (
    !Array.isArray(coveredExerciseTypesBeforeCurrent) ||
    !coveredExerciseTypesBeforeCurrent.every(isExerciseType)
  ) {
    return {
      ok: false,
      error: coachError(
        'invalid_attempt_state',
        'La cobertura anterior no es válida.',
      ),
    };
  }

  const coverageError = validateCoverage(
    validAttemptCountBeforeCurrent,
    coveredExerciseTypesBeforeCurrent,
    currentExercise,
  );
  if (coverageError !== null) {
    return { ok: false, error: coverageError };
  }

  return {
    ok: true,
    input: {
      attemptId,
      currentExercise,
      textSource,
      audioMetrics,
      textMetrics,
      currentDifficulty,
      validAttemptCountBeforeCurrent,
      coveredExerciseTypesBeforeCurrent,
      allowedExercises,
    },
  };
}

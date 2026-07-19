import type { DeterministicMetrics } from '../../../domain/audio/types';
import type {
  Difficulty,
  Exercise,
  ExerciseType,
} from '../../../domain/contracts/domain';
import type { SpeechTextSource } from '../../../domain/contracts/speech';
import type { CoachInput } from '../../../domain/coaching/types';
import type { TextMetrics } from '../../../domain/text/types';

export const WORD_EXERCISE: Exercise = Object.freeze({
  id: 'word-1',
  type: 'word_repetition',
  difficulty: 1,
  instruction: 'Repite la palabra visible.',
  targetText: 'casa',
  pauseCues: Object.freeze([]),
  expectedMaxDurationMs: 3_000,
});

export const PHRASE_EXERCISE: Exercise = Object.freeze({
  id: 'phrase-2',
  type: 'phrase_repetition',
  difficulty: 2,
  instruction: 'Repite la frase visible.',
  targetText: 'La casa tiene una puerta azul.',
  pauseCues: Object.freeze([]),
  expectedMaxDurationMs: 8_000,
});

export const GUIDED_EXERCISE: Exercise = Object.freeze({
  id: 'guided-2',
  type: 'guided_reading',
  difficulty: 2,
  instruction: 'Lee el texto y sigue las pausas marcadas.',
  targetText: 'La mañana está tranquila. El camino está despejado.',
  pauseCues: Object.freeze([25]),
  expectedMaxDurationMs: 12_000,
});

export const DEFAULT_ALLOWED_EXERCISES = Object.freeze([
  WORD_EXERCISE,
  PHRASE_EXERCISE,
  GUIDED_EXERCISE,
] as const satisfies readonly Exercise[]);

export const VALID_AUDIO_METRICS: DeterministicMetrics = Object.freeze({
  algorithmVersion: 'audio-metrics-v1',
  sampleRateHz: 48_000,
  channelCount: 1,
  totalDurationMs: 2_000,
  analyzedDurationMs: 2_000,
  estimatedSpeechDurationMs: 1_600,
  silenceDurationMs: 400,
  silenceRatio: 0.2,
  pauseCount: 1,
  averagePauseDurationMs: 400,
  maximumPauseDurationMs: 400,
  rms: 0.12,
  peak: 0.45,
  estimatedNoiseFloorRms: 0.01,
  adaptiveVoiceThresholdRms: 0.02,
  clippedSampleRatio: 0,
  possibleClipping: false,
  wordCount: null,
  wordsPerMinute: null,
  promptSimilarity: null,
  qualityFlags: Object.freeze(['transcription_missing'] as const),
  analysisWarnings: Object.freeze([]),
});

export function createTextMetrics(
  source: SpeechTextSource = 'browser',
  textSimilarity = 0.75,
  targetText = WORD_EXERCISE.targetText,
): TextMetrics {
  return {
    algorithmVersion: 'text-metrics-v1',
    source,
    targetText,
    transcribedText: 'casa',
    targetWordCount: 1,
    transcribedWordCount: 1,
    matchedWordCount: 1,
    matchedWords: [{ targetIndex: 0, transcribedIndex: 0, token: 'casa' }],
    omittedWords: [],
    additionalWords: [],
    substitutedWords: [],
    wordErrorCount: 0,
    wordErrorRate: 0,
    textSimilarity,
    wordsPerMinute: 30,
    wordsPerMinuteUnavailableReason: null,
    warnings: [],
  };
}

interface CoachInputState {
  readonly currentExercise: Exercise;
  readonly currentDifficulty: Difficulty;
  readonly validAttemptCountBeforeCurrent: number;
  readonly coveredExerciseTypesBeforeCurrent: readonly ExerciseType[];
}

const DEFAULT_STATE: CoachInputState = Object.freeze({
  currentExercise: WORD_EXERCISE,
  currentDifficulty: 1,
  validAttemptCountBeforeCurrent: 0,
  coveredExerciseTypesBeforeCurrent: Object.freeze([]),
});

export function createCoachInput(
  overrides: Partial<CoachInput> = {},
): CoachInput {
  const currentExercise =
    overrides.currentExercise ?? DEFAULT_STATE.currentExercise;

  return {
    attemptId: 'attempt-1',
    ...DEFAULT_STATE,
    currentExercise,
    textSource: 'browser',
    audioMetrics: VALID_AUDIO_METRICS,
    textMetrics: createTextMetrics(
      'browser',
      0.75,
      currentExercise.targetText,
    ),
    allowedExercises: DEFAULT_ALLOWED_EXERCISES,
    ...overrides,
  };
}

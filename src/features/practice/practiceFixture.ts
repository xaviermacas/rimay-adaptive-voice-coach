import type { DeterministicMetrics } from '../../domain/audio';
import type { Exercise, SpeechTextResult } from '../../domain/contracts';
import { createSpeechTextResult } from '../../domain/text';

export const TEMPORARY_PRACTICE_FIXTURE_LABEL =
  'Fixture temporal del incremento 5';

export const PRACTICE_WORD_EXERCISE: Exercise = Object.freeze({
  id: 'practice-word-casa',
  type: 'word_repetition',
  difficulty: 1,
  instruction: 'Pronuncia la palabra visible cuando estés listo.',
  targetText: 'casa',
  pauseCues: Object.freeze([]),
  expectedMaxDurationMs: 3_000,
});

export const PRACTICE_PHRASE_PREVIEW: Exercise = Object.freeze({
  id: 'practice-phrase-calm',
  type: 'phrase_repetition',
  difficulty: 2,
  instruction: 'En el siguiente paso, pronuncia la frase visible.',
  targetText: 'Camino con calma.',
  pauseCues: Object.freeze([]),
  expectedMaxDurationMs: 6_000,
});

export const TEMPORARY_PRACTICE_CATALOG = Object.freeze([
  PRACTICE_WORD_EXERCISE,
  PRACTICE_PHRASE_PREVIEW,
] as const satisfies readonly Exercise[]);

export const DEMO_AUDIO_METRICS_FIXTURE: DeterministicMetrics = Object.freeze({
  algorithmVersion: 'audio-metrics-v1',
  sampleRateHz: 48_000,
  channelCount: 1,
  totalDurationMs: 1_600,
  analyzedDurationMs: 1_600,
  estimatedSpeechDurationMs: 1_200,
  silenceDurationMs: 400,
  silenceRatio: 0.25,
  pauseCount: 0,
  averagePauseDurationMs: null,
  maximumPauseDurationMs: null,
  rms: 0.08,
  peak: 0.42,
  estimatedNoiseFloorRms: 0.008,
  adaptiveVoiceThresholdRms: 0.024,
  clippedSampleRatio: 0,
  possibleClipping: false,
  wordCount: null,
  wordsPerMinute: null,
  promptSimilarity: null,
  qualityFlags: Object.freeze(['transcription_missing'] as const),
  analysisWarnings: Object.freeze(['simulated_audio_metrics_fixture']),
});

export const DEMO_SPEECH_TEXT_FIXTURE: SpeechTextResult = Object.freeze(
  createSpeechTextResult({
    originalText: PRACTICE_WORD_EXERCISE.targetText,
    source: 'demo',
    languageRequested: 'es-EC',
    isFinal: true,
    warnings: Object.freeze(['demo_fixture_does_not_analyze_audio']),
    createdAt: '2026-07-19T00:00:00.000Z',
  }),
);

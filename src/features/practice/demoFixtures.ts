import type { DeterministicMetrics } from '../../domain/audio';
import type { Exercise, SpeechTextResult } from '../../domain/contracts';
import { INITIAL_EXERCISE } from '../../domain/exercises';
import { createSpeechTextResult } from '../../domain/text';

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
    originalText: INITIAL_EXERCISE.targetText,
    source: 'demo',
    languageRequested: 'es-EC',
    isFinal: true,
    warnings: Object.freeze(['demo_fixture_does_not_analyze_audio']),
    createdAt: '2026-07-19T00:00:00.000Z',
  }),
);

export interface DemoAttemptFixtures {
  readonly audioMetrics: DeterministicMetrics;
  readonly speechText: SpeechTextResult;
}

const DEMO_DURATION_BY_TYPE = Object.freeze({
  word_repetition: Object.freeze({
    totalDurationMs: 1_600,
    estimatedSpeechDurationMs: 1_200,
    pauseCount: 0,
  }),
  phrase_repetition: Object.freeze({
    totalDurationMs: 4_000,
    estimatedSpeechDurationMs: 3_200,
    pauseCount: 0,
  }),
  guided_reading: Object.freeze({
    totalDurationMs: 9_000,
    estimatedSpeechDurationMs: 7_200,
    pauseCount: 1,
  }),
});

export function getDemoAttemptFixtures(
  exercise: Exercise,
): DemoAttemptFixtures {
  const timing = DEMO_DURATION_BY_TYPE[exercise.type];
  const silenceDurationMs =
    timing.totalDurationMs - timing.estimatedSpeechDurationMs;
  const audioMetrics = Object.freeze({
    ...DEMO_AUDIO_METRICS_FIXTURE,
    totalDurationMs: timing.totalDurationMs,
    analyzedDurationMs: timing.totalDurationMs,
    estimatedSpeechDurationMs: timing.estimatedSpeechDurationMs,
    silenceDurationMs,
    silenceRatio: silenceDurationMs / timing.totalDurationMs,
    pauseCount: timing.pauseCount,
    averagePauseDurationMs: timing.pauseCount === 0 ? null : silenceDurationMs,
    maximumPauseDurationMs: timing.pauseCount === 0 ? null : silenceDurationMs,
    qualityFlags: Object.freeze(['transcription_missing'] as const),
    analysisWarnings: Object.freeze([
      `simulated_audio_metrics_fixture:${exercise.id}`,
    ]),
  }) satisfies DeterministicMetrics;
  const speechText = Object.freeze(
    createSpeechTextResult({
      originalText: exercise.targetText,
      source: 'demo',
      languageRequested: 'es-EC',
      isFinal: true,
      warnings: Object.freeze([
        `demo_fixture_does_not_analyze_audio:${exercise.id}`,
      ]),
      createdAt: '2026-07-19T00:00:00.000Z',
    }),
  );

  return Object.freeze({ audioMetrics, speechText });
}

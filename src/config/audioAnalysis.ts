import type { AudioAnalysisConfig } from '../domain/audio/types';

/**
 * Experimental capture-quality heuristics for the technical demo.
 * They are not clinically validated and must not be used as clinical limits.
 */
export const AUDIO_METRICS_V1_CONFIG = Object.freeze({
  algorithmVersion: 'audio-metrics-v1',
  windowDurationMs: 20,
  noiseFloorPercentile: 0.2,
  minimumAdaptiveVoiceThresholdRms: 0.015,
  noiseFloorMultiplier: 3,
  maximumJoinedSilenceMs: 200,
  minimumSpeechSegmentDurationMs: 120,
  minimumPauseDurationMs: 300,
  clippingAmplitudeThreshold: 0.99,
  possibleClippingRatioThreshold: 0.001,
  minimumTotalDurationMs: 500,
  minimumSpeechDurationMs: 300,
  tooQuietRmsThreshold: 0.01,
}) satisfies AudioAnalysisConfig;

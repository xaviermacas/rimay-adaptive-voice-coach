import { AUDIO_METRICS_V1_CONFIG } from '../../config/audioAnalysis';
import { downmixToMono } from './pcm';
import type {
  AudioAnalysisConfig,
  AudioAnalysisResult,
  AudioQualityFlag,
  DeterministicMetrics,
  PcmAudioData,
} from './types';
import {
  createAudioAnalysisError,
  isValidAudioAnalysisConfig,
  validatePcmAudioData,
} from './validation';

interface AnalysisWindow {
  readonly startSample: number;
  readonly endSample: number;
  readonly rms: number;
}

interface SampleSegment {
  readonly startSample: number;
  readonly endSample: number;
}

function roundTo(value: number, decimalPlaces: number): number {
  const factor = 10 ** decimalPlaces;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function sampleDurationMs(sampleCount: number, sampleRateHz: number): number {
  return (sampleCount / sampleRateHz) * 1_000;
}

function calculateRms(samples: Float32Array, start: number, end: number): number {
  let sumOfSquares = 0;

  for (let index = start; index < end; index += 1) {
    const sample = samples[index] ?? 0;
    sumOfSquares += sample * sample;
  }

  return Math.sqrt(sumOfSquares / (end - start));
}

function createWindows(
  mono: Float32Array,
  sampleRateHz: number,
  windowDurationMs: number,
): readonly AnalysisWindow[] {
  const windowSizeSamples = Math.max(
    1,
    Math.round((sampleRateHz * windowDurationMs) / 1_000),
  );
  const windows: AnalysisWindow[] = [];

  for (let startSample = 0; startSample < mono.length; startSample += windowSizeSamples) {
    const endSample = Math.min(startSample + windowSizeSamples, mono.length);
    windows.push({
      startSample,
      endSample,
      rms: calculateRms(mono, startSample, endSample),
    });
  }

  return windows;
}

function percentile(values: readonly number[], percentileValue: number): number {
  const sortedValues = [...values].sort((left, right) => left - right);
  const index = Math.floor(percentileValue * (sortedValues.length - 1));
  return sortedValues[index] ?? 0;
}

function createSpeechSegments(
  windows: readonly AnalysisWindow[],
  thresholdRms: number,
): readonly SampleSegment[] {
  const segments: SampleSegment[] = [];

  for (const window of windows) {
    if (window.rms < thresholdRms) {
      continue;
    }

    const previous = segments.at(-1);
    if (previous !== undefined && previous.endSample === window.startSample) {
      segments[segments.length - 1] = {
        startSample: previous.startSample,
        endSample: window.endSample,
      };
    } else {
      segments.push({
        startSample: window.startSample,
        endSample: window.endSample,
      });
    }
  }

  return segments;
}

function joinSpeechSegments(
  segments: readonly SampleSegment[],
  sampleRateHz: number,
  maximumJoinedSilenceMs: number,
): readonly SampleSegment[] {
  const joined: SampleSegment[] = [];

  for (const segment of segments) {
    const previous = joined.at(-1);
    if (previous === undefined) {
      joined.push(segment);
      continue;
    }

    const gapDurationMs = sampleDurationMs(
      segment.startSample - previous.endSample,
      sampleRateHz,
    );

    if (gapDurationMs < maximumJoinedSilenceMs) {
      joined[joined.length - 1] = {
        startSample: previous.startSample,
        endSample: segment.endSample,
      };
    } else {
      joined.push(segment);
    }
  }

  return joined;
}

function collectQualityFlags(input: {
  readonly totalDurationMs: number;
  readonly estimatedSpeechDurationMs: number;
  readonly globalRms: number;
  readonly possibleClipping: boolean;
  readonly config: AudioAnalysisConfig;
}): readonly AudioQualityFlag[] {
  const flags: AudioQualityFlag[] = [];

  if (input.totalDurationMs < input.config.minimumTotalDurationMs) {
    flags.push('audio_too_short');
  }
  if (input.estimatedSpeechDurationMs < input.config.minimumSpeechDurationMs) {
    flags.push('no_speech_detected');
  }
  if (input.globalRms < input.config.tooQuietRmsThreshold) {
    flags.push('too_quiet');
  }
  if (input.possibleClipping) {
    flags.push('possible_clipping');
  }

  flags.push('transcription_missing');
  return flags;
}

export function analyzePcmAudio(
  input: PcmAudioData,
  config: AudioAnalysisConfig = AUDIO_METRICS_V1_CONFIG,
): AudioAnalysisResult {
  if (!isValidAudioAnalysisConfig(config)) {
    return {
      status: 'error',
      error: createAudioAnalysisError('invalid_configuration'),
    };
  }

  const validationError = validatePcmAudioData(input);
  if (validationError !== null) {
    return { status: 'error', error: validationError };
  }

  const mono = downmixToMono(input.channels);
  const windows = createWindows(
    mono,
    input.sampleRateHz,
    config.windowDurationMs,
  );
  const estimatedNoiseFloorRms = percentile(
    windows.map((window) => window.rms),
    config.noiseFloorPercentile,
  );
  const adaptiveVoiceThresholdRms = Math.max(
    config.minimumAdaptiveVoiceThresholdRms,
    estimatedNoiseFloorRms * config.noiseFloorMultiplier,
  );

  const initialSpeechSegments = createSpeechSegments(
    windows,
    adaptiveVoiceThresholdRms,
  );
  const joinedSpeechSegments = joinSpeechSegments(
    initialSpeechSegments,
    input.sampleRateHz,
    config.maximumJoinedSilenceMs,
  );
  const speechSegments = joinedSpeechSegments.filter(
    (segment) =>
      sampleDurationMs(
        segment.endSample - segment.startSample,
        input.sampleRateHz,
      ) >= config.minimumSpeechSegmentDurationMs,
  );

  let sumOfSquares = 0;
  let peak = 0;
  let clippedSampleCount = 0;
  for (const sample of mono) {
    const absoluteSample = Math.abs(sample);
    sumOfSquares += sample * sample;
    peak = Math.max(peak, absoluteSample);
    if (absoluteSample >= config.clippingAmplitudeThreshold) {
      clippedSampleCount += 1;
    }
  }

  const speechSampleCount = speechSegments.reduce(
    (total, segment) => total + segment.endSample - segment.startSample,
    0,
  );
  const silenceSampleCount = Math.max(0, mono.length - speechSampleCount);
  const pauseDurationsMs: number[] = [];

  for (let index = 1; index < speechSegments.length; index += 1) {
    const previous = speechSegments[index - 1];
    const current = speechSegments[index];
    if (previous === undefined || current === undefined) {
      continue;
    }

    const pauseDurationMs = sampleDurationMs(
      current.startSample - previous.endSample,
      input.sampleRateHz,
    );
    if (pauseDurationMs >= config.minimumPauseDurationMs) {
      pauseDurationsMs.push(pauseDurationMs);
    }
  }

  const totalDurationMs = Math.round(
    sampleDurationMs(mono.length, input.sampleRateHz),
  );
  const estimatedSpeechDurationMs = Math.round(
    sampleDurationMs(speechSampleCount, input.sampleRateHz),
  );
  const globalRms = Math.sqrt(sumOfSquares / mono.length);
  const clippedSampleRatio = clippedSampleCount / mono.length;
  const possibleClipping =
    clippedSampleRatio >= config.possibleClippingRatioThreshold;
  const pauseDurationTotalMs = pauseDurationsMs.reduce(
    (total, durationMs) => total + durationMs,
    0,
  );

  const metrics: DeterministicMetrics = {
    algorithmVersion: config.algorithmVersion,
    sampleRateHz: input.sampleRateHz,
    channelCount: input.channels.length,
    totalDurationMs,
    analyzedDurationMs: totalDurationMs,
    estimatedSpeechDurationMs,
    silenceDurationMs: Math.round(
      sampleDurationMs(silenceSampleCount, input.sampleRateHz),
    ),
    silenceRatio: roundTo(silenceSampleCount / mono.length, 6),
    pauseCount: pauseDurationsMs.length,
    averagePauseDurationMs:
      pauseDurationsMs.length === 0
        ? null
        : Math.round(pauseDurationTotalMs / pauseDurationsMs.length),
    maximumPauseDurationMs:
      pauseDurationsMs.length === 0
        ? null
        : Math.round(Math.max(...pauseDurationsMs)),
    rms: roundTo(globalRms, 6),
    peak: roundTo(peak, 6),
    estimatedNoiseFloorRms: roundTo(estimatedNoiseFloorRms, 6),
    adaptiveVoiceThresholdRms: roundTo(adaptiveVoiceThresholdRms, 6),
    clippedSampleRatio: roundTo(clippedSampleRatio, 6),
    possibleClipping,
    wordCount: null,
    wordsPerMinute: null,
    promptSimilarity: null,
    qualityFlags: collectQualityFlags({
      totalDurationMs,
      estimatedSpeechDurationMs,
      globalRms,
      possibleClipping,
      config,
    }),
    analysisWarnings: [],
  };

  return { status: 'success', metrics };
}

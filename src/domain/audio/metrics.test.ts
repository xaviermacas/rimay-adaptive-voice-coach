import { describe, expect, it } from 'vitest';

import { AUDIO_METRICS_V1_CONFIG } from '../../config/audioAnalysis';
import {
  createConstantSignal,
  createPcmAudio,
  createSegmentedSignal,
  createSilence,
  createSineSignal,
} from '../../test/fixtures/audio/syntheticAudio';
import { analyzePcmAudio } from './metrics';
import type { AudioAnalysisResult, DeterministicMetrics } from './types';

function expectSuccess(result: AudioAnalysisResult): DeterministicMetrics {
  expect(result.status).toBe('success');
  if (result.status === 'error') {
    throw new Error(`Expected metrics but received ${result.error.code}.`);
  }
  return result.metrics;
}

describe('audio-metrics-v1', () => {
  it('calcula silencio total sin inventar pausas ni valores de texto', () => {
    const signal = createSilence({ durationMs: 1_000, sampleRateHz: 1_000 });
    const metrics = expectSuccess(
      analyzePcmAudio(createPcmAudio([signal], 1_000)),
    );

    expect(metrics).toMatchObject({
      algorithmVersion: 'audio-metrics-v1',
      sampleRateHz: 1_000,
      channelCount: 1,
      totalDurationMs: 1_000,
      analyzedDurationMs: 1_000,
      estimatedSpeechDurationMs: 0,
      silenceDurationMs: 1_000,
      silenceRatio: 1,
      pauseCount: 0,
      averagePauseDurationMs: null,
      maximumPauseDurationMs: null,
      rms: 0,
      peak: 0,
      estimatedNoiseFloorRms: 0,
      adaptiveVoiceThresholdRms: 0.015,
      clippedSampleRatio: 0,
      possibleClipping: false,
      wordCount: null,
      wordsPerMinute: null,
      promptSimilarity: null,
      analysisWarnings: [],
    });
    expect(metrics.qualityFlags).toEqual([
      'no_speech_detected',
      'too_quiet',
      'transcription_missing',
    ]);
  });

  it('calcula RMS y pico de una señal sinusoidal continua con tolerancia explícita', () => {
    const signal = createSineSignal({
      amplitude: 0.5,
      durationMs: 1_000,
      frequencyHz: 50,
      sampleRateHz: 2_000,
    });
    const metrics = expectSuccess(
      analyzePcmAudio(createPcmAudio([signal], 2_000)),
    );

    expect(metrics.rms).toBeCloseTo(0.5 / Math.sqrt(2), 6);
    expect(metrics.peak).toBeCloseTo(0.5, 6);
    expect(metrics.totalDurationMs).toBe(1_000);
    expect(metrics.qualityFlags).toContain('no_speech_detected');
  });

  it('detecta dos pausas internas conocidas y excluye silencios de la voz estimada', () => {
    const signal = createSegmentedSignal(
      [
        { amplitude: 0.2, durationMs: 400 },
        { amplitude: 0, durationMs: 400 },
        { amplitude: 0.2, durationMs: 400 },
        { amplitude: 0, durationMs: 400 },
        { amplitude: 0.2, durationMs: 400 },
      ],
      1_000,
    );
    const metrics = expectSuccess(
      analyzePcmAudio(createPcmAudio([signal], 1_000)),
    );

    expect(metrics.estimatedSpeechDurationMs).toBe(1_200);
    expect(metrics.silenceDurationMs).toBe(800);
    expect(metrics.silenceRatio).toBeCloseTo(0.4, 6);
    expect(metrics.pauseCount).toBe(2);
    expect(metrics.averagePauseDurationMs).toBe(400);
    expect(metrics.maximumPauseDurationMs).toBe(400);
    expect(metrics.rms).toBeCloseTo(Math.sqrt(0.024), 6);
  });

  it('une actividad separada por menos de 200 ms, incluida la brecha unida', () => {
    const signal = createSegmentedSignal(
      [
        { amplitude: 0.2, durationMs: 200 },
        { amplitude: 0, durationMs: 180 },
        { amplitude: 0.2, durationMs: 200 },
      ],
      1_000,
    );
    const metrics = expectSuccess(
      analyzePcmAudio(createPcmAudio([signal], 1_000)),
    );

    expect(metrics.totalDurationMs).toBe(580);
    expect(metrics.estimatedSpeechDurationMs).toBe(580);
    expect(metrics.silenceDurationMs).toBe(0);
    expect(metrics.pauseCount).toBe(0);
  });

  it('no une una brecha de exactamente 200 ms', () => {
    const signal = createSegmentedSignal(
      [
        { amplitude: 0.2, durationMs: 200 },
        { amplitude: 0, durationMs: 200 },
        { amplitude: 0.2, durationMs: 200 },
      ],
      1_000,
    );
    const metrics = expectSuccess(
      analyzePcmAudio(createPcmAudio([signal], 1_000)),
    );

    expect(metrics.estimatedSpeechDurationMs).toBe(400);
    expect(metrics.silenceDurationMs).toBe(200);
    expect(metrics.pauseCount).toBe(0);
  });

  it('descarta como ruido transitorio un segmento de voz menor de 120 ms', () => {
    const signal = createSegmentedSignal(
      [
        { amplitude: 0, durationMs: 400 },
        { amplitude: 0.2, durationMs: 100 },
        { amplitude: 0, durationMs: 400 },
      ],
      1_000,
    );
    const metrics = expectSuccess(
      analyzePcmAudio(createPcmAudio([signal], 1_000)),
    );

    expect(metrics.estimatedSpeechDurationMs).toBe(0);
    expect(metrics.silenceDurationMs).toBe(900);
    expect(metrics.qualityFlags).toContain('no_speech_detected');
  });

  it('usa el elemento inferior del percentil 20 y multiplica el piso por tres', () => {
    const signal = createSegmentedSignal(
      [0, 0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.09].map(
        (amplitude) => ({ amplitude, durationMs: 20 }),
      ),
      1_000,
    );
    const metrics = expectSuccess(
      analyzePcmAudio(createPcmAudio([signal], 1_000)),
    );

    expect(metrics.estimatedNoiseFloorRms).toBeCloseTo(0.01, 6);
    expect(metrics.adaptiveVoiceThresholdRms).toBeCloseTo(0.03, 6);
  });

  it('calcula la proporción de clipping y su bandera', () => {
    const signal = createConstantSignal({
      amplitude: 1,
      durationMs: 1_000,
      sampleRateHz: 1_000,
    });
    const metrics = expectSuccess(
      analyzePcmAudio(createPcmAudio([signal], 1_000)),
    );

    expect(metrics.peak).toBe(1);
    expect(metrics.clippedSampleRatio).toBe(1);
    expect(metrics.possibleClipping).toBe(true);
    expect(metrics.qualityFlags).toContain('possible_clipping');
  });

  it('activa possible_clipping en el ratio exacto de 0.001', () => {
    const signal = new Float32Array(1_000);
    signal[500] = 0.99;
    const metrics = expectSuccess(
      analyzePcmAudio(createPcmAudio([signal], 1_000)),
    );

    expect(metrics.clippedSampleRatio).toBe(0.001);
    expect(metrics.possibleClipping).toBe(true);
  });

  it('marca una señal corta sin descartar sus métricas medibles', () => {
    const signal = createSegmentedSignal(
      [
        { amplitude: 0, durationMs: 100 },
        { amplitude: 0.2, durationMs: 300 },
      ],
      1_000,
    );
    const metrics = expectSuccess(
      analyzePcmAudio(createPcmAudio([signal], 1_000)),
    );

    expect(metrics.totalDurationMs).toBe(400);
    expect(metrics.estimatedSpeechDurationMs).toBe(300);
    expect(metrics.qualityFlags).toContain('audio_too_short');
    expect(metrics.qualityFlags).not.toContain('no_speech_detected');
  });

  it('marca una señal demasiado silenciosa', () => {
    const signal = createConstantSignal({
      amplitude: 0.005,
      durationMs: 1_000,
      sampleRateHz: 1_000,
    });
    const metrics = expectSuccess(
      analyzePcmAudio(createPcmAudio([signal], 1_000)),
    );

    expect(metrics.rms).toBeCloseTo(0.005, 6);
    expect(metrics.qualityFlags).toContain('too_quiet');
    expect(metrics.qualityFlags).toContain('no_speech_detected');
  });

  it('promedia los canales estéreo antes de medir la señal mono', () => {
    const left = createConstantSignal({
      amplitude: 0.4,
      durationMs: 1_000,
      sampleRateHz: 1_000,
    });
    const right = createConstantSignal({
      amplitude: -0.2,
      durationMs: 1_000,
      sampleRateHz: 1_000,
    });
    const metrics = expectSuccess(
      analyzePcmAudio(createPcmAudio([left, right], 1_000)),
    );

    expect(metrics.channelCount).toBe(2);
    expect(metrics.rms).toBeCloseTo(0.1, 6);
    expect(metrics.peak).toBeCloseTo(0.1, 6);
  });

  it('conserva duraciones y proporciones entre frecuencias de muestreo', () => {
    const segments = [
      { amplitude: 0, durationMs: 200 },
      { amplitude: 0.2, durationMs: 600 },
      { amplitude: 0, durationMs: 200 },
    ] as const;
    const metrics8Khz = expectSuccess(
      analyzePcmAudio(
        createPcmAudio(createChannels(segments, 8_000), 8_000),
      ),
    );
    const metrics48Khz = expectSuccess(
      analyzePcmAudio(
        createPcmAudio(createChannels(segments, 48_000), 48_000),
      ),
    );

    expect(metrics8Khz.totalDurationMs).toBe(1_000);
    expect(metrics48Khz.totalDurationMs).toBe(1_000);
    expect(metrics8Khz.estimatedSpeechDurationMs).toBe(600);
    expect(metrics48Khz.estimatedSpeechDurationMs).toBe(600);
    expect(metrics8Khz.silenceRatio).toBeCloseTo(metrics48Khz.silenceRatio, 6);
    expect(metrics8Khz.rms).toBeCloseTo(metrics48Khz.rms, 6);
  });

  it('devuelve errores tipados para muestras insuficientes o inválidas', () => {
    const emptyResult = analyzePcmAudio(
      createPcmAudio([new Float32Array()], 48_000),
    );
    expect(emptyResult).toMatchObject({
      status: 'error',
      error: { code: 'insufficient_samples' },
    });

    const nonFiniteResult = analyzePcmAudio(
      createPcmAudio([new Float32Array([0, Number.NaN])], 48_000),
    );
    expect(nonFiniteResult).toMatchObject({
      status: 'error',
      error: { code: 'invalid_audio_data' },
    });

    const mismatchedChannelsResult = analyzePcmAudio(
      createPcmAudio(
        [new Float32Array([0, 0]), new Float32Array([0])],
        48_000,
      ),
    );
    expect(mismatchedChannelsResult).toMatchObject({
      status: 'error',
      error: { code: 'invalid_audio_data' },
    });
  });

  it('rechaza configuración inválida', () => {
    const result = analyzePcmAudio(
      createPcmAudio([new Float32Array([0])], 48_000),
      { ...AUDIO_METRICS_V1_CONFIG, windowDurationMs: 0 },
    );

    expect(result).toMatchObject({
      status: 'error',
      error: { code: 'invalid_configuration' },
    });
  });

  it('produce el mismo objeto para la misma entrada y versión', () => {
    const signal = createSegmentedSignal(
      [
        { amplitude: 0, durationMs: 200 },
        { amplitude: 0.2, durationMs: 600 },
        { amplitude: 0, durationMs: 200 },
      ],
      1_000,
    );
    const input = createPcmAudio([signal], 1_000);

    expect(analyzePcmAudio(input)).toEqual(analyzePcmAudio(input));
  });
});

function createChannels(
  segments: readonly { readonly amplitude: number; readonly durationMs: number }[],
  sampleRateHz: number,
): readonly Float32Array[] {
  return [createSegmentedSignal(segments, sampleRateHz)];
}

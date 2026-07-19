import { describe, expect, it } from 'vitest';

import type { SpeechTextSource } from '../contracts/speech';
import { calculateTextMetrics } from './metrics';
import { createSpeechTextResult } from './normalization';
import type { TextMetricsAudioEvidence } from './types';

function audioEvidence(
  overrides: Partial<TextMetricsAudioEvidence> = {},
): TextMetricsAudioEvidence {
  return {
    totalDurationMs: 30_000,
    estimatedSpeechDurationMs: 10_000,
    minimumSpeechDurationMs: 300,
    qualityFlags: [],
    ...overrides,
  };
}

function calculate(
  targetText: string,
  transcribedText: string,
  options: {
    readonly source?: SpeechTextSource;
    readonly audioEvidence?: TextMetricsAudioEvidence | null;
  } = {},
) {
  return calculateTextMetrics({
    targetText,
    speechText: createSpeechTextResult({
      originalText: transcribedText,
      source: options.source ?? 'browser',
      languageRequested: options.source === 'manual' ? null : 'es-EC',
      isFinal: true,
      createdAt: '2026-07-18T12:00:00.000Z',
    }),
    audioEvidence: options.audioEvidence ?? null,
  });
}

function metricsOf(result: ReturnType<typeof calculate>) {
  expect(result.status).toBe('success');
  if (result.status === 'error') {
    throw new Error(result.error.code);
  }
  return result.metrics;
}

describe('text-metrics-v1', () => {
  it('alinea una coincidencia exacta', () => {
    const metrics = metricsOf(calculate('hola mundo', 'hola mundo'));

    expect(metrics).toMatchObject({
      algorithmVersion: 'text-metrics-v1',
      targetWordCount: 2,
      transcribedWordCount: 2,
      matchedWordCount: 2,
      wordErrorCount: 0,
      wordErrorRate: 0,
      textSimilarity: 1,
    });
  });

  it('distingue omisión, adición y sustitución', () => {
    expect(metricsOf(calculate('uno dos tres', 'uno tres')).omittedWords).toEqual([
      { index: 1, token: 'dos' },
    ]);
    expect(metricsOf(calculate('uno tres', 'uno dos tres')).additionalWords).toEqual([
      { index: 1, token: 'dos' },
    ]);
    expect(metricsOf(calculate('uno dos', 'uno diez')).substitutedWords).toEqual([
      {
        targetIndex: 1,
        transcribedIndex: 1,
        targetToken: 'dos',
        transcribedToken: 'diez',
      },
    ]);
  });

  it('cuenta una sustitución una sola vez entre varios errores', () => {
    const metrics = metricsOf(calculate('uno dos tres', 'uno diez cuatro extra'));

    expect(metrics.substitutedWords).toHaveLength(2);
    expect(metrics.additionalWords).toHaveLength(1);
    expect(metrics.wordErrorCount).toBe(3);
  });

  it('resuelve empates con sustitución antes de omisión y adición', () => {
    const metrics = metricsOf(calculate('a b', 'b a'));

    expect(metrics.substitutedWords).toHaveLength(2);
    expect(metrics.omittedWords).toHaveLength(0);
    expect(metrics.additionalWords).toHaveLength(0);
  });

  it('permite WER mayor que uno y limita la similitud a cero', () => {
    const metrics = metricsOf(calculate('uno', 'dos tres cuatro cinco'));

    expect(metrics.wordErrorRate).toBe(4);
    expect(metrics.textSimilarity).toBe(0);
  });

  it('devuelve empty_target sin fabricar métricas', () => {
    expect(calculate(' ¡! ', 'texto')).toEqual({
      status: 'error',
      error: expect.objectContaining({ code: 'empty_target' }),
    });
  });

  it('compara tildes sin perderlas en los detalles visibles', () => {
    const metrics = metricsOf(calculate('La canción', 'la cancion'));

    expect(metrics.matchedWordCount).toBe(2);
    expect(metrics.matchedWords[1]?.token).toBe('canción');
    expect(metrics.textSimilarity).toBe(1);
  });

  it('mantiene n y ñ como letras diferentes', () => {
    const metrics = metricsOf(calculate('año', 'ano'));

    expect(metrics.substitutedWords).toHaveLength(1);
    expect(metrics.textSimilarity).toBe(0);
  });

  it('calcula WPM con duración total de una grabación real', () => {
    const metrics = metricsOf(
      calculate('uno dos tres', 'uno dos tres', {
        audioEvidence: audioEvidence(),
      }),
    );

    expect(metrics.wordsPerMinute).toBe(6);
  });

  it.each([
    [
      'duración cero',
      'browser' as const,
      audioEvidence({ totalDurationMs: 0 }),
      'invalid_total_duration',
    ],
    [
      'duración no finita',
      'browser' as const,
      audioEvidence({ totalDurationMs: Number.NaN }),
      'invalid_total_duration',
    ],
    ['demo sin audio', 'demo' as const, null, 'demo_source'],
    ['manual sin audio', 'manual' as const, null, 'no_real_recording'],
  ])('devuelve WPM nulo para %s', (_name, source, evidence, reason) => {
    const metrics = metricsOf(
      calculate('uno dos', 'uno dos', {
        source,
        audioEvidence: evidence,
      }),
    );

    expect(metrics.wordsPerMinute).toBeNull();
    expect(metrics.wordsPerMinuteUnavailableReason).toBe(reason);
  });

  it.each(['no_speech_detected', 'too_quiet'] as const)(
    'inhabilita WPM cuando el audio contiene %s',
    (qualityFlag) => {
      const metrics = metricsOf(
        calculate('uno dos', 'uno dos', {
          source: 'manual',
          audioEvidence: audioEvidence({ qualityFlags: [qualityFlag] }),
        }),
      );

      expect(metrics.wordsPerMinute).toBeNull();
      expect(metrics.wordsPerMinuteUnavailableReason).toBe(
        'insufficient_voice_activity',
      );
    },
  );

  it('inhabilita WPM si la voz estimada no alcanza el umbral configurado', () => {
    const metrics = metricsOf(
      calculate('uno dos', 'uno dos', {
        source: 'manual',
        audioEvidence: audioEvidence({ estimatedSpeechDurationMs: 299 }),
      }),
    );

    expect(metrics.wordsPerMinute).toBeNull();
    expect(metrics.wordsPerMinuteUnavailableReason).toBe(
      'insufficient_voice_activity',
    );
  });

  it('calcula WPM manual con audio válido y duración total como denominador', () => {
    const metrics = metricsOf(
      calculate('uno dos', 'uno dos', {
        source: 'manual',
        audioEvidence: audioEvidence({
          totalDurationMs: 20_000,
          estimatedSpeechDurationMs: 2_000,
        }),
      }),
    );

    expect(metrics.source).toBe('manual');
    expect(metrics.wordsPerMinute).toBe(6);
    expect(metrics.wordsPerMinuteUnavailableReason).toBeNull();
  });

  it('produce el mismo resultado ante la misma entrada', () => {
    expect(calculate('a b c', 'a x c extra')).toEqual(
      calculate('a b c', 'a x c extra'),
    );
  });
});

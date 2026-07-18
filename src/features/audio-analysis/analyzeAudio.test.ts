import { describe, expect, it, vi } from 'vitest';

import {
  createAudioBufferLike,
  createSegmentedSignal,
} from '../../test/fixtures/audio/syntheticAudio';
import {
  analyzeAudioBlob,
  analyzeAudioBuffer,
  type AudioContextLike,
} from './analyzeAudio';

function createDecodedBuffer() {
  return createAudioBufferLike(
    [
      createSegmentedSignal(
        [
          { amplitude: 0, durationMs: 200 },
          { amplitude: 0.2, durationMs: 600 },
          { amplitude: 0, durationMs: 200 },
        ],
        1_000,
      ),
    ],
    1_000,
  );
}

describe('analyzeAudioBuffer', () => {
  it('acepta un AudioBuffer decodificado sin depender de React', () => {
    const result = analyzeAudioBuffer(createDecodedBuffer());

    expect(result).toMatchObject({
      status: 'success',
      metrics: {
        algorithmVersion: 'audio-metrics-v1',
        totalDurationMs: 1_000,
        estimatedSpeechDurationMs: 600,
      },
    });
  });

  it('rechaza un AudioBuffer cuyo canal no coincide con su longitud declarada', () => {
    const result = analyzeAudioBuffer({
      ...createDecodedBuffer(),
      length: 2_000,
    });

    expect(result).toMatchObject({
      status: 'error',
      error: { code: 'invalid_audio_data' },
    });
  });
});

describe('analyzeAudioBlob', () => {
  it('decodifica un Blob, calcula métricas y cierra AudioContext', async () => {
    const close = vi.fn().mockResolvedValue(undefined);
    const decodeAudioData = vi.fn().mockResolvedValue(createDecodedBuffer());
    const context: AudioContextLike = { close, decodeAudioData };
    const blob = new Blob(['audio-ficticio'], { type: 'audio/webm' });

    const result = await analyzeAudioBlob(blob, undefined, {
      createAudioContext: () => context,
    });

    expect(result).toMatchObject({
      status: 'success',
      metrics: { totalDurationMs: 1_000 },
    });
    expect(decodeAudioData).toHaveBeenCalledTimes(1);
    expect(decodeAudioData.mock.calls[0]?.[0]).toBeInstanceOf(ArrayBuffer);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('devuelve decode_failed sin métricas y cierra el contexto', async () => {
    const close = vi.fn().mockResolvedValue(undefined);
    const context: AudioContextLike = {
      close,
      decodeAudioData: vi.fn().mockRejectedValue(new Error('codec error')),
    };

    const result = await analyzeAudioBlob(
      new Blob(['audio-incompatible'], { type: 'audio/unknown' }),
      undefined,
      { createAudioContext: () => context },
    );

    expect(result).toEqual({
      status: 'error',
      error: expect.objectContaining({ code: 'decode_failed' }),
    });
    expect(result).not.toHaveProperty('metrics');
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('distingue Web Audio no disponible de un fallo de decodificación', async () => {
    const result = await analyzeAudioBlob(
      new Blob(['audio-ficticio'], { type: 'audio/webm' }),
      undefined,
      {
        createAudioContext: () => {
          throw new Error('unsupported');
        },
      },
    );

    expect(result).toMatchObject({
      status: 'error',
      error: { code: 'unsupported_audio' },
    });
  });

  it('rechaza un Blob vacío antes de crear AudioContext', async () => {
    const createAudioContext = vi.fn();
    const result = await analyzeAudioBlob(new Blob(), undefined, {
      createAudioContext,
    });

    expect(result).toMatchObject({
      status: 'error',
      error: { code: 'insufficient_samples' },
    });
    expect(createAudioContext).not.toHaveBeenCalled();
  });
});

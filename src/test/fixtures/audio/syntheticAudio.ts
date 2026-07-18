import type {
  AudioBufferLike,
  PcmAudioData,
} from '../../../domain/audio';

interface SignalOptions {
  readonly durationMs: number;
  readonly sampleRateHz: number;
}

interface ConstantSignalOptions extends SignalOptions {
  readonly amplitude: number;
}

interface SineSignalOptions extends ConstantSignalOptions {
  readonly frequencyHz: number;
}

export interface SignalSegment {
  readonly durationMs: number;
  readonly amplitude: number;
}

function sampleCountForDuration(
  durationMs: number,
  sampleRateHz: number,
): number {
  return Math.round((durationMs * sampleRateHz) / 1_000);
}

export function createConstantSignal(
  options: ConstantSignalOptions,
): Float32Array {
  const samples = new Float32Array(
    sampleCountForDuration(options.durationMs, options.sampleRateHz),
  );
  samples.fill(options.amplitude);
  return samples;
}

export function createSilence(options: SignalOptions): Float32Array {
  return createConstantSignal({ ...options, amplitude: 0 });
}

export function createSineSignal(options: SineSignalOptions): Float32Array {
  const sampleCount = sampleCountForDuration(
    options.durationMs,
    options.sampleRateHz,
  );
  const samples = new Float32Array(sampleCount);

  for (let index = 0; index < sampleCount; index += 1) {
    samples[index] =
      options.amplitude *
      Math.sin((2 * Math.PI * options.frequencyHz * index) / options.sampleRateHz);
  }

  return samples;
}

export function createSegmentedSignal(
  segments: readonly SignalSegment[],
  sampleRateHz: number,
): Float32Array {
  const segmentSignals = segments.map((segment) =>
    createConstantSignal({ ...segment, sampleRateHz }),
  );
  const totalSampleCount = segmentSignals.reduce(
    (total, segment) => total + segment.length,
    0,
  );
  const samples = new Float32Array(totalSampleCount);
  let offset = 0;

  for (const segment of segmentSignals) {
    samples.set(segment, offset);
    offset += segment.length;
  }

  return samples;
}

export function createPcmAudio(
  channels: readonly Float32Array[],
  sampleRateHz: number,
): PcmAudioData {
  return { channels, sampleRateHz };
}

export function createAudioBufferLike(
  channels: readonly Float32Array[],
  sampleRateHz: number,
): AudioBufferLike {
  return {
    numberOfChannels: channels.length,
    sampleRate: sampleRateHz,
    length: channels[0]?.length ?? 0,
    getChannelData(channel: number): Float32Array {
      const data = channels[channel];
      if (data === undefined) {
        throw new RangeError('Synthetic channel does not exist.');
      }
      return data;
    },
  };
}

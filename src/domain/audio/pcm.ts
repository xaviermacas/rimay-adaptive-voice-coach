import type { AudioBufferLike, PcmAudioData } from './types';

export function pcmFromAudioBuffer(audioBuffer: AudioBufferLike): PcmAudioData {
  const channels: Float32Array[] = [];

  for (let channelIndex = 0; channelIndex < audioBuffer.numberOfChannels; channelIndex += 1) {
    channels.push(audioBuffer.getChannelData(channelIndex));
  }

  return {
    sampleRateHz: audioBuffer.sampleRate,
    channels,
  };
}

export function downmixToMono(channels: readonly Float32Array[]): Float32Array {
  const sampleCount = channels[0]?.length ?? 0;
  const mono = new Float32Array(sampleCount);

  for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex += 1) {
    let sum = 0;

    for (const channel of channels) {
      sum += channel[sampleIndex] ?? 0;
    }

    mono[sampleIndex] = sum / channels.length;
  }

  return mono;
}

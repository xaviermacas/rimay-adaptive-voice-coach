import { AUDIO_METRICS_V1_CONFIG } from '../../config/audioAnalysis';
import {
  analyzePcmAudio,
  pcmFromAudioBuffer,
  type AudioAnalysisConfig,
  type AudioAnalysisResult,
  type AudioBufferLike,
} from '../../domain/audio';
import { createAudioAnalysisError } from '../../domain/audio/validation';

export interface AudioContextLike {
  decodeAudioData(audioData: ArrayBuffer): Promise<AudioBufferLike>;
  close(): Promise<void>;
}

export type AudioContextFactory = () => AudioContextLike;

interface AnalyzeAudioBlobDependencies {
  readonly createAudioContext?: AudioContextFactory;
}

function createBrowserAudioContext(): AudioContextLike {
  if (typeof AudioContext === 'undefined') {
    throw new Error('Web Audio API is unavailable.');
  }

  return new AudioContext();
}

export function analyzeAudioBuffer(
  audioBuffer: AudioBufferLike,
  config: AudioAnalysisConfig = AUDIO_METRICS_V1_CONFIG,
): AudioAnalysisResult {
  try {
    if (
      !Number.isInteger(audioBuffer.numberOfChannels) ||
      audioBuffer.numberOfChannels <= 0 ||
      !Number.isInteger(audioBuffer.length) ||
      audioBuffer.length < 0
    ) {
      return {
        status: 'error',
        error: createAudioAnalysisError('invalid_audio_data'),
      };
    }

    const pcmAudio = pcmFromAudioBuffer(audioBuffer);
    if (pcmAudio.channels.some((channel) => channel.length !== audioBuffer.length)) {
      return {
        status: 'error',
        error: createAudioAnalysisError('invalid_audio_data'),
      };
    }

    return analyzePcmAudio(pcmAudio, config);
  } catch {
    return {
      status: 'error',
      error: createAudioAnalysisError('invalid_audio_data'),
    };
  }
}

export async function analyzeAudioBlob(
  audioBlob: Blob,
  config: AudioAnalysisConfig = AUDIO_METRICS_V1_CONFIG,
  dependencies: AnalyzeAudioBlobDependencies = {},
): Promise<AudioAnalysisResult> {
  if (!(audioBlob instanceof Blob) || audioBlob.size === 0) {
    return {
      status: 'error',
      error: createAudioAnalysisError('insufficient_samples'),
    };
  }

  let audioContext: AudioContextLike;
  try {
    audioContext = (dependencies.createAudioContext ?? createBrowserAudioContext)();
  } catch {
    return {
      status: 'error',
      error: createAudioAnalysisError('unsupported_audio'),
    };
  }

  try {
    const encodedAudio = await audioBlob.arrayBuffer();
    if (encodedAudio.byteLength === 0) {
      return {
        status: 'error',
        error: createAudioAnalysisError('insufficient_samples'),
      };
    }

    const audioBuffer = await audioContext.decodeAudioData(encodedAudio);
    return analyzeAudioBuffer(audioBuffer, config);
  } catch {
    return {
      status: 'error',
      error: createAudioAnalysisError('decode_failed'),
    };
  } finally {
    try {
      await audioContext.close();
    } catch {
      // Closing is best-effort and must not replace a valid analysis result.
    }
  }
}

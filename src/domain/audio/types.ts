export type AudioAnalysisAlgorithmVersion = 'audio-metrics-v1';

export interface AudioAnalysisConfig {
  readonly algorithmVersion: AudioAnalysisAlgorithmVersion;
  readonly windowDurationMs: number;
  readonly noiseFloorPercentile: number;
  readonly minimumAdaptiveVoiceThresholdRms: number;
  readonly noiseFloorMultiplier: number;
  readonly maximumJoinedSilenceMs: number;
  readonly minimumSpeechSegmentDurationMs: number;
  readonly minimumPauseDurationMs: number;
  readonly clippingAmplitudeThreshold: number;
  readonly possibleClippingRatioThreshold: number;
  readonly minimumTotalDurationMs: number;
  readonly minimumSpeechDurationMs: number;
  readonly tooQuietRmsThreshold: number;
}

export interface PcmAudioData {
  readonly sampleRateHz: number;
  readonly channels: readonly Float32Array[];
}

export interface AudioBufferLike {
  readonly numberOfChannels: number;
  readonly sampleRate: number;
  readonly length: number;
  getChannelData(channel: number): Float32Array;
}

export type AudioQualityFlag =
  | 'audio_too_short'
  | 'no_speech_detected'
  | 'too_quiet'
  | 'possible_clipping'
  | 'transcription_missing';

export interface DeterministicMetrics {
  readonly algorithmVersion: AudioAnalysisAlgorithmVersion;
  readonly sampleRateHz: number;
  readonly channelCount: number;
  readonly totalDurationMs: number;
  readonly analyzedDurationMs: number;
  readonly estimatedSpeechDurationMs: number;
  readonly silenceDurationMs: number;
  readonly silenceRatio: number;
  readonly pauseCount: number;
  readonly averagePauseDurationMs: number | null;
  readonly maximumPauseDurationMs: number | null;
  /** Global root mean square amplitude, constrained to [0, 1]. */
  readonly rms: number;
  /** Maximum absolute mono sample amplitude, constrained to [0, 1]. */
  readonly peak: number;
  readonly estimatedNoiseFloorRms: number;
  readonly adaptiveVoiceThresholdRms: number;
  readonly clippedSampleRatio: number;
  readonly possibleClipping: boolean;
  readonly wordCount: null;
  readonly wordsPerMinute: null;
  readonly promptSimilarity: null;
  readonly qualityFlags: readonly AudioQualityFlag[];
  readonly analysisWarnings: readonly string[];
}

export type AudioAnalysisErrorCode =
  | 'unsupported_audio'
  | 'decode_failed'
  | 'insufficient_samples'
  | 'invalid_audio_data'
  | 'invalid_configuration';

export interface AudioAnalysisError {
  readonly code: AudioAnalysisErrorCode;
  readonly message: string;
}

export type AudioAnalysisResult =
  | {
      readonly status: 'success';
      readonly metrics: DeterministicMetrics;
    }
  | {
      readonly status: 'error';
      readonly error: AudioAnalysisError;
    };

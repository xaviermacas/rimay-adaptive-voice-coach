import type {
  AudioAnalysisConfig,
  AudioAnalysisError,
  AudioAnalysisErrorCode,
  PcmAudioData,
} from './types';

const ERROR_MESSAGES: Readonly<Record<AudioAnalysisErrorCode, string>> = {
  unsupported_audio:
    'Este navegador no permite decodificar la grabación con Web Audio. Puedes grabar nuevamente en una versión actual de Chrome o Edge.',
  decode_failed:
    'No pudimos decodificar esta grabación. Puedes escucharla si el reproductor funciona o grabar una nueva.',
  insufficient_samples:
    'La grabación no contiene suficientes muestras para calcular métricas. Graba nuevamente cuando estés listo.',
  invalid_audio_data:
    'Los datos de audio decodificados no son válidos. Puedes grabar nuevamente.',
  invalid_configuration:
    'La configuración del análisis no es válida. Recarga la aplicación e intenta nuevamente.',
};

export function createAudioAnalysisError(
  code: AudioAnalysisErrorCode,
): AudioAnalysisError {
  return { code, message: ERROR_MESSAGES[code] };
}

function isFiniteNonNegative(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

function isUnitInterval(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 1;
}

export function isValidAudioAnalysisConfig(
  config: AudioAnalysisConfig,
): boolean {
  return (
    config.algorithmVersion === 'audio-metrics-v1' &&
    Number.isFinite(config.windowDurationMs) &&
    config.windowDurationMs > 0 &&
    isUnitInterval(config.noiseFloorPercentile) &&
    isUnitInterval(config.minimumAdaptiveVoiceThresholdRms) &&
    Number.isFinite(config.noiseFloorMultiplier) &&
    config.noiseFloorMultiplier > 0 &&
    isFiniteNonNegative(config.maximumJoinedSilenceMs) &&
    isFiniteNonNegative(config.minimumSpeechSegmentDurationMs) &&
    isFiniteNonNegative(config.minimumPauseDurationMs) &&
    isUnitInterval(config.clippingAmplitudeThreshold) &&
    isUnitInterval(config.possibleClippingRatioThreshold) &&
    isFiniteNonNegative(config.minimumTotalDurationMs) &&
    isFiniteNonNegative(config.minimumSpeechDurationMs) &&
    isUnitInterval(config.tooQuietRmsThreshold)
  );
}

export function validatePcmAudioData(
  input: PcmAudioData,
): AudioAnalysisError | null {
  if (
    !Number.isInteger(input.sampleRateHz) ||
    input.sampleRateHz <= 0 ||
    input.channels.length === 0
  ) {
    return createAudioAnalysisError('invalid_audio_data');
  }

  const sampleCount = input.channels[0]?.length ?? 0;
  if (sampleCount === 0) {
    return createAudioAnalysisError('insufficient_samples');
  }

  for (const channel of input.channels) {
    if (channel.length !== sampleCount) {
      return createAudioAnalysisError('invalid_audio_data');
    }

    for (const sample of channel) {
      if (!Number.isFinite(sample) || Math.abs(sample) > 1) {
        return createAudioAnalysisError('invalid_audio_data');
      }
    }
  }

  return null;
}

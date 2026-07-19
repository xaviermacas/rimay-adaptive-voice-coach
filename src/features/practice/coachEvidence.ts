import type { AudioQualityFlag } from '../../domain/audio';
import type {
  CoachInput,
  MetricEvidenceKey,
} from '../../domain/coaching';

export interface CoachEvidenceViewItem {
  readonly key: MetricEvidenceKey;
  readonly label: string;
  readonly value: string;
  readonly unit: string | null;
  readonly source: 'audio' | 'text' | 'attempt' | 'exercise';
}

const QUALITY_FLAG_LABELS: Readonly<Record<AudioQualityFlag, string>> = {
  audio_too_short: 'captura demasiado corta',
  no_speech_detected: 'actividad de voz insuficiente',
  too_quiet: 'nivel de captura demasiado bajo',
  possible_clipping: 'posible recorte de amplitud',
  transcription_missing: 'texto no disponible',
};

function percentage(value: number): string {
  return (value * 100).toFixed(1);
}

function seconds(durationMs: number): string {
  return (durationMs / 1_000).toFixed(1);
}

function visibleQualityFlags(input: CoachInput): readonly AudioQualityFlag[] {
  return input.textMetrics === null
    ? input.audioMetrics.qualityFlags
    : input.audioMetrics.qualityFlags.filter(
        (flag) => flag !== 'transcription_missing',
      );
}

export function resolveCoachEvidenceKey(
  input: CoachInput,
  key: MetricEvidenceKey,
): CoachEvidenceViewItem {
  switch (key) {
    case 'qualityFlags': {
      const flags = visibleQualityFlags(input);
      return {
        key,
        label: 'Observaciones técnicas de captura',
        value:
          flags.length === 0
            ? 'Sin alertas técnicas'
            : flags.map((flag) => QUALITY_FLAG_LABELS[flag]).join(', '),
        unit: null,
        source: 'audio',
      };
    }
    case 'silenceRatio':
      return {
        key,
        label: 'Proporción de silencio',
        value: percentage(input.audioMetrics.silenceRatio),
        unit: '%',
        source: 'audio',
      };
    case 'validAttemptCountBeforeCurrent':
      return {
        key,
        label: 'Intentos válidos anteriores',
        value: String(input.validAttemptCountBeforeCurrent),
        unit: 'intentos',
        source: 'attempt',
      };
    case 'pauseCount':
      return {
        key,
        label: 'Pausas detectadas',
        value: String(input.audioMetrics.pauseCount),
        unit: 'pausas',
        source: 'audio',
      };
    case 'pauseCues':
      return {
        key,
        label: 'Marcas de pausa del ejercicio',
        value:
          input.currentExercise.pauseCues.length === 0
            ? 'Ninguna'
            : input.currentExercise.pauseCues.join(', '),
        unit: null,
        source: 'exercise',
      };
    case 'totalDurationMs':
      return {
        key,
        label: 'Duración total del intento',
        value: seconds(input.audioMetrics.totalDurationMs),
        unit: 's',
        source: 'audio',
      };
    case 'expectedMaxDurationMs':
      return {
        key,
        label: 'Duración máxima esperada del ejercicio',
        value: seconds(input.currentExercise.expectedMaxDurationMs),
        unit: 's',
        source: 'exercise',
      };
    case 'textSimilarity':
      if (input.textMetrics === null) {
        throw new Error(
          'No se puede resolver textSimilarity sin métricas textuales.',
        );
      }
      return {
        key,
        label: 'Coincidencia textual técnica',
        value: percentage(input.textMetrics.textSimilarity),
        unit: '%',
        source: 'text',
      };
    case 'currentDifficulty':
      return {
        key,
        label: 'Dificultad del ejercicio actual',
        value: `Nivel ${input.currentDifficulty}`,
        unit: null,
        source: 'exercise',
      };
    default:
      throw new Error(`Clave de evidencia no compatible: ${String(key)}`);
  }
}

export function resolveCoachEvidence(
  input: CoachInput,
  keys: readonly MetricEvidenceKey[],
): readonly CoachEvidenceViewItem[] {
  return keys.map((key) => resolveCoachEvidenceKey(input, key));
}

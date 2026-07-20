import type { AudioAnalysisError } from '../../domain/audio';
import type {
  SpeechRecognitionErrorCode,
} from '../../domain/contracts';
import type {
  CoachError,
  CoachErrorCode,
} from '../../domain/coaching';
import type { TextMetricsError } from '../../domain/text';
import type {
  RecordingError,
} from '../recording/recordingSupport';

export type PracticeAttemptError =
  | {
      readonly kind: 'recording';
      readonly code: RecordingError['code'];
      readonly message: string;
    }
  | {
      readonly kind: 'recognition';
      readonly code: SpeechRecognitionErrorCode;
      readonly message: string;
    }
  | {
      readonly kind: 'audio_analysis';
      readonly code: AudioAnalysisError['code'];
      readonly message: string;
    }
  | {
      readonly kind: 'text_metrics';
      readonly code: TextMetricsError['code'] | 'empty_manual_text';
      readonly message: string;
    }
  | {
      readonly kind: 'coaching';
      readonly code: CoachErrorCode;
      readonly message: string;
    };

const RECOGNITION_ERROR_MESSAGES: Readonly<
  Record<SpeechRecognitionErrorCode, string>
> = {
  unsupported:
    'El reconocimiento del navegador no está disponible. Puedes usar la entrada manual.',
  permission_denied:
    'El navegador no permitió el reconocimiento. La grabación puede conservarse y puedes escribir el texto.',
  audio_capture_failed:
    'El navegador no pudo escuchar para el reconocimiento. Puedes conservar la grabación y usar texto manual.',
  network_failed:
    'El servicio propio del navegador no respondió. Puedes continuar con entrada manual.',
  no_speech:
    'No se obtuvo un texto final. Puedes escribir lo que pronunciaste o continuar sin texto.',
  aborted:
    'El reconocimiento fue cancelado. Puedes continuar con entrada manual.',
  language_not_supported:
    'El navegador no admite el idioma español solicitado. Puedes usar la entrada manual.',
  service_not_allowed:
    'La política del navegador bloqueó el reconocimiento. Puedes usar la entrada manual.',
  unknown:
    'El reconocimiento no se completó. Puedes conservar la grabación y usar texto manual.',
};

const COACH_ERROR_MESSAGES: Readonly<Record<CoachErrorCode, string>> = {
  invalid_input:
    'No pudimos preparar la devolución porque los datos del intento no son válidos.',
  invalid_attempt_state:
    'No pudimos preparar la devolución porque el estado del intento no es coherente.',
  incompatible_algorithm_version:
    'No pudimos preparar la devolución porque una versión de métricas no es compatible.',
  empty_allowed_exercises:
    'No pudimos preparar la devolución porque falta el catálogo de ejercicios.',
  duplicate_exercise_id:
    'No pudimos preparar la devolución porque el catálogo contiene identificadores repetidos.',
  invalid_exercise:
    'No pudimos preparar la devolución porque un ejercicio no es válido.',
  missing_required_exercise_type:
    'No pudimos preparar la devolución porque falta el siguiente tipo de ejercicio permitido.',
  inconsistent_audio_metrics:
    'No pudimos preparar la devolución porque las métricas acústicas no son coherentes.',
  inconsistent_text_metrics:
    'No pudimos preparar la devolución porque las métricas textuales no corresponden al ejercicio actual.',
};

export function recordingPracticeError(
  error: RecordingError,
): PracticeAttemptError {
  return { kind: 'recording', code: error.code, message: error.message };
}

export function recognitionPracticeError(
  code: SpeechRecognitionErrorCode,
): PracticeAttemptError {
  return {
    kind: 'recognition',
    code,
    message: RECOGNITION_ERROR_MESSAGES[code],
  };
}

export function audioAnalysisPracticeError(
  error: AudioAnalysisError,
): PracticeAttemptError {
  return { kind: 'audio_analysis', code: error.code, message: error.message };
}

export function textMetricsPracticeError(
  error: TextMetricsError,
): PracticeAttemptError {
  return { kind: 'text_metrics', code: error.code, message: error.message };
}

export function emptyManualTextError(): PracticeAttemptError {
  return {
    kind: 'text_metrics',
    code: 'empty_manual_text',
    message: 'Escribe el texto del intento antes de confirmarlo.',
  };
}

export function coachingPracticeError(error: CoachError): PracticeAttemptError {
  return {
    kind: 'coaching',
    code: error.code,
    message: COACH_ERROR_MESSAGES[error.code],
  };
}

export const RECORDING_MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
] as const;

export const MAX_RECORDING_DURATION_MS = 60_000;
export const MAX_RECORDING_SIZE_BYTES = 10_000_000;
export const MIN_RECORDING_DURATION_MS = 500;
export const MICROPHONE_REQUEST_TIMEOUT_MS = 10_000;

export type RecordingErrorCode =
  | 'permission_denied'
  | 'microphone_request_timeout'
  | 'microphone_not_found'
  | 'browser_unsupported'
  | 'recording_failed'
  | 'audio_empty'
  | 'audio_too_short'
  | 'file_too_large';

export interface RecordingError {
  code: RecordingErrorCode;
  message: string;
}

interface MediaRecorderSupport {
  isTypeSupported(mimeType: string): boolean;
}

const ERROR_MESSAGES: Readonly<Record<RecordingErrorCode, string>> = {
  permission_denied:
    'El permiso del micrófono fue rechazado. Puedes habilitarlo en la configuración del navegador e intentarlo otra vez.',
  microphone_request_timeout:
    'La solicitud del micrófono tardó demasiado. Revisa que no esté ocupado por otra aplicación e intenta nuevamente.',
  microphone_not_found:
    'No encontramos un micrófono disponible. Conecta uno o revisa la configuración de audio del equipo.',
  browser_unsupported:
    'Este navegador no puede realizar la prueba de grabación. Usa una versión actual de Chrome o Edge en un equipo de escritorio.',
  recording_failed:
    'La grabación se interrumpió. Revisa el micrófono e intenta nuevamente.',
  audio_empty:
    'No se capturó audio. Verifica el micrófono e intenta nuevamente.',
  audio_too_short:
    'La grabación fue demasiado corta. Graba durante al menos medio segundo.',
  file_too_large:
    'La grabación alcanzó el límite de 10 MB y fue descartada. Intenta una grabación más corta.',
};

export function selectSupportedMimeType(
  support: MediaRecorderSupport,
): (typeof RECORDING_MIME_CANDIDATES)[number] | null {
  return (
    RECORDING_MIME_CANDIDATES.find((mimeType) =>
      support.isTypeSupported(mimeType),
    ) ?? null
  );
}

export function createRecordingError(code: RecordingErrorCode): RecordingError {
  return {
    code,
    message: ERROR_MESSAGES[code],
  };
}

export function mapCaptureError(error: unknown): RecordingError {
  const errorName =
    typeof error === 'object' && error !== null && 'name' in error
      ? String(error.name)
      : '';

  if (errorName === 'NotAllowedError' || errorName === 'SecurityError') {
    return createRecordingError('permission_denied');
  }

  if (errorName === 'TimeoutError') {
    return createRecordingError('microphone_request_timeout');
  }

  if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
    return createRecordingError('microphone_not_found');
  }

  if (errorName === 'NotSupportedError') {
    return createRecordingError('browser_unsupported');
  }

  return createRecordingError('recording_failed');
}

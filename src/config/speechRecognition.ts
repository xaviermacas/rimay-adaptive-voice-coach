import type { SpeechRecognitionMode } from '../domain/contracts';

export const RECOGNITION_LANGUAGE_TAG = 'es-EC';
export const FINAL_RESULT_WAIT_MS = 500;
export const MAX_MANUAL_TEXT_LENGTH = 500;
export const DEFAULT_SPEECH_RECOGNITION_MODE =
  'manual' satisfies SpeechRecognitionMode;

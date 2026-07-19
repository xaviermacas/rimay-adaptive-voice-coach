export type SpeechRecognitionMode = 'browser' | 'manual' | 'demo';

export type SpeechTextSource = SpeechRecognitionMode;

export type SpeechRecognitionStatus =
  | 'idle'
  | 'requesting'
  | 'listening'
  | 'processing'
  | 'completed'
  | 'unsupported'
  | 'cancelled'
  | 'error';

export type SpeechRecognitionErrorCode =
  | 'unsupported'
  | 'permission_denied'
  | 'audio_capture_failed'
  | 'network_failed'
  | 'no_speech'
  | 'aborted'
  | 'language_not_supported'
  | 'service_not_allowed'
  | 'unknown';

export interface SpeechTextResult {
  readonly originalText: string;
  readonly normalizedText: string;
  readonly comparisonText: string;
  readonly source: SpeechTextSource;
  readonly languageRequested: string | null;
  readonly isFinal: boolean;
  readonly warnings: readonly string[];
  readonly createdAt: string;
}

export interface RecognitionCallbacks {
  readonly onInterim: (text: string) => void;
  readonly onFinal: (text: string) => void;
  readonly onError: (errorCode: SpeechRecognitionErrorCode) => void;
  readonly onEnd: () => void;
}

export interface ActiveRecognition {
  stop(): void;
  abort(): void;
  dispose(): void;
}

export interface SpeechRecognizer {
  readonly source: 'browser' | 'demo';
  isSupported(): boolean;
  start(input: {
    readonly languageTag: string;
    readonly callbacks: RecognitionCallbacks;
  }): ActiveRecognition;
}

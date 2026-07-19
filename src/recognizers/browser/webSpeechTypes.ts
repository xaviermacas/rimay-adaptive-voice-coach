export interface WebSpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

export interface WebSpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  readonly [index: number]: WebSpeechRecognitionAlternative;
}

export interface WebSpeechRecognitionResultList {
  readonly length: number;
  readonly [index: number]: WebSpeechRecognitionResult;
}

export interface WebSpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: WebSpeechRecognitionResultList;
}

export interface WebSpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}

export interface WebSpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: ((event: Event) => void) | null;
  onspeechstart: ((event: Event) => void) | null;
  onresult: ((event: WebSpeechRecognitionEvent) => void) | null;
  onnomatch: ((event: Event) => void) | null;
  onerror: ((event: WebSpeechRecognitionErrorEvent) => void) | null;
  onend: ((event: Event) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

export type WebSpeechRecognitionConstructor = new () => WebSpeechRecognition;

export interface WebSpeechRecognitionBoundary {
  readonly SpeechRecognition?: WebSpeechRecognitionConstructor;
  readonly webkitSpeechRecognition?: WebSpeechRecognitionConstructor;
}

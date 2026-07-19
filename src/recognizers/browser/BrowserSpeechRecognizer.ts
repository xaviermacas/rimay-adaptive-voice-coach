import type {
  ActiveRecognition,
  RecognitionCallbacks,
  SpeechRecognitionErrorCode,
  SpeechRecognizer,
} from '../../domain/contracts';
import type {
  WebSpeechRecognition,
  WebSpeechRecognitionBoundary,
  WebSpeechRecognitionConstructor,
  WebSpeechRecognitionErrorEvent,
  WebSpeechRecognitionEvent,
} from './webSpeechTypes';

const NOOP_RECOGNITION: ActiveRecognition = {
  stop: () => undefined,
  abort: () => undefined,
  dispose: () => undefined,
};

function getBrowserBoundary(): WebSpeechRecognitionBoundary {
  return window as unknown as WebSpeechRecognitionBoundary;
}

function findConstructor(
  boundary: WebSpeechRecognitionBoundary,
): WebSpeechRecognitionConstructor | null {
  return (
    boundary.SpeechRecognition ?? boundary.webkitSpeechRecognition ?? null
  );
}

export function mapWebSpeechError(
  rawError: string,
): SpeechRecognitionErrorCode {
  switch (rawError) {
    case 'not-allowed':
    case 'permission-denied':
      return 'permission_denied';
    case 'audio-capture':
      return 'audio_capture_failed';
    case 'network':
      return 'network_failed';
    case 'no-speech':
      return 'no_speech';
    case 'aborted':
      return 'aborted';
    case 'language-not-supported':
      return 'language_not_supported';
    case 'service-not-allowed':
      return 'service_not_allowed';
    default:
      return 'unknown';
  }
}

class BrowserRecognitionSession implements ActiveRecognition {
  private disposed = false;
  private ended = false;
  private readonly finalSegments = new Map<number, string>();

  constructor(
    private readonly recognition: WebSpeechRecognition,
    private readonly callbacks: RecognitionCallbacks,
    private readonly onInactive: () => void,
  ) {}

  start(): void {
    this.recognition.onstart = () => this.signalListeningBoundary();
    this.recognition.onspeechstart = () => this.signalListeningBoundary();
    this.recognition.onresult = (event) => this.handleResult(event);
    this.recognition.onnomatch = () => this.signalError('no_speech');
    this.recognition.onerror = (event) => this.handleError(event);
    this.recognition.onend = () => this.end();

    try {
      this.recognition.start();
    } catch {
      this.signalError('unknown');
      this.end();
    }
  }

  stop(): void {
    if (this.disposed || this.ended) {
      return;
    }

    try {
      this.recognition.stop();
    } catch {
      this.signalError('unknown');
      this.end();
    }
  }

  abort(): void {
    if (this.disposed || this.ended) {
      return;
    }

    try {
      this.recognition.abort();
    } catch {
      this.signalError('unknown');
      this.end();
    }
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }

    this.disposed = true;
    this.clearHandlers();
    this.onInactive();

    if (!this.ended) {
      try {
        this.recognition.abort();
      } catch {
        // Disposal is best-effort and must not update an unmounted consumer.
      }
    }
  }

  private handleResult(event: WebSpeechRecognitionEvent): void {
    if (this.disposed || this.ended) {
      return;
    }

    const interimSegments: string[] = [];
    let receivedFinal = false;

    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const result = event.results[index];
      const transcript = result?.[0]?.transcript.trim();

      if (!result || !transcript) {
        continue;
      }

      if (result.isFinal) {
        this.finalSegments.set(index, transcript);
        receivedFinal = true;
      } else {
        interimSegments.push(transcript);
      }
    }

    if (receivedFinal) {
      const finalText = [...this.finalSegments.entries()]
        .sort(([leftIndex], [rightIndex]) => leftIndex - rightIndex)
        .map(([, text]) => text)
        .join(' ');

      this.callbacks.onInterim('');
      this.callbacks.onFinal(finalText);
      return;
    }

    if (interimSegments.length > 0) {
      this.callbacks.onInterim(interimSegments.join(' '));
    }
  }

  private handleError(event: WebSpeechRecognitionErrorEvent): void {
    this.signalError(mapWebSpeechError(event.error));
  }

  private signalListeningBoundary(): void {
    if (!this.disposed && !this.ended) {
      this.callbacks.onInterim('');
    }
  }

  private signalError(errorCode: SpeechRecognitionErrorCode): void {
    if (!this.disposed && !this.ended) {
      this.callbacks.onError(errorCode);
    }
  }

  private end(): void {
    if (this.disposed || this.ended) {
      return;
    }

    this.ended = true;
    this.clearHandlers();
    this.onInactive();
    this.callbacks.onEnd();
  }

  private clearHandlers(): void {
    this.recognition.onstart = null;
    this.recognition.onspeechstart = null;
    this.recognition.onresult = null;
    this.recognition.onnomatch = null;
    this.recognition.onerror = null;
    this.recognition.onend = null;
  }
}

export class BrowserSpeechRecognizer implements SpeechRecognizer {
  readonly source = 'browser' as const;
  private activeSession: BrowserRecognitionSession | null = null;

  constructor(
    private readonly boundary: WebSpeechRecognitionBoundary =
      getBrowserBoundary(),
  ) {}

  isSupported(): boolean {
    return findConstructor(this.boundary) !== null;
  }

  start(input: {
    readonly languageTag: string;
    readonly callbacks: RecognitionCallbacks;
  }): ActiveRecognition {
    if (this.activeSession) {
      return this.activeSession;
    }

    const RecognitionConstructor = findConstructor(this.boundary);
    if (!RecognitionConstructor) {
      input.callbacks.onError('unsupported');
      input.callbacks.onEnd();
      return NOOP_RECOGNITION;
    }

    const recognition = new RecognitionConstructor();
    recognition.lang = input.languageTag;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    const session = new BrowserRecognitionSession(
      recognition,
      input.callbacks,
      () => {
        if (this.activeSession === session) {
          this.activeSession = null;
        }
      },
    );
    this.activeSession = session;
    session.start();

    return session;
  }
}

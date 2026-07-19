import type {
  ActiveRecognition,
  RecognitionCallbacks,
  SpeechRecognitionErrorCode,
  SpeechRecognizer,
} from '../../domain/contracts';

export type DemoRecognitionEvent =
  | {
      readonly atMs: number;
      readonly type: 'interim';
      readonly text: string;
    }
  | {
      readonly atMs: number;
      readonly type: 'final';
      readonly text: string;
    }
  | {
      readonly atMs: number;
      readonly type: 'error';
      readonly errorCode: SpeechRecognitionErrorCode;
    };

export interface DemoRecognitionFixture {
  readonly exerciseId: string;
  readonly scenarioId: string;
  readonly events: readonly DemoRecognitionEvent[];
  readonly endAtMs: number;
}

export interface DemoScheduler {
  setTimeout(callback: () => void, delayMs: number): number;
  clearTimeout(timerId: number): void;
}

export const DEFAULT_DEMO_RECOGNITION_FIXTURE: DemoRecognitionFixture = {
  exerciseId: 'increment-3-guided-phrase',
  scenarioId: 'successful-attempt',
  events: [
    { atMs: 250, type: 'interim', text: 'hoy camino con calma' },
    {
      atMs: 600,
      type: 'final',
      text: 'Hoy camino con calma y confianza.',
    },
  ],
  endAtMs: 650,
};

const browserScheduler: DemoScheduler = {
  setTimeout: (callback, delayMs) => window.setTimeout(callback, delayMs),
  clearTimeout: (timerId) => window.clearTimeout(timerId),
};

class DemoRecognitionSession implements ActiveRecognition {
  private disposed = false;
  private ended = false;
  private finalEmitted = false;
  private readonly timerIds: number[] = [];

  constructor(
    private readonly fixture: DemoRecognitionFixture,
    private readonly callbacks: RecognitionCallbacks,
    private readonly scheduler: DemoScheduler,
    private readonly onInactive: () => void,
  ) {}

  start(): void {
    for (const event of this.fixture.events) {
      this.timerIds.push(
        this.scheduler.setTimeout(
          () => this.emitEvent(event),
          Math.max(0, event.atMs),
        ),
      );
    }

    this.timerIds.push(
      this.scheduler.setTimeout(
        () => this.end(),
        Math.max(0, this.fixture.endAtMs),
      ),
    );
  }

  stop(): void {
    if (this.disposed || this.ended) {
      return;
    }

    const finalEvent = this.fixture.events.find(
      (event): event is Extract<DemoRecognitionEvent, { type: 'final' }> =>
        event.type === 'final',
    );

    if (!this.finalEmitted && finalEvent) {
      this.callbacks.onInterim('');
      this.callbacks.onFinal(finalEvent.text);
      this.finalEmitted = true;
    }

    this.end();
  }

  abort(): void {
    if (this.disposed || this.ended) {
      return;
    }

    this.callbacks.onInterim('');
    this.end();
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }

    this.disposed = true;
    this.clearTimers();
    this.onInactive();
  }

  private emitEvent(event: DemoRecognitionEvent): void {
    if (this.disposed || this.ended) {
      return;
    }

    switch (event.type) {
      case 'interim':
        this.callbacks.onInterim(event.text);
        break;
      case 'final':
        this.callbacks.onInterim('');
        this.callbacks.onFinal(event.text);
        this.finalEmitted = true;
        break;
      case 'error':
        this.callbacks.onError(event.errorCode);
        break;
    }
  }

  private end(): void {
    if (this.disposed || this.ended) {
      return;
    }

    this.ended = true;
    this.clearTimers();
    this.onInactive();
    this.callbacks.onEnd();
  }

  private clearTimers(): void {
    for (const timerId of this.timerIds) {
      this.scheduler.clearTimeout(timerId);
    }
    this.timerIds.length = 0;
  }
}

export class DemoSpeechRecognizer implements SpeechRecognizer {
  readonly source = 'demo' as const;
  private activeSession: DemoRecognitionSession | null = null;

  constructor(
    private readonly fixture: DemoRecognitionFixture =
      DEFAULT_DEMO_RECOGNITION_FIXTURE,
    private readonly scheduler: DemoScheduler = browserScheduler,
  ) {}

  isSupported(): boolean {
    return true;
  }

  start(input: {
    readonly languageTag: string;
    readonly callbacks: RecognitionCallbacks;
  }): ActiveRecognition {
    if (this.activeSession) {
      return this.activeSession;
    }

    const session = new DemoRecognitionSession(
      this.fixture,
      input.callbacks,
      this.scheduler,
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

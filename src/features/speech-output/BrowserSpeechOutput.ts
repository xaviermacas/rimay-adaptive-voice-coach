import type { SpeechOutput } from '../../domain/contracts';
import {
  SpeechOutputFailure,
  type SpeechOutputAvailabilitySnapshot,
} from './types';
import { selectSpanishVoice } from './voiceSelection';

interface ActiveSpeechRequest {
  readonly generation: number;
  readonly resolve: () => void;
  readonly reject: (reason: SpeechOutputFailure) => void;
}

export interface BrowserSpeechOutputOptions {
  readonly synthesis?: SpeechSynthesis | null;
  readonly createUtterance?: ((text: string) => SpeechSynthesisUtterance) | null;
  readonly voiceRetryDelaysMs?: readonly number[];
}

type AvailabilityListener = (
  snapshot: SpeechOutputAvailabilitySnapshot,
) => void;

const DEFAULT_VOICE_RETRY_DELAYS_MS = [
  50,
  150,
  300,
  ...Array.from({ length: 30 }, () => 500),
] as const;

function defaultSynthesis(): SpeechSynthesis | null {
  return typeof window === 'undefined' || !('speechSynthesis' in window)
    ? null
    : window.speechSynthesis;
}

function defaultUtteranceFactory():
  | ((text: string) => SpeechSynthesisUtterance)
  | null {
  return typeof SpeechSynthesisUtterance === 'undefined'
    ? null
    : (text) => new SpeechSynthesisUtterance(text);
}

export class BrowserSpeechOutput implements SpeechOutput {
  private readonly synthesis: SpeechSynthesis | null;
  private readonly createUtterance:
    | ((text: string) => SpeechSynthesisUtterance)
    | null;
  private readonly listeners = new Set<AvailabilityListener>();
  private readonly voiceRetryDelaysMs: readonly number[];
  private readonly focusTarget: Window | null;
  private readonly visibilityTarget: Document | null;
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private snapshot: SpeechOutputAvailabilitySnapshot;
  private activeRequest: ActiveSpeechRequest | null = null;
  private generation = 0;
  private connected = false;
  private disposed = false;
  private voiceRetryIndex = 0;
  private voiceRetryTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly handleVoicesChanged = () => {
    if (this.selectedVoice !== null) {
      this.voiceRetryIndex = 0;
    }
    this.refreshVoices();
  };

  private readonly handleFocus = () => {
    if (this.selectedVoice === null) {
      this.refreshVoices();
    }
  };

  private readonly handleVisibilityChange = () => {
    if (
      this.selectedVoice === null &&
      this.visibilityTarget?.visibilityState === 'visible'
    ) {
      this.refreshVoices();
    }
  };

  constructor(options: BrowserSpeechOutputOptions = {}) {
    this.synthesis =
      options.synthesis === undefined ? defaultSynthesis() : options.synthesis;
    this.createUtterance =
      options.createUtterance === undefined
        ? defaultUtteranceFactory()
        : options.createUtterance;
    this.voiceRetryDelaysMs =
      options.voiceRetryDelaysMs ?? DEFAULT_VOICE_RETRY_DELAYS_MS;
    this.focusTarget = typeof window === 'undefined' ? null : window;
    this.visibilityTarget = typeof document === 'undefined' ? null : document;
    this.snapshot = {
      status:
        this.synthesis === null || this.createUtterance === null
          ? 'unsupported'
          : 'loading_voices',
      selectedVoice: null,
    };
    this.connect();
  }

  connect(): void {
    this.disposed = false;
    if (
      this.connected ||
      this.synthesis === null ||
      this.createUtterance === null
    ) {
      if (this.synthesis === null || this.createUtterance === null) {
        this.setSnapshot({ status: 'unsupported', selectedVoice: null });
      }
      return;
    }
    this.connected = true;
    this.voiceRetryIndex = 0;
    this.synthesis.addEventListener(
      'voiceschanged',
      this.handleVoicesChanged,
    );
    this.focusTarget?.addEventListener('focus', this.handleFocus);
    this.visibilityTarget?.addEventListener(
      'visibilitychange',
      this.handleVisibilityChange,
    );
    this.refreshVoices();
  }

  getSnapshot(): SpeechOutputAvailabilitySnapshot {
    return this.snapshot;
  }

  subscribe(listener: AvailabilityListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  isAvailable(): boolean {
    return (
      !this.disposed &&
      this.snapshot.status === 'ready' &&
      this.selectedVoice !== null
    );
  }

  speak(text: string): Promise<void> {
    if (text.trim() === '') {
      return Promise.reject(
        new SpeechOutputFailure(
          'empty_text',
          'El texto de voz no puede estar vacío.',
        ),
      );
    }
    if (this.disposed) {
      return Promise.reject(
        new SpeechOutputFailure(
          'disposed',
          'La salida de voz ya fue desmontada.',
        ),
      );
    }
    if (this.synthesis === null || this.createUtterance === null) {
      return Promise.reject(
        new SpeechOutputFailure(
          'unsupported',
          'SpeechSynthesis no está disponible.',
        ),
      );
    }
    if (this.selectedVoice === null) {
      return Promise.reject(
        new SpeechOutputFailure(
          this.snapshot.status === 'loading_voices'
            ? 'voices_loading'
            : 'spanish_voice_unavailable',
          'No hay una voz española disponible.',
        ),
      );
    }

    this.generation += 1;
    const generation = this.generation;
    this.cancelQueue();

    let utterance: SpeechSynthesisUtterance;
    try {
      utterance = this.createUtterance(text);
    } catch {
      return Promise.reject(
        new SpeechOutputFailure(
          'synthesis_failed',
          'No se pudo preparar la locución.',
        ),
      );
    }

    utterance.voice = this.selectedVoice;
    utterance.lang = this.selectedVoice.lang;
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    return new Promise<void>((resolve, reject) => {
      const settleIfCurrent = (settle: () => void) => {
        if (
          this.activeRequest?.generation !== generation ||
          this.generation !== generation
        ) {
          return;
        }
        this.activeRequest = null;
        settle();
      };

      this.activeRequest = {
        generation,
        resolve,
        reject,
      };
      utterance.onend = () => {
        settleIfCurrent(resolve);
      };
      utterance.onerror = () => {
        settleIfCurrent(() =>
          reject(
            new SpeechOutputFailure(
              'synthesis_failed',
              'El navegador no pudo completar la locución.',
            ),
          ),
        );
      };

      try {
        this.synthesis?.speak(utterance);
      } catch {
        settleIfCurrent(() =>
          reject(
            new SpeechOutputFailure(
              'synthesis_failed',
              'El navegador no pudo iniciar la locución.',
            ),
          ),
        );
      }
    });
  }

  stop(): void {
    this.generation += 1;
    this.cancelQueue();
  }

  dispose(): void {
    this.stop();
    this.cancelVoiceRetry();
    if (this.connected && this.synthesis !== null) {
      this.synthesis.removeEventListener(
        'voiceschanged',
        this.handleVoicesChanged,
      );
    }
    if (this.connected) {
      this.focusTarget?.removeEventListener('focus', this.handleFocus);
      this.visibilityTarget?.removeEventListener(
        'visibilitychange',
        this.handleVisibilityChange,
      );
    }
    this.connected = false;
    this.disposed = true;
  }

  private refreshVoices(): void {
    if (!this.connected || this.disposed) {
      return;
    }
    if (this.synthesis === null || this.createUtterance === null) {
      this.cancelVoiceRetry();
      this.selectedVoice = null;
      this.setSnapshot({ status: 'unsupported', selectedVoice: null });
      return;
    }

    let voices: readonly SpeechSynthesisVoice[];
    try {
      voices = this.synthesis.getVoices();
    } catch {
      this.cancelVoiceRetry();
      this.selectedVoice = null;
      this.setSnapshot({ status: 'unavailable', selectedVoice: null });
      return;
    }

    const result = selectSpanishVoice(voices);
    if (result.status === 'available') {
      this.cancelVoiceRetry();
      this.selectedVoice = result.voice;
      this.setSnapshot({
        status: 'ready',
        selectedVoice: result.summary,
      });
      return;
    }

    this.selectedVoice = null;
    if (result.reason === 'empty_voice_list') {
      this.scheduleVoiceRetry();
    } else {
      this.cancelVoiceRetry();
    }
    this.setSnapshot({
      status:
        result.reason === 'empty_voice_list'
          ? 'loading_voices'
          : 'unavailable',
      selectedVoice: null,
    });
  }

  private scheduleVoiceRetry(): void {
    if (
      this.voiceRetryTimer !== null ||
      this.voiceRetryIndex >= this.voiceRetryDelaysMs.length ||
      this.selectedVoice !== null ||
      !this.connected ||
      this.disposed
    ) {
      return;
    }

    const delayMs = this.voiceRetryDelaysMs[this.voiceRetryIndex];
    this.voiceRetryIndex += 1;
    if (delayMs === undefined) {
      return;
    }
    this.voiceRetryTimer = setTimeout(() => {
      this.voiceRetryTimer = null;
      this.refreshVoices();
    }, delayMs);
  }

  private cancelVoiceRetry(): void {
    if (this.voiceRetryTimer !== null) {
      clearTimeout(this.voiceRetryTimer);
      this.voiceRetryTimer = null;
    }
  }

  private cancelQueue(): void {
    const activeRequest = this.activeRequest;
    this.activeRequest = null;
    activeRequest?.resolve();
    if (this.synthesis === null) {
      return;
    }
    if (this.synthesis.paused) {
      this.synthesis.resume();
    }
    this.synthesis.cancel();
  }

  private setSnapshot(snapshot: SpeechOutputAvailabilitySnapshot): void {
    this.snapshot = snapshot;
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }
}

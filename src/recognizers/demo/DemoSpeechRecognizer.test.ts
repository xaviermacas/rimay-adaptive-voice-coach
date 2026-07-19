import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import type {
  RecognitionCallbacks,
  SpeechRecognitionErrorCode,
} from '../../domain/contracts';
import {
  DEFAULT_DEMO_RECOGNITION_FIXTURE,
  DemoSpeechRecognizer,
} from './DemoSpeechRecognizer';

interface TestCallbacks extends RecognitionCallbacks {
  readonly onInterim: Mock<(text: string) => void>;
  readonly onFinal: Mock<(text: string) => void>;
  readonly onError: Mock<(errorCode: SpeechRecognitionErrorCode) => void>;
  readonly onEnd: Mock<() => void>;
}

function callbacks(): TestCallbacks {
  return {
    onInterim: vi.fn<(text: string) => void>(),
    onFinal: vi.fn<(text: string) => void>(),
    onError: vi.fn<(errorCode: SpeechRecognitionErrorCode) => void>(),
    onEnd: vi.fn<() => void>(),
  };
}

describe('DemoSpeechRecognizer', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('repite la secuencia provisional, final y cierre del fixture', () => {
    const recognizer = new DemoSpeechRecognizer();
    const listener = callbacks();

    expect(recognizer.isSupported()).toBe(true);
    recognizer.start({ languageTag: 'es-EC', callbacks: listener });

    vi.advanceTimersByTime(250);
    expect(listener.onInterim).toHaveBeenCalledWith('hoy camino con calma');
    expect(listener.onFinal).not.toHaveBeenCalled();

    vi.advanceTimersByTime(350);
    expect(listener.onFinal).toHaveBeenCalledWith(
      'Hoy camino con calma y confianza.',
    );

    vi.advanceTimersByTime(50);
    expect(listener.onEnd).toHaveBeenCalledOnce();
  });

  it('la misma configuración produce exactamente la misma salida', () => {
    const firstListener = callbacks();
    const firstRecognizer = new DemoSpeechRecognizer();
    firstRecognizer.start({
      languageTag: 'es-EC',
      callbacks: firstListener,
    });
    vi.runAllTimers();

    const secondListener = callbacks();
    const secondRecognizer = new DemoSpeechRecognizer();
    secondRecognizer.start({
      languageTag: 'es-EC',
      callbacks: secondListener,
    });
    vi.runAllTimers();

    expect(secondListener.onInterim.mock.calls).toEqual(
      firstListener.onInterim.mock.calls,
    );
    expect(secondListener.onFinal.mock.calls).toEqual(
      firstListener.onFinal.mock.calls,
    );
  });

  it('emite un error demo sólo cuando el escenario lo declara', () => {
    const listener = callbacks();
    const recognizer = new DemoSpeechRecognizer({
      exerciseId: 'exercise',
      scenarioId: 'network-error',
      events: [{ atMs: 10, type: 'error', errorCode: 'network_failed' }],
      endAtMs: 20,
    });

    recognizer.start({ languageTag: 'es-EC', callbacks: listener });
    vi.runAllTimers();

    expect(listener.onError).toHaveBeenCalledWith('network_failed');
    expect(listener.onFinal).not.toHaveBeenCalled();
    expect(listener.onEnd).toHaveBeenCalledOnce();
  });

  it('stop conserva el resultado final previsto y cierra una sola vez', () => {
    const listener = callbacks();
    const recognizer = new DemoSpeechRecognizer();
    const active = recognizer.start({
      languageTag: 'es-EC',
      callbacks: listener,
    });

    active.stop();
    vi.runAllTimers();

    expect(listener.onFinal).toHaveBeenCalledWith(
      DEFAULT_DEMO_RECOGNITION_FIXTURE.events[1]?.type === 'final'
        ? DEFAULT_DEMO_RECOGNITION_FIXTURE.events[1].text
        : '',
    );
    expect(listener.onEnd).toHaveBeenCalledOnce();
  });

  it('no abre una segunda secuencia mientras la primera sigue activa', () => {
    const recognizer = new DemoSpeechRecognizer();
    const first = recognizer.start({
      languageTag: 'es-EC',
      callbacks: callbacks(),
    });
    const second = recognizer.start({
      languageTag: 'es-ES',
      callbacks: callbacks(),
    });

    expect(second).toBe(first);
    expect(vi.getTimerCount()).toBe(3);
  });

  it('dispose cancela timers sin emitir texto ni cierre tardío', () => {
    const listener = callbacks();
    const recognizer = new DemoSpeechRecognizer();
    const active = recognizer.start({
      languageTag: 'es-EC',
      callbacks: listener,
    });

    active.dispose();
    vi.runAllTimers();

    expect(listener.onInterim).not.toHaveBeenCalled();
    expect(listener.onFinal).not.toHaveBeenCalled();
    expect(listener.onEnd).not.toHaveBeenCalled();
  });
});

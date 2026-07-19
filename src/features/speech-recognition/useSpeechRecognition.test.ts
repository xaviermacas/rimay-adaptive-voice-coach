import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FINAL_RESULT_WAIT_MS } from '../../config/speechRecognition';
import type {
  ActiveRecognition,
  RecognitionCallbacks,
  SpeechRecognizer,
} from '../../domain/contracts';
import { useSpeechRecognition } from './useSpeechRecognition';

class ControlledRecognizer implements SpeechRecognizer {
  readonly active: ActiveRecognition = {
    stop: vi.fn(),
    abort: vi.fn(),
    dispose: vi.fn(),
  };
  callbacks: RecognitionCallbacks | null = null;
  languageTag: string | null = null;
  startCount = 0;

  constructor(
    readonly source: 'browser' | 'demo',
    private readonly supported = true,
  ) {}

  isSupported(): boolean {
    return this.supported;
  }

  start(input: {
    readonly languageTag: string;
    readonly callbacks: RecognitionCallbacks;
  }): ActiveRecognition {
    this.startCount += 1;
    this.languageTag = input.languageTag;
    this.callbacks = input.callbacks;
    return this.active;
  }

  interim(text: string): void {
    this.callbacks?.onInterim(text);
  }

  final(text: string): void {
    this.callbacks?.onFinal(text);
  }

  error(errorCode: 'permission_denied' | 'network_failed'): void {
    this.callbacks?.onError(errorCode);
  }

  end(): void {
    this.callbacks?.onEnd();
  }
}

describe('useSpeechRecognition', () => {
  afterEach(() => vi.useRealTimers());

  it('expone soporte ausente sin iniciar una sesión', () => {
    const browser = new ControlledRecognizer('browser', false);
    const { result } = renderHook(() =>
      useSpeechRecognition({ browserRecognizer: browser }),
    );

    act(() => result.current.start('browser'));

    expect(result.current.browserIsSupported).toBe(false);
    expect(result.current.state).toMatchObject({
      status: 'unsupported',
      errorCode: 'unsupported',
    });
    expect(browser.startCount).toBe(0);
  });

  it('distingue provisional y final y construye SpeechTextResult canónico', () => {
    const browser = new ControlledRecognizer('browser');
    const { result } = renderHook(() =>
      useSpeechRecognition({ browserRecognizer: browser }),
    );

    act(() => result.current.start('browser'));
    expect(browser.languageTag).toBe('es-EC');
    expect(result.current.state.status).toBe('requesting');

    act(() => browser.interim('Árbol con'));
    expect(result.current.state).toMatchObject({
      status: 'listening',
      interimText: 'Árbol con',
    });

    act(() => browser.final('Árbol con pingüino y niño.'));
    expect(result.current.state.status).toBe('completed');
    expect(result.current.state.result).toMatchObject({
      originalText: 'Árbol con pingüino y niño.',
      normalizedText: 'árbol con pingüino y niño',
      comparisonText: 'arbol con pinguino y niño',
      source: 'browser',
      languageRequested: 'es-EC',
      isFinal: true,
    });
  });

  it('marca el fixture demo y declara que no analizó audio', () => {
    const demo = new ControlledRecognizer('demo');
    const { result } = renderHook(() =>
      useSpeechRecognition({ demoRecognizer: demo }),
    );

    act(() => result.current.start('demo'));
    act(() => demo.final('Texto predefinido.'));

    expect(result.current.state.result).toMatchObject({
      source: 'demo',
      warnings: ['demo_fixture_does_not_analyze_audio'],
    });
  });

  it('conserva errores recuperables sin fabricar un resultado', () => {
    const browser = new ControlledRecognizer('browser');
    const { result } = renderHook(() =>
      useSpeechRecognition({ browserRecognizer: browser }),
    );

    act(() => result.current.start('browser'));
    act(() => browser.error('permission_denied'));
    act(() => browser.end());

    expect(result.current.state).toMatchObject({
      status: 'error',
      result: null,
      errorCode: 'permission_denied',
    });
  });

  it('no destruye un resultado final por un error tardío de silencio', () => {
    const browser = new ControlledRecognizer('browser');
    const { result } = renderHook(() =>
      useSpeechRecognition({ browserRecognizer: browser }),
    );

    act(() => result.current.start('browser'));
    act(() => browser.final('Texto final.'));
    act(() => browser.callbacks?.onError('no_speech'));

    expect(result.current.state).toMatchObject({
      status: 'completed',
      errorCode: null,
      result: { originalText: 'Texto final.' },
    });
  });

  it('espera brevemente el final al detener y resuelve silencio si no llega', () => {
    vi.useFakeTimers();
    const browser = new ControlledRecognizer('browser');
    const { result } = renderHook(() =>
      useSpeechRecognition({ browserRecognizer: browser }),
    );
    act(() => result.current.start('browser'));

    act(() => result.current.stop());
    expect(browser.active.stop).toHaveBeenCalledOnce();
    expect(result.current.state.status).toBe('processing');

    act(() => vi.advanceTimersByTime(FINAL_RESULT_WAIT_MS));

    expect(browser.active.dispose).toHaveBeenCalledOnce();
    expect(result.current.state).toMatchObject({
      status: 'error',
      errorCode: 'no_speech',
    });
  });

  it('acepta un resultado final tardío dentro de la ventana permitida', () => {
    vi.useFakeTimers();
    const browser = new ControlledRecognizer('browser');
    const { result } = renderHook(() =>
      useSpeechRecognition({ browserRecognizer: browser }),
    );
    act(() => result.current.start('browser'));
    act(() => result.current.stop());

    act(() => vi.advanceTimersByTime(FINAL_RESULT_WAIT_MS - 1));
    act(() => browser.final('uno dos tres cuatro cinco seis siete ocho nueve diez'));
    act(() => vi.advanceTimersByTime(1));

    expect(result.current.state).toMatchObject({
      status: 'completed',
      errorCode: null,
      result: {
        originalText: 'uno dos tres cuatro cinco seis siete ocho nueve diez',
      },
    });
    expect(browser.active.dispose).not.toHaveBeenCalled();
  });

  it('dispose cancela la sesión y evita actualizaciones tras desmontar', () => {
    const browser = new ControlledRecognizer('browser');
    const { result, unmount } = renderHook(() =>
      useSpeechRecognition({ browserRecognizer: browser }),
    );
    act(() => result.current.start('browser'));

    unmount();
    browser.final('resultado tardío');

    expect(browser.active.dispose).toHaveBeenCalledOnce();
  });
});

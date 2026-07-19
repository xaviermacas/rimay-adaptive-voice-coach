import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { BrowserSpeechOutput } from './BrowserSpeechOutput';
import { useSpeechOutput } from './useSpeechOutput';

class HookSpeechSynthesis extends EventTarget implements SpeechSynthesis {
  onvoiceschanged: ((this: SpeechSynthesis, ev: Event) => unknown) | null = null;
  paused = false;
  pending = false;
  speaking = false;
  voices: SpeechSynthesisVoice[] = [];
  utterances: SpeechSynthesisUtterance[] = [];
  readonly cancel = vi.fn();
  readonly pause = vi.fn();
  readonly resume = vi.fn();

  getVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  speak(utterance: SpeechSynthesisUtterance): void {
    this.utterances.push(utterance);
  }
}

class HookUtterance extends EventTarget implements SpeechSynthesisUtterance {
  lang = '';
  pitch = 1;
  rate = 1;
  text: string;
  voice: SpeechSynthesisVoice | null = null;
  volume = 1;
  onboundary: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => unknown) | null = null;
  onend: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => unknown) | null = null;
  onerror: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisErrorEvent) => unknown) | null = null;
  onmark: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => unknown) | null = null;
  onpause: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => unknown) | null = null;
  onresume: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => unknown) | null = null;
  onstart: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => unknown) | null = null;

  constructor(text: string) {
    super();
    this.text = text;
  }
}

function setup() {
  const synthesis = new HookSpeechSynthesis();
  synthesis.voices = [
    {
      name: 'Ecuador',
      lang: 'es-EC',
      localService: true,
      default: true,
      voiceURI: 'voice:ec',
    },
  ];
  const utterances: HookUtterance[] = [];
  const output = new BrowserSpeechOutput({
    synthesis,
    createUtterance: (text) => {
      const utterance = new HookUtterance(text);
      utterances.push(utterance);
      return utterance;
    },
  });
  return { output, synthesis, utterances };
}

describe('useSpeechOutput', () => {
  it('expone ready, speaking y ready al finalizar', async () => {
    const { output, utterances } = setup();
    const { result } = renderHook(() => useSpeechOutput({ output }));
    expect(result.current.state.status).toBe('ready');

    let promise: Promise<void> = Promise.resolve();
    act(() => {
      promise = result.current.speak('Instrucción visible');
    });
    expect(result.current.state.status).toBe('speaking');
    act(() => {
      utterances[0]?.onend?.call(
        utterances[0],
        new Event('end') as SpeechSynthesisEvent,
      );
    });
    await act(async () => promise);
    expect(result.current.state.status).toBe('ready');
  });

  it('permite escuchar nuevamente mediante otra llamada explícita a speak', async () => {
    const { output, synthesis, utterances } = setup();
    const { result } = renderHook(() => useSpeechOutput({ output }));
    let first: Promise<void> = Promise.resolve();
    act(() => {
      first = result.current.speak('Devolución visible');
    });
    act(() => utterances[0]?.onend?.call(utterances[0], new Event('end') as SpeechSynthesisEvent));
    await act(async () => first);

    let second: Promise<void> = Promise.resolve();
    act(() => {
      second = result.current.speak('Devolución visible');
    });
    expect(synthesis.utterances.map(({ text }) => text)).toEqual([
      'Devolución visible',
      'Devolución visible',
    ]);
    act(() => utterances[1]?.onend?.call(utterances[1], new Event('end') as SpeechSynthesisEvent));
    await act(async () => second);
  });

  it('stop produce estado detenido sin mostrar cancelación como error', async () => {
    const { output } = setup();
    const { result } = renderHook(() => useSpeechOutput({ output }));
    let promise: Promise<void> = Promise.resolve();
    act(() => {
      promise = result.current.speak('Texto');
    });
    act(() => result.current.stop());
    await act(async () => promise);
    expect(result.current.state.status).toBe('stopped');
  });

  it('una cancelación preventiva conserva la indisponibilidad real', () => {
    const output = new BrowserSpeechOutput({
      synthesis: null,
      createUtterance: null,
    });
    const { result } = renderHook(() => useSpeechOutput({ output }));

    act(() => result.current.stop());

    expect(result.current.state.status).toBe('unsupported');
    expect(result.current.isAvailable).toBe(false);
  });

  it('mantiene error no bloqueante ante fallo real', async () => {
    const { output, utterances } = setup();
    const { result } = renderHook(() => useSpeechOutput({ output }));
    let promise: Promise<void> = Promise.resolve();
    act(() => {
      promise = result.current.speak('Texto');
    });
    act(() => {
      utterances[0]?.onerror?.call(utterances[0], {
        error: 'synthesis-failed',
      } as SpeechSynthesisErrorEvent);
    });
    await act(async () => promise);
    expect(result.current.state).toMatchObject({
      status: 'error',
      message: expect.stringMatching(/no pudo completar/i),
    });
  });

  it('mantiene detener disponible si la voz desaparece durante la locución', () => {
    const { output, synthesis } = setup();
    const { result } = renderHook(() => useSpeechOutput({ output }));
    act(() => {
      void result.current.speak('Texto');
    });
    act(() => {
      synthesis.voices = [];
      synthesis.dispatchEvent(new Event('voiceschanged'));
    });
    expect(result.current.state.status).toBe('speaking');
    act(() => result.current.stop());
    expect(result.current.state.status).toBe('stopped');
  });

  it('cancela y limpia automáticamente al desmontar', () => {
    const { output, synthesis } = setup();
    const { result, unmount } = renderHook(() => useSpeechOutput({ output }));
    act(() => {
      void result.current.speak('Texto');
    });
    unmount();
    expect(synthesis.cancel).toHaveBeenCalled();
  });
});

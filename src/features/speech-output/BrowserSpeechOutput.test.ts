import { afterEach, describe, expect, it, vi } from 'vitest';

import { BrowserSpeechOutput } from './BrowserSpeechOutput';
import { SpeechOutputFailure } from './types';

class FakeSpeechSynthesis extends EventTarget implements SpeechSynthesis {
  onvoiceschanged: ((this: SpeechSynthesis, ev: Event) => unknown) | null = null;
  paused = false;
  pending = false;
  speaking = false;
  voices: SpeechSynthesisVoice[] = [];
  readonly spoken: SpeechSynthesisUtterance[] = [];
  readonly cancel = vi.fn(() => {
    this.pending = false;
    this.speaking = false;
  });
  readonly pause = vi.fn(() => {
    this.paused = true;
  });
  readonly resume = vi.fn(() => {
    this.paused = false;
  });

  getVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  speak(utterance: SpeechSynthesisUtterance): void {
    this.spoken.push(utterance);
    this.pending = true;
    this.speaking = true;
  }

  emitVoicesChanged(): void {
    this.dispatchEvent(new Event('voiceschanged'));
  }
}

class FakeUtterance extends EventTarget implements SpeechSynthesisUtterance {
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

  finish(): void {
    this.onend?.call(this, new Event('end') as SpeechSynthesisEvent);
  }

  fail(): void {
    this.onerror?.call(this, {
      error: 'synthesis-failed',
    } as SpeechSynthesisErrorEvent);
  }
}

function voice(
  name = 'Ecuador',
  options: {
    readonly lang?: string;
    readonly localService?: boolean;
    readonly voiceURI?: string;
  } = {},
): SpeechSynthesisVoice {
  return {
    name,
    lang: options.lang ?? 'es-EC',
    localService: options.localService ?? true,
    default: false,
    voiceURI: options.voiceURI ?? `voice:${name}`,
  };
}

function setup(voices: SpeechSynthesisVoice[] = [voice()]) {
  const synthesis = new FakeSpeechSynthesis();
  synthesis.voices = voices;
  const utterances: FakeUtterance[] = [];
  const output = new BrowserSpeechOutput({
    synthesis,
    createUtterance: (text) => {
      const utterance = new FakeUtterance(text);
      utterances.push(utterance);
      return utterance;
    },
  });
  return { output, synthesis, utterances };
}

describe('BrowserSpeechOutput', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('registra voiceschanged antes de consultar las voces inmediatamente', () => {
    const synthesis = new FakeSpeechSynthesis();
    const addListener = vi.spyOn(synthesis, 'addEventListener');
    const getVoices = vi.spyOn(synthesis, 'getVoices');

    const output = new BrowserSpeechOutput({
      synthesis,
      createUtterance: (text) => new FakeUtterance(text),
      voiceRetryDelaysMs: [],
    });

    expect(addListener).toHaveBeenCalledWith(
      'voiceschanged',
      expect.any(Function),
    );
    expect(addListener.mock.invocationCallOrder[0]).toBeLessThan(
      getVoices.mock.invocationCallOrder[0] ?? Number.POSITIVE_INFINITY,
    );
    output.dispose();
  });

  it('recupera una voz publicada sin un nuevo voiceschanged mediante reintentos acotados', () => {
    vi.useFakeTimers();
    const synthesis = new FakeSpeechSynthesis();
    const getVoices = vi.spyOn(synthesis, 'getVoices');
    const output = new BrowserSpeechOutput({
      synthesis,
      createUtterance: (text) => new FakeUtterance(text),
      voiceRetryDelaysMs: [10, 20, 40],
    });

    synthesis.voices = [voice()];
    vi.advanceTimersByTime(10);

    expect(output.getSnapshot().status).toBe('ready');
    expect(getVoices).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(1_000);
    expect(getVoices).toHaveBeenCalledTimes(2);
    expect(vi.getTimerCount()).toBe(0);
    output.dispose();
  });

  it('mantiene la búsqueda predeterminada más allá del antiguo límite de 2,1 segundos', () => {
    vi.useFakeTimers();
    const synthesis = new FakeSpeechSynthesis();
    const getVoices = vi.spyOn(synthesis, 'getVoices');
    const output = new BrowserSpeechOutput({
      synthesis,
      createUtterance: (text) => new FakeUtterance(text),
    });

    vi.advanceTimersByTime(2_200);
    expect(output.getSnapshot().status).toBe('loading_voices');
    synthesis.voices = [voice()];
    vi.advanceTimersByTime(500);

    expect(output.getSnapshot().status).toBe('ready');
    expect(getVoices.mock.calls.length).toBeGreaterThan(6);
    expect(synthesis.spoken).toHaveLength(0);
    expect(vi.getTimerCount()).toBe(0);
    output.dispose();
  });

  it('limita los reintentos y elimina timers y listeners al desmontar', () => {
    vi.useFakeTimers();
    const synthesis = new FakeSpeechSynthesis();
    const getVoices = vi.spyOn(synthesis, 'getVoices');
    const removeListener = vi.spyOn(synthesis, 'removeEventListener');
    const removeWindowListener = vi.spyOn(window, 'removeEventListener');
    const removeDocumentListener = vi.spyOn(document, 'removeEventListener');
    const output = new BrowserSpeechOutput({
      synthesis,
      createUtterance: (text) => new FakeUtterance(text),
      voiceRetryDelaysMs: [10, 20],
    });

    vi.advanceTimersByTime(1_000);
    expect(getVoices).toHaveBeenCalledTimes(3);
    expect(vi.getTimerCount()).toBe(0);

    output.dispose();

    expect(removeListener).toHaveBeenCalledWith(
      'voiceschanged',
      expect.any(Function),
    );
    expect(removeWindowListener).toHaveBeenCalledWith(
      'focus',
      expect.any(Function),
    );
    expect(removeDocumentListener).toHaveBeenCalledWith(
      'visibilitychange',
      expect.any(Function),
    );
    expect(vi.getTimerCount()).toBe(0);
  });

  it('reconsulta al recuperar foco o visibilidad solo mientras no haya voz seleccionada', () => {
    const synthesis = new FakeSpeechSynthesis();
    const getVoices = vi.spyOn(synthesis, 'getVoices');
    const output = new BrowserSpeechOutput({
      synthesis,
      createUtterance: (text) => new FakeUtterance(text),
      voiceRetryDelaysMs: [],
    });

    synthesis.voices = [voice()];
    window.dispatchEvent(new Event('focus'));
    expect(output.getSnapshot().status).toBe('ready');
    expect(getVoices).toHaveBeenCalledTimes(2);

    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event('focus'));
    expect(getVoices).toHaveBeenCalledTimes(2);
    expect(synthesis.spoken).toHaveLength(0);
    output.dispose();
  });

  it('expone soporte ausente y rechaza hablar sin API', async () => {
    const output = new BrowserSpeechOutput({
      synthesis: null,
      createUtterance: null,
    });
    expect(output.getSnapshot().status).toBe('unsupported');
    expect(output.isAvailable()).toBe(false);
    await expect(output.speak('Texto visible')).rejects.toMatchObject({
      code: 'unsupported',
    });
  });

  it('espera voces cuando la lista inicia vacía y reacciona a voiceschanged', () => {
    const { output, synthesis } = setup([]);
    expect(output.getSnapshot().status).toBe('loading_voices');
    synthesis.voices = [voice()];
    synthesis.emitVoicesChanged();
    expect(output.getSnapshot()).toMatchObject({
      status: 'ready',
      selectedVoice: { lang: 'es-EC' },
    });
  });

  it('no elige silenciosamente una voz no española', async () => {
    const { output } = setup([voice('English', { lang: 'en-US' })]);
    expect(output.getSnapshot().status).toBe('unavailable');
    await expect(output.speak('Texto visible')).rejects.toMatchObject({
      code: 'spanish_voice_unavailable',
    });
  });

  it('asigna voz vigente, idioma y parámetros fijos', async () => {
    const { output, synthesis, utterances } = setup();
    const promise = output.speak('Instrucción visible');
    expect(synthesis.spoken).toHaveLength(1);
    expect(utterances[0]).toMatchObject({
      text: 'Instrucción visible',
      lang: 'es-EC',
      rate: 1,
      pitch: 1,
      volume: 1,
      voice: synthesis.voices[0],
    });
    utterances[0]?.finish();
    await expect(promise).resolves.toBeUndefined();
  });

  it('mantiene una sola locución y sólo la última solicitud', async () => {
    const { output, synthesis, utterances } = setup();
    const first = output.speak('Primera');
    const second = output.speak('Segunda');
    expect(synthesis.cancel).toHaveBeenCalledTimes(2);
    expect(synthesis.spoken).toHaveLength(2);
    utterances[0]?.finish();
    utterances[1]?.finish();
    await expect(first).resolves.toBeUndefined();
    await expect(second).resolves.toBeUndefined();
  });

  it('reanuda una cola pausada antes de cancelarla', () => {
    const { output, synthesis } = setup();
    synthesis.paused = true;
    void output.speak('Texto');
    expect(synthesis.resume).toHaveBeenCalledOnce();
    expect(synthesis.cancel).toHaveBeenCalledOnce();
  });

  it('stop resuelve la cancelación esperada y descarta eventos tardíos', async () => {
    const { output, synthesis, utterances } = setup();
    const promise = output.speak('Texto');
    output.stop();
    utterances[0]?.fail();
    await expect(promise).resolves.toBeUndefined();
    expect(synthesis.cancel).toHaveBeenCalledTimes(2);
  });

  it('rechaza texto vacío y errores reales sin registrar contenido', async () => {
    const { output, utterances } = setup();
    await expect(output.speak('  ')).rejects.toBeInstanceOf(
      SpeechOutputFailure,
    );
    const promise = output.speak('Texto autorizado');
    utterances[0]?.fail();
    await expect(promise).rejects.toMatchObject({ code: 'synthesis_failed' });
  });

  it('recalcula la selección con el objeto actual si desaparece una voz', () => {
    const first = voice('Primera', { voiceURI: 'voice:a' });
    const second = voice('Segunda', { voiceURI: 'voice:b' });
    const { output, synthesis } = setup([first, second]);
    expect(output.getSnapshot().selectedVoice?.voiceURI).toBe('voice:a');
    synthesis.voices = [second];
    synthesis.emitVoicesChanged();
    expect(output.getSnapshot().selectedVoice?.voiceURI).toBe('voice:b');
  });

  it('retira el listener y cancela al desmontar', async () => {
    const { output, synthesis, utterances } = setup();
    const promise = output.speak('Texto');
    output.dispose();
    expect(output.isAvailable()).toBe(false);
    synthesis.voices = [voice('Nueva')];
    synthesis.emitVoicesChanged();
    utterances[0]?.fail();
    await expect(promise).resolves.toBeUndefined();
    await expect(output.speak('Otro')).rejects.toMatchObject({
      code: 'disposed',
    });
  });
});

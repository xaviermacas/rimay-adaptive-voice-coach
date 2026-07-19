import { describe, expect, it, vi } from 'vitest';

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

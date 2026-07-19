import { describe, expect, it } from 'vitest';

import {
  selectSpanishVoice,
  voiceIdentity,
} from './voiceSelection';

function voice(
  name: string,
  lang: string,
  options: {
    readonly localService?: boolean;
    readonly default?: boolean;
    readonly voiceURI?: string;
  } = {},
): SpeechSynthesisVoice {
  return {
    name,
    lang,
    localService: options.localService ?? false,
    default: options.default ?? false,
    voiceURI: options.voiceURI ?? `voice:${name}`,
  };
}

function selectedName(voices: readonly SpeechSynthesisVoice[]): string | null {
  const result = selectSpanishVoice(voices);
  return result.status === 'available' ? result.voice.name : null;
}

describe('selección determinista de voz española', () => {
  it('prioriza es-EC local sobre es-EC remota y otras variantes', () => {
    expect(
      selectedName([
        voice('ES local', 'es-ES', { localService: true }),
        voice('EC remota', 'es-EC'),
        voice('EC local', 'es-EC', { localService: true }),
      ]),
    ).toBe('EC local');
  });

  it('usa es-EC remota antes que es-* local', () => {
    expect(
      selectedName([
        voice('México local', 'es-MX', { localService: true }),
        voice('Ecuador remota', 'es-EC'),
      ]),
    ).toBe('Ecuador remota');
  });

  it('usa una variante es-* local antes que una remota', () => {
    expect(
      selectedName([
        voice('España remota', 'es-ES'),
        voice('México local', 'es-MX', { localService: true }),
      ]),
    ).toBe('México local');
  });

  it('prioriza default dentro del mismo grupo', () => {
    expect(
      selectedName([
        voice('A', 'es-EC', { localService: true, voiceURI: 'a' }),
        voice('Z', 'es-EC', {
          localService: true,
          default: true,
          voiceURI: 'z',
        }),
      ]),
    ).toBe('Z');
  });

  it('desempata ordinalmente por voiceURI, lang y name', () => {
    expect(
      selectedName([
        voice('Zulu', 'es-EC', { localService: true, voiceURI: 'b' }),
        voice('Zulu', 'es-EC', { localService: true, voiceURI: 'a' }),
      ]),
    ).toBe('Zulu');
    const result = selectSpanishVoice([
      voice('Zulu', 'es-EC', { localService: true, voiceURI: 'b' }),
      voice('Zulu', 'es-EC', { localService: true, voiceURI: 'a' }),
    ]);
    expect(result.status === 'available' ? result.voice.voiceURI : null).toBe(
      'a',
    );
  });

  it('compara tags sin distinguir mayúsculas y conserva el objeto original', () => {
    const original = voice('Ecuador', 'ES-ec', { localService: true });
    const result = selectSpanishVoice([original]);
    expect(result).toMatchObject({ status: 'available', voice: original });
    expect(result.status === 'available' ? result.voice.lang : null).toBe(
      'ES-ec',
    );
  });

  it('desempata el tag de idioma sin distinguir mayúsculas', () => {
    const uppercase = voice('Zulu', 'ES-EC', {
      localService: true,
      voiceURI: 'same-uri',
    });
    const lowercase = voice('Alpha', 'es-ec', {
      localService: true,
      voiceURI: 'same-uri',
    });

    const result = selectSpanishVoice([uppercase, lowercase]);

    expect(result.status).toBe('available');
    if (result.status === 'available') {
      expect(result.voice).toBe(lowercase);
      expect(result.voice.lang).toBe('es-ec');
    }
  });

  it('devuelve indisponibilidad explícita con lista vacía o sin español', () => {
    expect(selectSpanishVoice([])).toEqual({
      status: 'unavailable',
      reason: 'empty_voice_list',
    });
    expect(selectSpanishVoice([voice('English', 'en-US')])).toEqual({
      status: 'unavailable',
      reason: 'spanish_voice_unavailable',
    });
  });

  it('es independiente del orden de entrada y no muta la lista', () => {
    const voices = [
      voice('B', 'es-ES', { localService: true, voiceURI: 'b' }),
      voice('A', 'es-ES', { localService: true, voiceURI: 'a' }),
    ];
    const before = [...voices];
    expect(selectedName(voices)).toBe(selectedName([...voices].reverse()));
    expect(voices).toEqual(before);
  });

  it('distingue voces con nombres duplicados por identidad lógica completa', () => {
    const first = voice('Duplicada', 'es-EC', { voiceURI: 'voice:a' });
    const second = voice('Duplicada', 'es-EC', { voiceURI: 'voice:b' });
    expect(voiceIdentity(first)).not.toBe(voiceIdentity(second));
    expect(selectedName([second, first])).toBe('Duplicada');
    const result = selectSpanishVoice([second, first]);
    expect(result.status === 'available' ? result.voice.voiceURI : null).toBe(
      'voice:a',
    );
  });
});

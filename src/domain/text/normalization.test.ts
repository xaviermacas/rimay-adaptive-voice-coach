import { describe, expect, it } from 'vitest';

import { createSpeechTextResult, normalizeText } from './normalization';

describe('normalizeText', () => {
  it('conserva el original y normaliza NFC, minúsculas, puntuación y espacios', () => {
    const original = '  ¡CAFE\u0301,   NIÑO!  ';

    expect(normalizeText(original)).toEqual({
      originalText: original,
      normalizedText: 'café niño',
      comparisonText: 'cafe niño',
    });
  });

  it('conserva tildes y diéresis sólo en normalizedText', () => {
    expect(normalizeText('Pingüino, canción')).toMatchObject({
      normalizedText: 'pingüino canción',
      comparisonText: 'pinguino cancion',
    });
  });

  it('mantiene año y niño diferentes de ano y nino', () => {
    expect(normalizeText('año niño').comparisonText).toBe('año niño');
    expect(normalizeText('año').comparisonText).not.toBe(
      normalizeText('ano').comparisonText,
    );
    expect(normalizeText('niño').comparisonText).not.toBe(
      normalizeText('nino').comparisonText,
    );
  });

  it('maneja signos españoles y texto vacío', () => {
    expect(normalizeText('¿Hola? ¡Bien!').normalizedText).toBe('hola bien');
    expect(normalizeText('   ')).toEqual({
      originalText: '   ',
      normalizedText: '',
      comparisonText: '',
    });
  });
});

describe('createSpeechTextResult', () => {
  it('conserva procedencia, idioma, finalidad y fecha', () => {
    expect(
      createSpeechTextResult({
        originalText: 'Canción',
        source: 'browser',
        languageRequested: 'es-EC',
        isFinal: true,
        warnings: ['aproximación'],
        createdAt: '2026-07-18T12:00:00.000Z',
      }),
    ).toEqual({
      originalText: 'Canción',
      normalizedText: 'canción',
      comparisonText: 'cancion',
      source: 'browser',
      languageRequested: 'es-EC',
      isFinal: true,
      warnings: ['aproximación'],
      createdAt: '2026-07-18T12:00:00.000Z',
    });
  });
});

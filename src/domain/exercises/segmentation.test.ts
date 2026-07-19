import { describe, expect, it } from 'vitest';

import { segmentGuidedReadingText } from './segmentation';

describe('segmentación de lectura guiada', () => {
  it('segmenta la pausa canónica después de la coma', () => {
    const text = 'La mañana está tranquila, camino con calma.';
    expect(segmentGuidedReadingText(text, [25])).toEqual({
      ok: true,
      segments: [
        { text: 'La mañana está tranquila,', pauseAfter: true },
        { text: ' camino con calma.', pauseAfter: false },
      ],
    });
  });

  it('soporta múltiples pausas, texto sin pausas, tildes y ñ', () => {
    expect(segmentGuidedReadingText('Mañana, después; seguimos.', [7, 16])).toEqual({
      ok: true,
      segments: [
        { text: 'Mañana,', pauseAfter: true },
        { text: ' después;', pauseAfter: true },
        { text: ' seguimos.', pauseAfter: false },
      ],
    });
    expect(segmentGuidedReadingText('Mañana está aquí.', [])).toEqual({
      ok: true,
      segments: [{ text: 'Mañana está aquí.', pauseAfter: false }],
    });
  });

  it.each([
    { pauseCues: [0] },
    { pauseCues: [4] },
    { pauseCues: [5, 5] },
    { pauseCues: [99] },
  ])(
    'falla de forma controlada con cues inválidos %s',
    ({ pauseCues }) => {
      expect(segmentGuidedReadingText('Hola, mundo.', pauseCues)).toEqual({
        ok: false,
        error: {
          code: 'invalid_pause_cues',
          message: 'No se pudieron presentar las pausas de este ejercicio.',
        },
      });
    },
  );

  it('no muta el texto ni las pausas', () => {
    const text = 'Mañana, seguimos.';
    const cues = [7];
    const before = [...cues];
    const result = segmentGuidedReadingText(text, cues);

    expect(cues).toEqual(before);
    expect(
      result.ok ? result.segments.map(({ text: part }) => part).join('') : '',
    ).toBe(text);
  });
});

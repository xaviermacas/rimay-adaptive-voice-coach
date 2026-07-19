import { describe, expect, it } from 'vitest';

import { evaluateCoach } from '../coaching';
import type { Exercise } from '../contracts/domain';
import { VALID_AUDIO_METRICS } from '../../test/fixtures/coaching/coachFixtures';
import {
  EXERCISE_CATALOG,
  INITIAL_EXERCISE_SEQUENCE,
} from './catalog';
import {
  orderExerciseCatalog,
  validateExerciseCatalog,
} from './validation';

function replaceExercise(
  index: number,
  overrides: Readonly<Record<string, unknown>>,
): readonly unknown[] {
  return EXERCISE_CATALOG.map((exercise, exerciseIndex) =>
    exerciseIndex === index
      ? { ...exercise, pauseCues: [...exercise.pauseCues], ...overrides }
      : { ...exercise, pauseCues: [...exercise.pauseCues] },
  );
}

function issueCodes(
  catalog: unknown,
  sequence: unknown = INITIAL_EXERCISE_SEQUENCE,
): readonly string[] {
  const result = validateExerciseCatalog(catalog, sequence);
  return result.ok ? [] : result.issues.map(({ code }) => code);
}

describe('catálogo final de ejercicios', () => {
  it('declara exactamente los tres ejercicios y la secuencia canónica', () => {
    expect(EXERCISE_CATALOG).toEqual([
      {
        id: 'practice-word-casa',
        type: 'word_repetition',
        difficulty: 1,
        instruction: 'Pronuncia la palabra visible cuando estés listo.',
        targetText: 'casa',
        pauseCues: [],
        expectedMaxDurationMs: 3_000,
      },
      {
        id: 'practice-phrase-calm',
        type: 'phrase_repetition',
        difficulty: 2,
        instruction: 'Pronuncia la frase visible cuando estés listo.',
        targetText: 'Camino con calma.',
        pauseCues: [],
        expectedMaxDurationMs: 6_000,
      },
      {
        id: 'practice-guided-calm',
        type: 'guided_reading',
        difficulty: 3,
        instruction:
          'Lee el texto visible y haz una pausa donde aparece la indicación.',
        targetText: 'La mañana está tranquila, camino con calma.',
        pauseCues: [25],
        expectedMaxDurationMs: 12_000,
      },
    ]);
    expect(INITIAL_EXERCISE_SEQUENCE).toEqual([
      'practice-word-casa',
      'practice-phrase-calm',
      'practice-guided-calm',
    ]);
  });

  it('conserva la frontera UTF-16 exacta de la lectura guiada', () => {
    const guided = EXERCISE_CATALOG[2];
    expect(guided.targetText.length).toBe(43);
    expect(guided.targetText[24]).toBe(',');
    expect(guided.targetText.slice(0, guided.pauseCues[0])).toBe(
      'La mañana está tranquila,',
    );
  });

  it('valida y devuelve copias profundamente congeladas', () => {
    const result = validateExerciseCatalog(
      structuredClone(EXERCISE_CATALOG),
      structuredClone(INITIAL_EXERCISE_SEQUENCE),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(Object.isFrozen(result.catalog)).toBe(true);
    expect(Object.isFrozen(result.catalog[0])).toBe(true);
    expect(Object.isFrozen(result.catalog[0]?.pauseCues)).toBe(true);
    expect(Object.isFrozen(result.initialSequence)).toBe(true);
  });

  it('rechaza entrada no array, tamaño incorrecto e IDs repetidos', () => {
    expect(issueCodes({})).toContain('catalog_not_array');
    expect(issueCodes(EXERCISE_CATALOG.slice(0, 2))).toContain('catalog_size');
    expect(
      issueCodes(
        replaceExercise(1, { id: EXERCISE_CATALOG[0].id }),
      ),
    ).toContain('duplicate_id');
  });

  it('rechaza tipos inválidos, duplicados o ausentes', () => {
    expect(issueCodes(replaceExercise(0, { type: 'unknown' }))).toContain(
      'invalid_type',
    );
    const duplicateType = replaceExercise(1, {
      type: 'word_repetition',
      difficulty: 1,
    });
    expect(issueCodes(duplicateType)).toEqual(
      expect.arrayContaining([
        'duplicate_exercise_type',
        'missing_exercise_type',
      ]),
    );
  });

  it('rechaza contenido vacío, no NFC, duración y dificultad inválidas', () => {
    expect(issueCodes(replaceExercise(0, { instruction: ' ' }))).toContain(
      'empty_instruction',
    );
    expect(
      issueCodes(replaceExercise(0, { targetText: 'man\u0303ana' })),
    ).toContain('text_not_nfc');
    expect(
      issueCodes(replaceExercise(0, { expectedMaxDurationMs: 60_001 })),
    ).toContain('invalid_duration');
    expect(issueCodes(replaceExercise(0, { difficulty: 2 }))).toContain(
      'invalid_difficulty',
    );
  });

  it('rechaza lenguaje editorial deliberadamente prohibido', () => {
    const result = validateExerciseCatalog(
      replaceExercise(0, {
        instruction:
          'Este diagnóstico grave reemplaza la terapia y tiene aprobación clínica.',
      }),
      INITIAL_EXERCISE_SEQUENCE,
    );
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(
      result.issues
        .filter(({ code }) => code === 'prohibited_editorial_content')
        .map(({ editorialRuleId }) => editorialRuleId),
    ).toEqual(
      expect.arrayContaining([
        'diagnosis',
        'severity',
        'treatment',
        'therapy_replacement',
        'clinical_approval',
      ]),
    );
  });

  it.each([
    ['cero', [0], 'pause_cue_range'],
    ['final', [43], 'pause_cue_range'],
    ['repetida', [25, 25], 'pause_cue_order'],
    ['descendente', [25, 10], 'pause_cue_order'],
    ['fuera de rango', [99], 'pause_cue_range'],
    ['sin puntuación', [24], 'pause_cue_not_after_punctuation'],
  ])('rechaza una pausa %s', (_label, pauseCues, expectedCode) => {
    expect(issueCodes(replaceExercise(2, { pauseCues }))).toContain(
      expectedCode,
    );
  });

  it('rechaza una pausa que divide un par sustituto UTF-16', () => {
    expect(
      issueCodes(
        replaceExercise(2, {
          targetText: 'Hola 😀, camino con calma.',
          pauseCues: [6],
        }),
      ),
    ).toContain('pause_cue_surrogate_split');
  });

  it('aplica las reglas de pausas según el tipo', () => {
    expect(issueCodes(replaceExercise(0, { pauseCues: [1] }))).toContain(
      'unexpected_pause_cues',
    );
    expect(issueCodes(replaceExercise(1, { pauseCues: [7] }))).toContain(
      'unexpected_pause_cues',
    );
    expect(issueCodes(replaceExercise(2, { pauseCues: [] }))).toContain(
      'missing_pause_cue',
    );
    expect(issueCodes(replaceExercise(2, { pauseCues: [25.5] }))).toContain(
      'invalid_pause_cues',
    );
  });

  it('rechaza catálogo o secuencia fuera del orden canónico', () => {
    expect(issueCodes([...EXERCISE_CATALOG].reverse())).toContain(
      'catalog_order',
    );
    expect(
      issueCodes(EXERCISE_CATALOG, [...INITIAL_EXERCISE_SEQUENCE].reverse()),
    ).toContain('sequence_order');
  });

  it('rechaza secuencia repetida, desconocida o incompleta', () => {
    expect(
      issueCodes(EXERCISE_CATALOG, [
        INITIAL_EXERCISE_SEQUENCE[0],
        INITIAL_EXERCISE_SEQUENCE[0],
        INITIAL_EXERCISE_SEQUENCE[2],
      ]),
    ).toContain('duplicate_sequence_id');
    expect(
      issueCodes(EXERCISE_CATALOG, [
        INITIAL_EXERCISE_SEQUENCE[0],
        'unknown',
        INITIAL_EXERCISE_SEQUENCE[2],
      ]),
    ).toContain('unknown_sequence_id');
    expect(issueCodes(EXERCISE_CATALOG, [])).toContain('invalid_sequence');
  });

  it('ordena original, copia profunda e invertido sin mutarlos', () => {
    const original = [...EXERCISE_CATALOG];
    const deepCopy: readonly Exercise[] = structuredClone(EXERCISE_CATALOG);
    const reversed = [...deepCopy].reverse();
    const reversedBefore = structuredClone(reversed);

    expect(orderExerciseCatalog(original).map(({ id }) => id)).toEqual(
      INITIAL_EXERCISE_SEQUENCE,
    );
    expect(orderExerciseCatalog(deepCopy).map(({ id }) => id)).toEqual(
      INITIAL_EXERCISE_SEQUENCE,
    );
    expect(orderExerciseCatalog(reversed).map(({ id }) => id)).toEqual(
      INITIAL_EXERCISE_SEQUENCE,
    );
    expect(reversed).toEqual(reversedBefore);
  });

  it('integra palabra → frase y frase cubierta → lectura sin cambiar reglas', () => {
    const wordResult = evaluateCoach({
      attemptId: 'catalog-word',
      currentExercise: EXERCISE_CATALOG[0],
      textSource: null,
      audioMetrics: VALID_AUDIO_METRICS,
      textMetrics: null,
      currentDifficulty: 1,
      validAttemptCountBeforeCurrent: 0,
      coveredExerciseTypesBeforeCurrent: [],
      allowedExercises: EXERCISE_CATALOG,
    });
    const phraseResult = evaluateCoach({
      attemptId: 'catalog-phrase',
      currentExercise: EXERCISE_CATALOG[1],
      textSource: null,
      audioMetrics: VALID_AUDIO_METRICS,
      textMetrics: null,
      currentDifficulty: 2,
      validAttemptCountBeforeCurrent: 1,
      coveredExerciseTypesBeforeCurrent: ['word_repetition'],
      allowedExercises: EXERCISE_CATALOG,
    });

    expect(wordResult).toMatchObject({
      ok: true,
      decision: { selectedExerciseId: 'practice-phrase-calm' },
    });
    expect(phraseResult).toMatchObject({
      ok: true,
      decision: { selectedExerciseId: 'practice-guided-calm' },
    });
    if (wordResult.ok && wordResult.decision.selectedExerciseId !== null) {
      expect(
        EXERCISE_CATALOG.some(
          ({ id }) => id === wordResult.decision.selectedExerciseId,
        ),
      ).toBe(true);
    }
  });

  it('conserva missing_required_exercise_type sin fallback', () => {
    expect(
      evaluateCoach({
        attemptId: 'catalog-missing',
        currentExercise: EXERCISE_CATALOG[0],
        textSource: null,
        audioMetrics: VALID_AUDIO_METRICS,
        textMetrics: null,
        currentDifficulty: 1,
        validAttemptCountBeforeCurrent: 0,
        coveredExerciseTypesBeforeCurrent: [],
        allowedExercises: [EXERCISE_CATALOG[0], EXERCISE_CATALOG[2]],
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'missing_required_exercise_type' },
    });
  });
});

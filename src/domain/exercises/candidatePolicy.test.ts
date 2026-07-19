import { describe, expect, it } from 'vitest';

import type {
  Difficulty,
  Exercise,
  ExerciseType,
} from '../contracts/domain';
import {
  orderExerciseCandidates,
  selectExerciseCandidate,
} from './candidatePolicy';

function exercise(
  id: string,
  type: ExerciseType,
  difficulty: Difficulty,
): Exercise {
  return {
    id,
    type,
    difficulty,
    instruction: 'Realiza la actividad visible.',
    targetText: 'Texto ficticio.',
    pauseCues: [],
    expectedMaxDurationMs: 5_000,
  };
}

function orderedIds(
  allowedExercises: readonly Exercise[],
  overrides: Partial<{
    currentExerciseId: string;
    targetDifficulty: Difficulty;
    pendingRequiredExerciseType: ExerciseType | null;
  }> = {},
): readonly string[] {
  return orderExerciseCandidates({
    allowedExercises,
    currentExerciseId: 'current',
    targetDifficulty: 2,
    pendingRequiredExerciseType: null,
    ...overrides,
  }).map(({ id }) => id);
}

describe('política determinista de candidatos', () => {
  it('considera exclusivamente el tipo obligatorio pendiente', () => {
    const catalog = [
      exercise('word', 'word_repetition', 2),
      exercise('phrase', 'phrase_repetition', 2),
      exercise('guided', 'guided_reading', 2),
    ];

    expect(
      orderedIds(catalog, {
        pendingRequiredExerciseType: 'guided_reading',
      }),
    ).toEqual(['guided']);
  });

  it('devuelve null cuando falta el tipo obligatorio', () => {
    expect(
      selectExerciseCandidate({
        allowedExercises: [exercise('word', 'word_repetition', 1)],
        currentExerciseId: 'word',
        targetDifficulty: 1,
        pendingRequiredExerciseType: 'phrase_repetition',
      }),
    ).toBeNull();
  });

  it('es independiente del orden de entrada', () => {
    const first = exercise('first', 'word_repetition', 2);
    const second = exercise('second', 'phrase_repetition', 2);
    const third = exercise('third', 'guided_reading', 2);

    expect(orderedIds([third, first, second])).toEqual(
      orderedIds([second, third, first]),
    );
  });

  it('prioriza distancia a dificultad antes de evitar el ID actual', () => {
    expect(
      orderedIds(
        [
          exercise('current', 'guided_reading', 2),
          exercise('other', 'word_repetition', 1),
        ],
        { currentExerciseId: 'current' },
      ),
    ).toEqual(['current', 'other']);
  });

  it('evita el ID actual cuando la distancia empata', () => {
    expect(
      orderedIds(
        [
          exercise('current', 'word_repetition', 2),
          exercise('other', 'word_repetition', 2),
        ],
        { currentExerciseId: 'current' },
      ),
    ).toEqual(['other', 'current']);
  });

  it('usa el orden canónico de tipos después de distancia e ID actual', () => {
    expect(
      orderedIds([
        exercise('guided', 'guided_reading', 2),
        exercise('phrase', 'phrase_repetition', 2),
        exercise('word', 'word_repetition', 2),
      ]),
    ).toEqual(['word', 'phrase', 'guided']);
  });

  it('ordena dificultad menor antes de mayor cuando la distancia empata', () => {
    expect(
      orderedIds([
        exercise('high', 'word_repetition', 3),
        exercise('low', 'word_repetition', 1),
      ]),
    ).toEqual(['low', 'high']);
  });

  it('compara IDs ordinalmente con números, mayúsculas y minúsculas', () => {
    expect(
      orderedIds([
        exercise('a', 'word_repetition', 2),
        exercise('A', 'word_repetition', 2),
        exercise('1', 'word_repetition', 2),
      ]),
    ).toEqual(['1', 'A', 'a']);
  });

  it('puede seleccionar de nuevo el único ejercicio actual', () => {
    const current = exercise('current', 'word_repetition', 1);

    expect(
      selectExerciseCandidate({
        allowedExercises: [current],
        currentExerciseId: current.id,
        targetDifficulty: 1,
        pendingRequiredExerciseType: null,
      }),
    ).toBe(current);
  });

  it('no muta el catálogo permitido', () => {
    const catalog = [
      exercise('z', 'guided_reading', 3),
      exercise('a', 'word_repetition', 1),
    ];
    const before = structuredClone(catalog);

    orderExerciseCandidates({
      allowedExercises: catalog,
      currentExerciseId: 'z',
      targetDifficulty: 2,
      pendingRequiredExerciseType: null,
    });

    expect(catalog).toEqual(before);
  });
});

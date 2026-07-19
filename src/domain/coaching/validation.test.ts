import { describe, expect, it } from 'vitest';

import {
  GUIDED_EXERCISE,
  PHRASE_EXERCISE,
  VALID_AUDIO_METRICS,
  WORD_EXERCISE,
  createCoachInput,
  createTextMetrics,
} from '../../test/fixtures/coaching/coachFixtures';
import { validateCoachInput } from './validation';

function expectErrorCode(input: unknown, code: string): void {
  const result = validateCoachInput(input);
  expect(result).toMatchObject({ ok: false, error: { code } });
}

describe('validación de CoachInput', () => {
  it('acepta una entrada canónica sin mutarla', () => {
    const input = createCoachInput();
    const before = structuredClone(input);

    expect(validateCoachInput(input)).toEqual({ ok: true, input });
    expect(input).toEqual(before);
  });

  it('acepta métricas textuales cuyo objetivo coincide exactamente con el ejercicio', () => {
    const input = createCoachInput({
      currentExercise: PHRASE_EXERCISE,
      currentDifficulty: 2,
      validAttemptCountBeforeCurrent: 1,
      coveredExerciseTypesBeforeCurrent: ['word_repetition'],
      textMetrics: {
        ...createTextMetrics(),
        targetText: PHRASE_EXERCISE.targetText,
      },
    });

    expect(validateCoachInput(input)).toEqual({ ok: true, input });
  });

  it('rechaza métricas textuales que pertenecen a otro ejercicio', () => {
    const result = validateCoachInput(
      createCoachInput({
        textMetrics: {
          ...createTextMetrics(),
          targetText: PHRASE_EXERCISE.targetText,
        },
      }),
    );

    expect(result).toEqual({
      ok: false,
      error: {
        code: 'inconsistent_text_metrics',
        message:
          'Las métricas textuales no corresponden al texto objetivo del ejercicio actual.',
      },
    });
  });

  it('rechaza una diferencia de una sola palabra en el objetivo textual', () => {
    expectErrorCode(
      createCoachInput({
        currentExercise: PHRASE_EXERCISE,
        currentDifficulty: 2,
        validAttemptCountBeforeCurrent: 1,
        coveredExerciseTypesBeforeCurrent: ['word_repetition'],
        textMetrics: {
          ...createTextMetrics(),
          targetText: 'La casa tiene una puerta verde.',
        },
      }),
      'inconsistent_text_metrics',
    );
  });

  it('rechaza una diferencia únicamente de puntuación en el objetivo textual', () => {
    expectErrorCode(
      createCoachInput({
        textMetrics: { ...createTextMetrics(), targetText: 'casa.' },
      }),
      'inconsistent_text_metrics',
    );
  });

  it('no aplica la correspondencia de objetivo cuando las métricas son nulas', () => {
    const input = createCoachInput({ textSource: null, textMetrics: null });

    expect(validateCoachInput(input)).toEqual({ ok: true, input });
  });

  it('rechaza un attemptId vacío', () => {
    expectErrorCode(createCoachInput({ attemptId: '  ' }), 'invalid_input');
  });

  it.each([-1, 5, 0.5])(
    'rechaza el contador anterior inválido %s',
    (validAttemptCountBeforeCurrent) => {
      expectErrorCode(
        createCoachInput({ validAttemptCountBeforeCurrent }),
        'invalid_attempt_state',
      );
    },
  );

  it('rechaza cobertura incompatible con el contador', () => {
    expectErrorCode(
      createCoachInput({
        validAttemptCountBeforeCurrent: 1,
        coveredExerciseTypesBeforeCurrent: [],
        currentExercise: PHRASE_EXERCISE,
      }),
      'invalid_attempt_state',
    );
  });

  it('rechaza el ejercicio actual incompatible con la cobertura obligatoria', () => {
    expectErrorCode(
      createCoachInput({
        validAttemptCountBeforeCurrent: 2,
        coveredExerciseTypesBeforeCurrent: [
          'word_repetition',
          'phrase_repetition',
        ],
        currentExercise: PHRASE_EXERCISE,
      }),
      'invalid_attempt_state',
    );
  });

  it('acepta los prefijos canónicos de cobertura', () => {
    const cases = [
      createCoachInput(),
      createCoachInput({
        validAttemptCountBeforeCurrent: 1,
        coveredExerciseTypesBeforeCurrent: ['word_repetition'],
        currentExercise: PHRASE_EXERCISE,
        currentDifficulty: 2,
      }),
      createCoachInput({
        validAttemptCountBeforeCurrent: 2,
        coveredExerciseTypesBeforeCurrent: [
          'word_repetition',
          'phrase_repetition',
        ],
        currentExercise: GUIDED_EXERCISE,
        currentDifficulty: 2,
      }),
      createCoachInput({
        validAttemptCountBeforeCurrent: 4,
        coveredExerciseTypesBeforeCurrent: [
          'word_repetition',
          'phrase_repetition',
          'guided_reading',
        ],
      }),
    ];

    for (const input of cases) {
      expect(validateCoachInput(input).ok).toBe(true);
    }
  });

  it('rechaza una lista permitida vacía', () => {
    expectErrorCode(
      createCoachInput({ allowedExercises: [] }),
      'empty_allowed_exercises',
    );
  });

  it('rechaza IDs duplicados', () => {
    expectErrorCode(
      createCoachInput({ allowedExercises: [WORD_EXERCISE, WORD_EXERCISE] }),
      'duplicate_exercise_id',
    );
  });

  it.each([
    { ...WORD_EXERCISE, id: '' },
    { ...WORD_EXERCISE, expectedMaxDurationMs: Number.NaN },
    { ...WORD_EXERCISE, expectedMaxDurationMs: Number.POSITIVE_INFINITY },
    { ...WORD_EXERCISE, expectedMaxDurationMs: 0 },
    { ...WORD_EXERCISE, difficulty: 4 },
    { ...WORD_EXERCISE, pauseCues: [2, 1] },
    { ...WORD_EXERCISE, pauseCues: [-1] },
    { ...WORD_EXERCISE, pauseCues: [Number.NaN] },
  ])('rechaza un ejercicio inválido %#', (invalidExercise) => {
    expectErrorCode(
      {
        ...createCoachInput(),
        allowedExercises: [invalidExercise, PHRASE_EXERCISE],
      },
      'invalid_exercise',
    );
  });

  it('rechaza un ejercicio actual inválido', () => {
    expectErrorCode(
      {
        ...createCoachInput(),
        currentExercise: {
          ...WORD_EXERCISE,
          expectedMaxDurationMs: Number.POSITIVE_INFINITY,
        },
      },
      'invalid_exercise',
    );
  });

  it('rechaza un identificador de calidad acústica no canónico', () => {
    expectErrorCode(
      {
        ...createCoachInput(),
        audioMetrics: {
          ...VALID_AUDIO_METRICS,
          qualityFlags: ['silent_audio'],
        },
      },
      'invalid_input',
    );
  });

  it('rechaza una dificultad actual fuera del contrato', () => {
    expectErrorCode(
      { ...createCoachInput(), currentDifficulty: 4 },
      'invalid_input',
    );
  });

  it('rechaza una versión acústica incompatible', () => {
    expectErrorCode(
      createCoachInput({
        audioMetrics: {
          ...VALID_AUDIO_METRICS,
          algorithmVersion: 'audio-metrics-v2',
        } as never,
      }),
      'incompatible_algorithm_version',
    );
  });

  it('rechaza una versión textual incompatible', () => {
    expectErrorCode(
      createCoachInput({
        textMetrics: {
          ...createTextMetrics(),
          algorithmVersion: 'text-metrics-v2',
        } as never,
      }),
      'incompatible_algorithm_version',
    );
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY])(
    'rechaza el valor acústico no finito %s',
    (rms) => {
      expectErrorCode(
        createCoachInput({ audioMetrics: { ...VALID_AUDIO_METRICS, rms } }),
        'invalid_input',
      );
    },
  );

  it.each([Number.NaN, Number.POSITIVE_INFINITY])(
    'rechaza el valor textual no finito %s',
    (textSimilarity) => {
      expectErrorCode(
        createCoachInput({ textMetrics: createTextMetrics('browser', textSimilarity) }),
        'invalid_input',
      );
    },
  );

  it('rechaza una contradicción entre possibleClipping y su flag', () => {
    expectErrorCode(
      createCoachInput({
        audioMetrics: { ...VALID_AUDIO_METRICS, possibleClipping: true },
      }),
      'inconsistent_audio_metrics',
    );
  });

  it('rechaza una fuente textual sin métricas', () => {
    expectErrorCode(
      createCoachInput({ textSource: 'browser', textMetrics: null }),
      'invalid_attempt_state',
    );
  });

  it('rechaza métricas textuales sin fuente', () => {
    expectErrorCode(
      createCoachInput({ textSource: null }),
      'invalid_attempt_state',
    );
  });

  it('rechaza métricas cuya procedencia contradice textSource', () => {
    expectErrorCode(
      createCoachInput({ textMetrics: createTextMetrics('manual') }),
      'invalid_attempt_state',
    );
  });
});

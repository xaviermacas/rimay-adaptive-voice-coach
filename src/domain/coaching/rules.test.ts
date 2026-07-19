import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
  AudioQualityFlag,
  DeterministicMetrics,
} from '../audio/types';
import type { Exercise } from '../contracts/domain';
import {
  GUIDED_EXERCISE,
  PHRASE_EXERCISE,
  VALID_AUDIO_METRICS,
  WORD_EXERCISE,
  createCoachInput,
  createTextMetrics,
} from '../../test/fixtures/coaching/coachFixtures';
import { COACH_TEMPLATES } from './templates';
import type { CoachDecision, CoachInput, CoachResult } from './types';
import { evaluateCoach } from './rules';

function expectDecision(result: CoachResult): CoachDecision {
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error(`Se esperaba una decisión, pero se recibió ${result.error.code}.`);
  }
  return result.decision;
}

function audioWithFlags(
  qualityFlags: readonly AudioQualityFlag[],
): DeterministicMetrics {
  const possibleClipping = qualityFlags.includes('possible_clipping');
  return {
    ...VALID_AUDIO_METRICS,
    possibleClipping,
    clippedSampleRatio: possibleClipping ? 0.01 : 0,
    qualityFlags,
  };
}

function fullCoverageInput(overrides: Partial<CoachInput> = {}): CoachInput {
  return createCoachInput({
    currentExercise: WORD_EXERCISE,
    currentDifficulty: 1,
    validAttemptCountBeforeCurrent: 3,
    coveredExerciseTypesBeforeCurrent: [
      'word_repetition',
      'phrase_repetition',
      'guided_reading',
    ],
    ...overrides,
  });
}

const WORD_ALTERNATIVE: Exercise = Object.freeze({
  ...WORD_EXERCISE,
  id: 'word-1-alternative',
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('calidad acústica y prioridad', () => {
  it.each([
    'audio_too_short',
    'no_speech_detected',
    'too_quiet',
    'possible_clipping',
  ] as const)('trata %s como bloqueante', (flag) => {
    const decision = expectDecision(
      evaluateCoach(
        createCoachInput({
          audioMetrics: audioWithFlags([flag, 'transcription_missing']),
        }),
      ),
    );

    expect(decision).toMatchObject({
      ruleId: 'capture_quality_blocking',
      action: 'repeat_current',
      focus: 'clear_capture',
      selectedExerciseId: null,
    });
  });

  it('trata una combinación de flags bloqueantes como una sola recomendación', () => {
    const decision = expectDecision(
      evaluateCoach(
        createCoachInput({
          audioMetrics: audioWithFlags([
            'audio_too_short',
            'no_speech_detected',
            'too_quiet',
            'possible_clipping',
            'transcription_missing',
          ]),
        }),
      ),
    );

    expect(decision.action).toBe('repeat_current');
    expect(decision.evidenceKeys).toEqual(['qualityFlags', 'silenceRatio']);
  });

  it.each([
    [0.849999, 'continue'],
    [0.85, 'repeat_current'],
    [0.9, 'repeat_current'],
  ] as const)('aplica el límite de silencio %s', (silenceRatio, action) => {
    const decision = expectDecision(
      evaluateCoach(
        createCoachInput({
          audioMetrics: { ...VALID_AUDIO_METRICS, silenceRatio },
        }),
      ),
    );

    expect(decision.action).toBe(action);
  });

  it('no considera transcription_missing ni ausencia de texto como mala captura', () => {
    const decision = expectDecision(
      evaluateCoach(
        fullCoverageInput({ textSource: null, textMetrics: null }),
      ),
    );

    expect(decision.action).toBe('continue');
    expect(decision.templateId).toBe('continue-no-text-v1');
  });

  it('prioriza calidad bloqueante sobre el quinto intento', () => {
    const decision = expectDecision(
      evaluateCoach(
        fullCoverageInput({
          validAttemptCountBeforeCurrent: 4,
          audioMetrics: audioWithFlags([
            'no_speech_detected',
            'transcription_missing',
          ]),
        }),
      ),
    );

    expect(decision.action).toBe('repeat_current');
    expect(decision.templateId).toBe('capture-clear-v1');
    expect(decision.templateId).not.toBe('session-complete-v1');
    expect(decision.evidenceKeys).toEqual(['qualityFlags', 'silenceRatio']);
    expect(decision.selectedExerciseId).toBeNull();
  });
});

describe('finalización y cobertura', () => {
  it('no completa con tres intentos válidos anteriores', () => {
    expect(expectDecision(evaluateCoach(fullCoverageInput())).action).toBe(
      'continue',
    );
  });

  it('completa con cuatro intentos anteriores y captura válida', () => {
    const decision = expectDecision(
      evaluateCoach(
        fullCoverageInput({ validAttemptCountBeforeCurrent: 4 }),
      ),
    );

    expect(decision).toMatchObject({
      ruleId: 'complete_fifth_valid_attempt',
      action: 'complete_session',
      focus: 'complete',
      selectedExerciseId: null,
    });
    expect(decision.explanation).toBe(
      'La captura actual no presentó alertas bloqueantes y completa el quinto intento válido de la sesión.',
    );
    expect(decision.evidenceKeys).toEqual([
      'validAttemptCountBeforeCurrent',
      'qualityFlags',
      'silenceRatio',
    ]);
  });

  it('selecciona frase después del primer intento de palabra', () => {
    const decision = expectDecision(evaluateCoach(createCoachInput()));

    expect(decision.selectedExerciseId).toBe(PHRASE_EXERCISE.id);
  });

  it('selecciona lectura guiada después del segundo intento', () => {
    const decision = expectDecision(
      evaluateCoach(
        createCoachInput({
          currentExercise: PHRASE_EXERCISE,
          currentDifficulty: 2,
          validAttemptCountBeforeCurrent: 1,
          coveredExerciseTypesBeforeCurrent: ['word_repetition'],
        }),
      ),
    );

    expect(decision.selectedExerciseId).toBe(GUIDED_EXERCISE.id);
  });

  it('libera el catálogo completo después del tercer tipo obligatorio', () => {
    const wordAtDifficultyTwo: Exercise = {
      ...WORD_EXERCISE,
      id: 'word-2',
      difficulty: 2,
    };
    const decision = expectDecision(
      evaluateCoach(
        createCoachInput({
          currentExercise: GUIDED_EXERCISE,
          currentDifficulty: 2,
          validAttemptCountBeforeCurrent: 2,
          coveredExerciseTypesBeforeCurrent: [
            'word_repetition',
            'phrase_repetition',
          ],
          allowedExercises: [GUIDED_EXERCISE, wordAtDifficultyTwo],
        }),
      ),
    );

    expect(decision.selectedExerciseId).toBe(wordAtDifficultyTwo.id);
  });

  it('devuelve error si falta el siguiente tipo obligatorio', () => {
    expect(
      evaluateCoach(
        createCoachInput({ allowedExercises: [WORD_EXERCISE] }),
      ),
    ).toMatchObject({
      ok: false,
      error: { code: 'missing_required_exercise_type' },
    });
  });

  it('encuentra el candidato obligatorio en un catálogo desordenado', () => {
    const decision = expectDecision(
      evaluateCoach(
        createCoachInput({
          allowedExercises: [
            GUIDED_EXERCISE,
            WORD_EXERCISE,
            PHRASE_EXERCISE,
          ],
        }),
      ),
    );

    expect(decision.selectedExerciseId).toBe(PHRASE_EXERCISE.id);
  });
});

describe('reglas de foco y plantillas', () => {
  it('produce follow_pause_cues para lectura guiada sin pausas', () => {
    const decision = expectDecision(
      evaluateCoach(
        createCoachInput({
          currentExercise: GUIDED_EXERCISE,
          currentDifficulty: 2,
          validAttemptCountBeforeCurrent: 2,
          coveredExerciseTypesBeforeCurrent: [
            'word_repetition',
            'phrase_repetition',
          ],
          audioMetrics: { ...VALID_AUDIO_METRICS, pauseCount: 0 },
        }),
      ),
    );

    expect(decision).toMatchObject({
      ruleId: 'continue_follow_pause_cues',
      templateId: 'pause-cues-v1',
      focus: 'follow_pause_cues',
    });
    expect(decision.shortFeedback).toBe(
      'En la siguiente actividad, sigue las pausas indicadas.',
    );
    expect(decision.explanation).toBe(
      'La actividad actual incluye pausas indicadas y no se detectaron pausas durante este intento.',
    );
    expect(decision.evidenceKeys).toEqual(['pauseCount', 'pauseCues']);
  });

  it('no afirma pausas indicadas si la lectura guiada no define pauseCues', () => {
    const currentExercise: Exercise = {
      ...GUIDED_EXERCISE,
      pauseCues: [],
    };
    const decision = expectDecision(
      evaluateCoach(
        createCoachInput({
          currentExercise,
          currentDifficulty: 2,
          validAttemptCountBeforeCurrent: 2,
          coveredExerciseTypesBeforeCurrent: [
            'word_repetition',
            'phrase_repetition',
          ],
          audioMetrics: { ...VALID_AUDIO_METRICS, pauseCount: 0 },
        }),
      ),
    );

    expect(decision.ruleId).toBe('continue_default');
    expect(decision.templateId).not.toBe('pause-cues-v1');
    expect(decision.explanation).not.toContain('pausas indicadas');
  });

  it('prioriza pausas indicadas sobre duración y similitud', () => {
    const decision = expectDecision(
      evaluateCoach(
        createCoachInput({
          currentExercise: GUIDED_EXERCISE,
          currentDifficulty: 2,
          validAttemptCountBeforeCurrent: 2,
          coveredExerciseTypesBeforeCurrent: [
            'word_repetition',
            'phrase_repetition',
          ],
          audioMetrics: {
            ...VALID_AUDIO_METRICS,
            pauseCount: 0,
            totalDurationMs: GUIDED_EXERCISE.expectedMaxDurationMs + 1,
          },
          textMetrics: {
            ...createTextMetrics('browser', 0.64),
            targetText: GUIDED_EXERCISE.targetText,
          },
        }),
      ),
    );

    expect(decision.ruleId).toBe('continue_follow_pause_cues');
  });

  it('no activa steady_pace en la duración máxima exacta', () => {
    const decision = expectDecision(
      evaluateCoach(
        createCoachInput({
          currentExercise: PHRASE_EXERCISE,
          currentDifficulty: 2,
          validAttemptCountBeforeCurrent: 1,
          coveredExerciseTypesBeforeCurrent: ['word_repetition'],
          audioMetrics: {
            ...VALID_AUDIO_METRICS,
            totalDurationMs: PHRASE_EXERCISE.expectedMaxDurationMs,
          },
        }),
      ),
    );

    expect(decision.ruleId).toBe('continue_default');
  });

  it('produce steady_pace sólo al superar la duración esperada', () => {
    const decision = expectDecision(
      evaluateCoach(
        createCoachInput({
          currentExercise: PHRASE_EXERCISE,
          currentDifficulty: 2,
          validAttemptCountBeforeCurrent: 1,
          coveredExerciseTypesBeforeCurrent: ['word_repetition'],
          audioMetrics: {
            ...VALID_AUDIO_METRICS,
            totalDurationMs: PHRASE_EXERCISE.expectedMaxDurationMs + 1,
            analyzedDurationMs: PHRASE_EXERCISE.expectedMaxDurationMs + 1,
          },
        }),
      ),
    );

    expect(decision).toMatchObject({
      ruleId: 'continue_steady_pace',
      templateId: 'steady-pace-v1',
      focus: 'steady_pace',
    });
    expect(decision.shortFeedback).toBe(
      'Mantén un ritmo estable en la siguiente actividad.',
    );
    expect(decision.explanation).toBe(
      'La duración total del intento superó el tiempo máximo esperado para esta actividad.',
    );
    expect(decision.evidenceKeys).toEqual([
      'totalDurationMs',
      'expectedMaxDurationMs',
    ]);
  });

  it('produce repeat_calmly para similitud menor de 0.65', () => {
    const decision = expectDecision(
      evaluateCoach(
        fullCoverageInput({
          textMetrics: createTextMetrics('browser', 0.64),
          allowedExercises: [
            WORD_EXERCISE,
            WORD_ALTERNATIVE,
            PHRASE_EXERCISE,
            GUIDED_EXERCISE,
          ],
        }),
      ),
    );

    expect(decision).toMatchObject({
      ruleId: 'continue_repeat_calmly',
      templateId: 'repeat-text-browser-v1',
      focus: 'repeat_calmly',
      action: 'continue',
    });
    expect(decision.shortFeedback).toBe(
      'En la siguiente actividad, pronuncia el texto con calma.',
    );
    expect(decision.shortFeedback).not.toMatch(/repite|repetir/iu);
    expect(decision.evidenceKeys).toEqual(['textSimilarity']);
    expect(decision.selectedExerciseId).toBe(WORD_ALTERNATIVE.id);
    expect(decision.selectedExerciseId).not.toBe(WORD_EXERCISE.id);
  });

  it.each([
    [
      'browser',
      'El texto reconocido mostró baja coincidencia con la frase objetivo; el siguiente ejercicio mantiene el foco en pronunciar con calma.',
    ],
    [
      'manual',
      'El texto introducido mostró baja coincidencia con la frase objetivo; el siguiente ejercicio mantiene el foco en pronunciar con calma.',
    ],
    [
      'demo',
      'El texto simulado mostró baja coincidencia con la frase objetivo; el siguiente ejercicio mantiene el foco en pronunciar con calma.',
    ],
  ] as const)('conserva la procedencia %s en la explicación', (source, explanation) => {
    const decision = expectDecision(
      evaluateCoach(
        fullCoverageInput({
          textSource: source,
          textMetrics: createTextMetrics(source, 0.64),
        }),
      ),
    );

    expect(decision.explanation).toBe(explanation);
    expect(decision.evidenceKeys).toEqual(['textSimilarity']);
  });

  it('omite toda evidencia textual sin fuente ni métricas textuales', () => {
    const decision = expectDecision(
      evaluateCoach(
        fullCoverageInput({ textSource: null, textMetrics: null }),
      ),
    );

    expect(decision.evidenceKeys).not.toContain('textSimilarity');
    expect(decision).toMatchObject({
      ruleId: 'continue_default',
      templateId: 'continue-no-text-v1',
      action: 'continue',
      selectedExerciseId: WORD_EXERCISE.id,
    });
    expect(decision.explanation).toBe(
      'No hubo métricas textuales disponibles; la captura fue válida y se mantuvo la dificultad actual.',
    );
    expect(decision.evidenceKeys).toEqual([
      'qualityFlags',
      'silenceRatio',
      'currentDifficulty',
    ]);
    expect(decision.explanation).not.toMatch(
      /coincidencia|reconocid|introducid|simulad|pronunciación/iu,
    );
  });

  it('limita la evidencia de las plantillas default con texto a la similitud', () => {
    const decision = expectDecision(evaluateCoach(fullCoverageInput()));

    expect(decision.ruleId).toBe('continue_default');
    expect(decision.evidenceKeys).toEqual(['textSimilarity']);
  });

  it('usa únicamente evidencias declaradas por su plantilla', () => {
    const decision = expectDecision(evaluateCoach(fullCoverageInput()));
    const template = COACH_TEMPLATES.find(({ id }) => id === decision.templateId);

    expect(template).toBeDefined();
    expect(
      decision.evidenceKeys.every((key) =>
        template?.allowedEvidenceKeys.includes(key),
      ),
    ).toBe(true);
  });

  it('no usa métricas textuales de otro ejercicio para decidir', () => {
    expect(
      evaluateCoach(
        fullCoverageInput({
          textMetrics: {
            ...createTextMetrics('browser', 0.2),
            targetText: PHRASE_EXERCISE.targetText,
          },
        }),
      ),
    ).toEqual({
      ok: false,
      error: {
        code: 'inconsistent_text_metrics',
        message:
          'Las métricas textuales no corresponden al texto objetivo del ejercicio actual.',
      },
    });
  });
});

describe('determinismo e inmutabilidad', () => {
  it.each([
    [
      'continue_default con browser',
      () => fullCoverageInput(),
      { ok: true, decision: { ruleId: 'continue_default' } },
    ],
    [
      'continue_repeat_calmly con manual',
      () =>
        fullCoverageInput({
          textSource: 'manual',
          textMetrics: createTextMetrics('manual', 0.64),
          allowedExercises: [
            WORD_EXERCISE,
            WORD_ALTERNATIVE,
            PHRASE_EXERCISE,
            GUIDED_EXERCISE,
          ],
        }),
      { ok: true, decision: { ruleId: 'continue_repeat_calmly' } },
    ],
    [
      'continue_follow_pause_cues',
      () =>
        createCoachInput({
          currentExercise: GUIDED_EXERCISE,
          currentDifficulty: 2,
          validAttemptCountBeforeCurrent: 2,
          coveredExerciseTypesBeforeCurrent: [
            'word_repetition',
            'phrase_repetition',
          ],
          audioMetrics: { ...VALID_AUDIO_METRICS, pauseCount: 0 },
        }),
      { ok: true, decision: { ruleId: 'continue_follow_pause_cues' } },
    ],
    [
      'capture_quality_blocking',
      () =>
        createCoachInput({
          audioMetrics: audioWithFlags([
            'no_speech_detected',
            'transcription_missing',
          ]),
        }),
      { ok: true, decision: { ruleId: 'capture_quality_blocking' } },
    ],
    [
      'missing_required_exercise_type',
      () => createCoachInput({ allowedExercises: [WORD_EXERCISE] }),
      { ok: false, error: { code: 'missing_required_exercise_type' } },
    ],
  ] as const)(
    'mantiene determinismo total para %s',
    (_name, createInput, expectedBranch) => {
      const input = createInput();
      const originalSnapshot = structuredClone(input);

      const firstResult = evaluateCoach(input);
      const secondResult = evaluateCoach(input);

      const deepCopiedInput = structuredClone(input);
      const copiedSnapshot = structuredClone(deepCopiedInput);
      const deepCopiedResult = evaluateCoach(deepCopiedInput);

      const reversedCatalogInput: CoachInput = {
        ...structuredClone(input),
        allowedExercises: [...input.allowedExercises].reverse(),
      };
      const reversedSnapshot = structuredClone(reversedCatalogInput);
      const reversedResult = evaluateCoach(reversedCatalogInput);

      expect(firstResult).toMatchObject(expectedBranch);
      expect(secondResult).toEqual(firstResult);
      expect(deepCopiedResult).toEqual(firstResult);
      expect(reversedResult).toEqual(firstResult);
      expect(input).toEqual(originalSnapshot);
      expect(deepCopiedInput).toEqual(copiedSnapshot);
      expect(reversedCatalogInput).toEqual(reversedSnapshot);
    },
  );

  it('no consulta fecha ni aleatoriedad', () => {
    vi.spyOn(Date, 'now').mockImplementation(() => {
      throw new Error('Date.now no está permitido.');
    });
    vi.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('Math.random no está permitido.');
    });

    expect(evaluateCoach(fullCoverageInput()).ok).toBe(true);
  });

  it('selecciona siempre un ID perteneciente al catálogo permitido', () => {
    const input = fullCoverageInput();
    const decision = expectDecision(evaluateCoach(input));

    expect(
      input.allowedExercises.some(({ id }) => id === decision.selectedExerciseId),
    ).toBe(true);
  });
});

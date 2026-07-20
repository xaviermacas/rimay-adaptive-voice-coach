import { describe, expect, it } from 'vitest';

import type { Exercise, ExerciseType } from '../../domain/contracts';
import { evaluateCoach, type CoachInput } from '../../domain/coaching';
import {
  EXERCISE_CATALOG,
  findExerciseById,
} from '../../domain/exercises';
import { DEMO_AUDIO_METRICS_FIXTURE } from './demoFixtures';
import {
  acceptSessionAttempt,
  activatePendingSessionExercise,
  BLOCKING_CAPTURE_NOTICE,
  composePracticeSessionState,
  continueBlockingSessionAttempt,
  createInitialPracticeSession,
  deriveSessionCoverage,
  findPendingSessionExerciseType,
  startNewPracticeSession,
  validateSessionHistory,
  type PracticeSessionCoreState,
  type SessionAttemptRecord,
} from './practiceSessionState';
import { createInitialPracticeState } from './practiceAttemptState';

function inputFor(
  state: Extract<PracticeSessionCoreState, { readonly status: 'in_progress' }>,
): CoachInput {
  return {
    attemptId: `practice-attempt-${state.validHistory.length + 1}`,
    currentExercise: state.currentExercise,
    textSource: null,
    audioMetrics: DEMO_AUDIO_METRICS_FIXTURE,
    textMetrics: null,
    currentDifficulty: state.currentExercise.difficulty,
    validAttemptCountBeforeCurrent: state.validHistory.length,
    coveredExerciseTypesBeforeCurrent: deriveSessionCoverage(
      state.validHistory,
    ),
    allowedExercises: EXERCISE_CATALOG,
  };
}

function acceptCurrent(
  state: Extract<PracticeSessionCoreState, { readonly status: 'in_progress' }>,
): PracticeSessionCoreState {
  const coachInput = inputFor(state);
  const coachResult = evaluateCoach(coachInput);
  expect(coachResult.ok).toBe(true);
  if (!coachResult.ok) {
    return state;
  }
  const acceptedAction = coachResult.decision.action;
  expect(acceptedAction).not.toBe('repeat_current');
  if (acceptedAction === 'repeat_current') {
    return state;
  }
  const result = acceptSessionAttempt(state, {
    mode: 'demo',
    coachInput,
    coachDecision: coachResult.decision,
    acceptedAction,
  });
  expect(result.ok).toBe(true);
  return result.ok ? result.state : state;
}

function activate(
  state: Extract<PracticeSessionCoreState, { readonly status: 'selection_preview' }>,
): Extract<PracticeSessionCoreState, { readonly status: 'in_progress' }> {
  const result = activatePendingSessionExercise(state);
  expect(result.ok).toBe(true);
  if (!result.ok || result.state.status !== 'in_progress') {
    throw new Error('No se pudo activar el ejercicio de prueba.');
  }
  return result.state;
}

function buildCompletedSession(): Extract<
  PracticeSessionCoreState,
  { readonly status: 'completed' }
> {
  let state = createInitialPracticeSession();
  while (state.status !== 'completed') {
    if (state.status === 'selection_preview') {
      state = activate(state);
      continue;
    }
    state = acceptCurrent(state);
  }
  return state;
}

function collectKeys(value: unknown, keys: Set<string>): void {
  if (Array.isArray(value)) {
    value.forEach((item) => collectKeys(item, keys));
    return;
  }
  if (value === null || typeof value !== 'object') {
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    keys.add(key.toLowerCase());
    collectKeys(child, keys);
  }
}

describe('m\u00e1quina pura de sesi\u00f3n', () => {
  it('inicia en cero de cinco con palabra, historial y cobertura vac\u00edos', () => {
    const coreState = createInitialPracticeSession();
    expect(coreState).toMatchObject({
      status: 'in_progress',
      validHistory: [],
      currentExercise: { id: 'practice-word-casa', type: 'word_repetition' },
    });
    expect(deriveSessionCoverage(coreState.validHistory)).toEqual([]);
    expect(findPendingSessionExerciseType(coreState.validHistory)).toBe(
      'word_repetition',
    );

    if (coreState.status === 'in_progress') {
      const attempt = createInitialPracticeState(
        'practice-attempt-1',
        1,
      );
      expect(composePracticeSessionState(coreState, attempt)).toMatchObject({
        status: 'in_progress',
        currentAttemptState: attempt,
      });
    }
  });

  it('registra palabra, frase y lectura en las primeras tres posiciones', () => {
    let state = createInitialPracticeSession();
    const types: ExerciseType[] = [];

    for (let position = 1; position <= 3; position += 1) {
      expect(state.status).toBe('in_progress');
      if (state.status !== 'in_progress') {
        break;
      }
      types.push(state.currentExercise.type);
      state = acceptCurrent(state);
      expect(state.status).toBe('selection_preview');
      if (state.status === 'selection_preview') {
        expect(state.validHistory).toHaveLength(position);
        state = activate(state);
      }
    }

    expect(types).toEqual([
      'word_repetition',
      'phrase_repetition',
      'guided_reading',
    ]);
    expect(deriveSessionCoverage(state.validHistory)).toEqual([
      'word_repetition',
      'phrase_repetition',
      'guided_reading',
    ]);
  });

  it('completa exactamente cinco registros y reinicia con una identidad externa nueva', () => {
    const completed = buildCompletedSession();
    expect(completed.validHistory).toHaveLength(5);
    expect(completed.validHistory.map(({ position }) => position)).toEqual([
      1, 2, 3, 4, 5,
    ]);
    expect(completed.validHistory[4]).toMatchObject({
      acceptedAction: 'complete_session',
      coachDecisionSnapshot: { action: 'complete_session' },
    });
    expect(deriveSessionCoverage(completed.validHistory)).toEqual([
      'word_repetition',
      'phrase_repetition',
      'guided_reading',
    ]);

    const restarted = startNewPracticeSession(completed);
    expect(restarted).toMatchObject({
      ok: true,
      state: {
        status: 'in_progress',
        validHistory: [],
        currentExercise: { id: 'practice-word-casa' },
      },
    });
  });

  it('crea copias profundas congeladas sin propiedades de audio temporal', () => {
    const state = createInitialPracticeSession();
    expect(state.status).toBe('in_progress');
    if (state.status !== 'in_progress') {
      return;
    }
    const coachInput = inputFor(state);
    const coachResult = evaluateCoach(coachInput);
    expect(coachResult.ok).toBe(true);
    if (!coachResult.ok || coachResult.decision.action !== 'continue') {
      return;
    }

    const result = acceptSessionAttempt(state, {
      mode: 'demo',
      coachInput,
      coachDecision: coachResult.decision,
      acceptedAction: 'continue',
    });
    expect(result.ok).toBe(true);
    if (!result.ok || result.state.status !== 'selection_preview') {
      return;
    }
    const record = result.state.validHistory[0];
    expect(record).toBeDefined();
    if (record === undefined) {
      return;
    }
    expect(record.coachInputSnapshot).not.toBe(coachInput);
    expect(record.coachInputSnapshot.currentExercise).not.toBe(
      coachInput.currentExercise,
    );
    expect(record.coachInputSnapshot.allowedExercises).not.toBe(
      coachInput.allowedExercises,
    );
    expect(Object.isFrozen(record)).toBe(true);
    expect(Object.isFrozen(record.coachInputSnapshot)).toBe(true);
    expect(Object.isFrozen(record.coachInputSnapshot.audioMetrics)).toBe(true);
    expect(Object.isFrozen(record.coachDecisionSnapshot.evidenceKeys)).toBe(
      true,
    );

    const keys = new Set<string>();
    collectKeys(record, keys);
    for (const forbidden of [
      'blob',
      'recording',
      'audiourl',
      'stream',
      'pcm',
      'mediastream',
      'speechtextresult',
      'interimtext',
    ]) {
      expect(keys.has(forbidden)).toBe(false);
    }
  });

  it('rechaza posiciones, contador, cobertura y finalizaci\u00f3n incoherentes', () => {
    const completed = buildCompletedSession();
    const first = completed.validHistory[0];
    expect(first).toBeDefined();
    if (first === undefined) {
      return;
    }
    const outOfOrder = Object.freeze({
      ...first,
      position: 2,
    }) satisfies SessionAttemptRecord;
    expect(validateSessionHistory([outOfOrder])?.code).toBe(
      'record_out_of_order',
    );

    const invalidCount = Object.freeze({
      ...first,
      coachInputSnapshot: Object.freeze({
        ...first.coachInputSnapshot,
        validAttemptCountBeforeCurrent: 1,
      }),
    }) satisfies SessionAttemptRecord;
    expect(validateSessionHistory([invalidCount])?.code).toBe(
      'incoherent_history',
    );

    const initial = createInitialPracticeSession();
    expect(initial.status).toBe('in_progress');
    if (initial.status !== 'in_progress') {
      return;
    }
    const input = inputFor(initial);
    const completeDecision = completed.validHistory[4].coachDecisionSnapshot;
    expect(
      acceptSessionAttempt(initial, {
        mode: 'demo',
        coachInput: input,
        coachDecision: completeDecision,
        acceptedAction: 'complete_session',
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'invalid_completion_history' },
    });
  });

  it('contin\u00faa una bloqueante sin registrar ni cubrir y conserva dificultad actual', () => {
    const state = createInitialPracticeSession();
    expect(state.status).toBe('in_progress');
    if (state.status !== 'in_progress') {
      return;
    }
    const blockingDecision = {
      ...buildCompletedSession().validHistory[4].coachDecisionSnapshot,
      ruleId: 'capture_quality_blocking' as const,
      templateId: 'capture-clear-v1' as const,
      focus: 'clear_capture' as const,
      action: 'repeat_current' as const,
      selectedExerciseId: null,
    };
    const result = continueBlockingSessionAttempt(state, blockingDecision);
    expect(result).toMatchObject({
      ok: true,
      state: {
        status: 'selection_preview',
        validHistory: [],
        pendingExercise: {
          id: 'practice-word-casa',
          difficulty: state.currentExercise.difficulty,
        },
        origin: 'continued_blocking_attempt',
      },
    });
    if (result.ok && result.state.status === 'selection_preview') {
      expect(result.state.captureNotice).toContain(BLOCKING_CAPTURE_NOTICE);
      expect(result.state.captureNotice).toContain(
        'a\u00fan necesita un intento v\u00e1lido',
      );
    }
  });

  it('rechaza una preview cuyo candidato no pertenece al cat\u00e1logo', () => {
    const fakeExercise: Exercise = {
      ...EXERCISE_CATALOG[0],
      id: 'fuera-del-catalogo',
    };
    const result = activatePendingSessionExercise({
      status: 'selection_preview',
      validHistory: [],
      pendingExercise: fakeExercise,
      origin: 'continued_blocking_attempt',
      captureNotice: BLOCKING_CAPTURE_NOTICE,
    });
    expect(result).toMatchObject({
      ok: false,
      error: { code: 'selected_exercise_not_found' },
    });
    expect(findExerciseById(fakeExercise.id)).toBeUndefined();
  });
});

import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  evaluateCoach,
  type CoachInput,
  type CoachResult,
} from '../../domain/coaching';
import {
  usePracticeSession,
  type PracticeSessionController,
} from './usePracticeSession';

async function analyzeDemo(
  result: { readonly current: PracticeSessionController },
): Promise<void> {
  act(() => result.current.attempt.chooseMode('demo'));
  act(() => result.current.attempt.startAttempt());
  await act(async () => result.current.attempt.analyzeAttempt());
  expect(result.current.attempt.state.status).toBe('decision_ready');
}

async function acceptAndActivate(
  result: { readonly current: PracticeSessionController },
): Promise<void> {
  await analyzeDemo(result);
  act(() => {
    result.current.acceptCurrentAttempt();
    result.current.acceptCurrentAttempt();
  });
  expect(result.current.state.status).toBe('selection_preview');
  act(() => {
    result.current.activatePendingExercise();
    result.current.activatePendingExercise();
  });
  expect(result.current.state.status).toBe('in_progress');
  expect(result.current.attempt.state.status).toBe('instruction');
}

const BLOCKING_RESULT: CoachResult = {
  ok: true,
  decision: {
    rulesVersion: 'coach-rules-v1',
    ruleId: 'capture_quality_blocking',
    templateId: 'capture-clear-v1',
    shortFeedback: 'Prueba otra captura cuando est\u00e9s listo.',
    focus: 'clear_capture',
    action: 'repeat_current',
    explanation: 'La captura necesita repetirse.',
    evidenceKeys: ['qualityFlags', 'silenceRatio'],
    selectedExerciseId: null,
  },
};

describe('controlador de sesi\u00f3n', () => {
  it('analizar no registra y continuar registra una sola vez', async () => {
    const { result } = renderHook(() => usePracticeSession());

    await analyzeDemo(result);
    expect(result.current.state.validHistory).toHaveLength(0);
    act(() => {
      result.current.acceptCurrentAttempt();
      result.current.acceptCurrentAttempt();
    });

    expect(result.current.state).toMatchObject({
      status: 'selection_preview',
      validHistory: [{ position: 1, acceptedAction: 'continue' }],
      pendingExercise: { id: 'practice-phrase-calm' },
      origin: 'accepted_valid_attempt',
    });
    expect(result.current.attempt.recordedAudio).toBeNull();
    expect(result.current.attempt.recognitionState.status).toBe('idle');
  });

  it('activa palabra, frase y lectura sin captura o coaching autom\u00e1ticos', async () => {
    const coachEvaluator = vi.fn(evaluateCoach);
    const { result } = renderHook(() =>
      usePracticeSession({ evaluateCoach: coachEvaluator }),
    );

    expect(result.current.state).toMatchObject({
      status: 'in_progress',
      currentExercise: { id: 'practice-word-casa' },
    });
    await acceptAndActivate(result);
    expect(result.current.state).toMatchObject({
      currentExercise: { id: 'practice-phrase-calm' },
      validHistory: [{ position: 1 }],
    });
    expect(coachEvaluator).toHaveBeenCalledTimes(1);

    await acceptAndActivate(result);
    expect(result.current.state).toMatchObject({
      currentExercise: { id: 'practice-guided-calm' },
      validHistory: [{ position: 1 }, { position: 2 }],
    });
    expect(coachEvaluator).toHaveBeenCalledTimes(2);
  });

  it('construye cada CoachInput desde el ejercicio y el historial vigentes', async () => {
    const inputs: CoachInput[] = [];
    const coachEvaluator = vi.fn((input: unknown) => {
      inputs.push(input as CoachInput);
      return evaluateCoach(input);
    });
    const { result } = renderHook(() =>
      usePracticeSession({ evaluateCoach: coachEvaluator }),
    );

    await acceptAndActivate(result);
    await acceptAndActivate(result);
    await analyzeDemo(result);

    expect(inputs.map((input) => input.currentExercise.id)).toEqual([
      'practice-word-casa',
      'practice-phrase-calm',
      'practice-guided-calm',
    ]);
    expect(inputs.map((input) => input.validAttemptCountBeforeCurrent)).toEqual([
      0, 1, 2,
    ]);
    expect(inputs.map((input) => input.coveredExerciseTypesBeforeCurrent)).toEqual([
      [],
      ['word_repetition'],
      ['word_repetition', 'phrase_repetition'],
    ]);
    expect(inputs.map((input) => input.textMetrics?.targetText)).toEqual([
      'casa',
      'Camino con calma.',
      'La ma\u00f1ana est\u00e1 tranquila, camino con calma.',
    ]);
  });

  it('repite una bloqueante con nuevo ID sin registrar o cambiar ejercicio', async () => {
    const { result } = renderHook(() =>
      usePracticeSession({ evaluateCoach: () => BLOCKING_RESULT }),
    );

    await analyzeDemo(result);
    const previousAttemptId = result.current.attempt.state.attemptId;
    act(() => result.current.repeatCurrentAttempt());

    expect(result.current.state).toMatchObject({
      status: 'in_progress',
      validHistory: [],
      currentExercise: { id: 'practice-word-casa' },
      currentAttemptState: { status: 'instruction' },
    });
    expect(result.current.attempt.state.attemptId).not.toBe(previousAttemptId);
    expect(result.current.attempt.recordedAudio).toBeNull();
  });

  it('contin\u00faa una bloqueante sin registrar y exige todav\u00eda el tipo pendiente', async () => {
    const { result } = renderHook(() =>
      usePracticeSession({ evaluateCoach: () => BLOCKING_RESULT }),
    );

    await analyzeDemo(result);
    act(() => result.current.continueBlockingAttempt());

    expect(result.current.state).toMatchObject({
      status: 'selection_preview',
      validHistory: [],
      pendingExercise: { id: 'practice-word-casa', difficulty: 1 },
      origin: 'continued_blocking_attempt',
    });
    if (result.current.state.status === 'selection_preview') {
      expect(result.current.state.captureNotice).toContain(
        'Esta captura no contar\u00e1 como intento v\u00e1lido.',
      );
      expect(result.current.state.captureNotice).toContain(
        'a\u00fan necesita un intento v\u00e1lido de este tipo',
      );
    }
  });

  it('usa historial real en el cuarto intento y no impone otra secuencia', async () => {
    let blocking = false;
    const inputs: CoachInput[] = [];
    const evaluator = vi.fn((input: unknown) => {
      inputs.push(input as CoachInput);
      return blocking ? BLOCKING_RESULT : evaluateCoach(input);
    });
    const { result } = renderHook(() =>
      usePracticeSession({ evaluateCoach: evaluator }),
    );

    await acceptAndActivate(result);
    await acceptAndActivate(result);
    await acceptAndActivate(result);
    expect(result.current.state.validHistory).toHaveLength(3);
    blocking = true;
    await analyzeDemo(result);

    const fourthInput = inputs.at(-1);
    expect(fourthInput).toMatchObject({
      validAttemptCountBeforeCurrent: 3,
      coveredExerciseTypesBeforeCurrent: [
        'word_repetition',
        'phrase_repetition',
        'guided_reading',
      ],
      currentExercise: { id: 'practice-guided-calm', difficulty: 3 },
    });
    act(() => result.current.continueBlockingAttempt());
    expect(result.current.state).toMatchObject({
      status: 'selection_preview',
      validHistory: [{}, {}, {}],
      pendingExercise: { id: 'practice-guided-calm', difficulty: 3 },
    });
    if (result.current.state.status === 'selection_preview') {
      expect(result.current.state.captureNotice).toBe(
        'Esta captura no contar\u00e1 como intento v\u00e1lido.',
      );
    }
  });

  it('finaliza s\u00f3lo al aceptar el quinto y comienza una sesi\u00f3n limpia', async () => {
    const stopSpeech = vi.fn();
    const { result } = renderHook(() => usePracticeSession({ stopSpeech }));

    await acceptAndActivate(result);
    await acceptAndActivate(result);
    await acceptAndActivate(result);
    await acceptAndActivate(result);
    expect(result.current.state.validHistory).toHaveLength(4);
    const fourthAttemptId = result.current.attempt.state.attemptId;

    await analyzeDemo(result);
    expect(result.current.state.validHistory).toHaveLength(4);
    expect(result.current.attempt.state).toMatchObject({
      status: 'decision_ready',
      coachResult: { decision: { action: 'complete_session' } },
    });
    act(() => {
      result.current.finishSession();
      result.current.finishSession();
    });

    expect(result.current.state).toMatchObject({
      status: 'completed',
      validHistory: [
        { position: 1, acceptedAction: 'continue' },
        { position: 2, acceptedAction: 'continue' },
        { position: 3, acceptedAction: 'continue' },
        { position: 4, acceptedAction: 'continue' },
        { position: 5, acceptedAction: 'complete_session' },
      ],
    });
    expect(result.current.attempt.recordedAudio).toBeNull();

    act(() => result.current.startNewSession());
    expect(result.current.state).toMatchObject({
      status: 'in_progress',
      validHistory: [],
      currentExercise: { id: 'practice-word-casa' },
      currentAttemptState: { status: 'instruction' },
    });
    expect(result.current.attempt.state.attemptId).not.toBe(fourthAttemptId);
    expect(stopSpeech.mock.calls.length).toBeGreaterThanOrEqual(10);
  });

  it('una quinta captura bloqueante conserva cuatro v\u00e1lidos incluso al continuar', async () => {
    let block = false;
    const { result } = renderHook(() =>
      usePracticeSession({
        evaluateCoach: (input) => (block ? BLOCKING_RESULT : evaluateCoach(input)),
      }),
    );

    await acceptAndActivate(result);
    await acceptAndActivate(result);
    await acceptAndActivate(result);
    await acceptAndActivate(result);
    block = true;
    await analyzeDemo(result);

    expect(result.current.state.validHistory).toHaveLength(4);
    expect(result.current.attempt.state).toMatchObject({
      status: 'decision_ready',
      coachResult: { decision: { action: 'repeat_current' } },
    });
    act(() => result.current.continueBlockingAttempt());
    expect(result.current.state).toMatchObject({
      status: 'selection_preview',
      validHistory: [{}, {}, {}, {}],
      origin: 'continued_blocking_attempt',
    });
  });
});

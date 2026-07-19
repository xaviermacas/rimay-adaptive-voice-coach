import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type {
  ActiveRecognition,
  SpeechRecognizer,
} from '../../domain/contracts';
import {
  evaluateCoach,
  type CoachResult,
} from '../../domain/coaching';
import {
  PRACTICE_PHRASE_PREVIEW,
} from './practiceFixture';
import {
  usePracticeAttempt,
  type PracticeAttemptController,
} from './usePracticeAttempt';

class BrowserRecognizerProbe implements SpeechRecognizer {
  readonly source = 'browser' as const;
  startCount = 0;

  isSupported(): boolean {
    return true;
  }

  start(): ActiveRecognition {
    this.startCount += 1;
    return {
      stop: vi.fn(),
      abort: vi.fn(),
      dispose: vi.fn(),
    };
  }
}

function startDemo(
  result: { readonly current: PracticeAttemptController },
): void {
  act(() => result.current.chooseMode('demo'));
  act(() => result.current.startAttempt());
  expect(result.current.state.status).toBe('ready_to_analyze');
}

const COMPLETE_RESULT: CoachResult = {
  ok: true,
  decision: {
    rulesVersion: 'coach-rules-v1',
    ruleId: 'complete_fifth_valid_attempt',
    templateId: 'session-complete-v1',
    shortFeedback: 'Intento registrado.',
    focus: 'complete',
    action: 'complete_session',
    explanation: 'Resultado de prueba.',
    evidenceKeys: ['qualityFlags'],
    selectedExerciseId: null,
  },
};

const MISSING_SELECTION_RESULT: CoachResult = {
  ok: true,
  decision: {
    rulesVersion: 'coach-rules-v1',
    ruleId: 'continue_default',
    templateId: 'continue-text-demo-v1',
    shortFeedback: 'Continua.',
    focus: 'continue',
    action: 'continue',
    explanation: 'Resultado de prueba.',
    evidenceKeys: ['textSimilarity'],
    selectedExerciseId: 'exercise-not-in-catalog',
  },
};

describe('controlador de un intento', () => {
  it('ejecuta demo sin captura, reconocimiento ni analisis de audio', async () => {
    const recognizer = new BrowserRecognizerProbe();
    const analyzeAudio = vi.fn();
    const coachEvaluator = vi.fn(evaluateCoach);
    const { result } = renderHook(() =>
      usePracticeAttempt({
        analyzeAudio,
        browserRecognizer: recognizer,
        evaluateCoach: coachEvaluator,
      }),
    );

    startDemo(result);
    await act(async () => {
      const first = result.current.analyzeAttempt();
      const second = result.current.analyzeAttempt();
      await Promise.all([first, second]);
    });

    expect(analyzeAudio).not.toHaveBeenCalled();
    expect(recognizer.startCount).toBe(0);
    expect(coachEvaluator).toHaveBeenCalledOnce();
    expect(result.current.state).toMatchObject({
      status: 'decision_ready',
      mode: 'demo',
      coachInput: {
        attemptId: 'practice-attempt-1',
        textSource: 'demo',
        validAttemptCountBeforeCurrent: 0,
        coveredExerciseTypesBeforeCurrent: [],
        textMetrics: {
          wordsPerMinute: null,
          wordsPerMinuteUnavailableReason: 'demo_source',
        },
      },
      coachResult: {
        ok: true,
        decision: {
          action: 'continue',
          selectedExerciseId: PRACTICE_PHRASE_PREVIEW.id,
          templateId: 'continue-text-demo-v1',
        },
      },
    });
  });

  it('genera IDs monotonicos al descartar o repetir recursos', () => {
    const { result } = renderHook(() => usePracticeAttempt());

    expect(result.current.state.attemptId).toBe('practice-attempt-1');
    act(() => result.current.discardAttempt());
    expect(result.current.state.attemptId).toBe('practice-attempt-2');
    act(() => result.current.discardAttempt());
    expect(result.current.state.attemptId).toBe('practice-attempt-3');
    expect(result.current.state.generation).toBe(3);
  });

  it('trata complete_session como error recuperable en este incremento', async () => {
    const { result } = renderHook(() =>
      usePracticeAttempt({ evaluateCoach: () => COMPLETE_RESULT }),
    );
    startDemo(result);

    await act(async () => result.current.analyzeAttempt());

    expect(result.current.state).toMatchObject({
      status: 'recoverable_error',
      error: {
        kind: 'application',
        code: 'unexpected_coach_action',
      },
      coachResult: COMPLETE_RESULT,
    });
  });

  it('valida el ejercicio elegido al continuar', async () => {
    const { result } = renderHook(() =>
      usePracticeAttempt({ evaluateCoach: () => MISSING_SELECTION_RESULT }),
    );
    startDemo(result);
    await act(async () => result.current.analyzeAttempt());

    act(() => result.current.continueToPreview());

    expect(result.current.state).toMatchObject({
      status: 'recoverable_error',
      error: {
        kind: 'application',
        code: 'selected_exercise_not_found',
      },
    });
  });

  it('limpia recursos y muestra solo la vista previa al continuar', async () => {
    const { result } = renderHook(() => usePracticeAttempt());
    startDemo(result);
    await act(async () => result.current.analyzeAttempt());

    act(() => result.current.continueToPreview());

    expect(result.current.state).toMatchObject({
      status: 'selection_preview',
      selectedExercise: { id: PRACTICE_PHRASE_PREVIEW.id },
      generation: 2,
    });
    expect(result.current.recordedAudio).toBeNull();
    expect(result.current.recognitionState.status).toBe('idle');
  });
});

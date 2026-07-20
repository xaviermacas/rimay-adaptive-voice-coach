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
  EXERCISE_CATALOG,
} from '../../domain/exercises';
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
          selectedExerciseId: EXERCISE_CATALOG[1].id,
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

  it('conserva complete_session como decisi\u00f3n lista para la sesi\u00f3n', async () => {
    const { result } = renderHook(() =>
      usePracticeAttempt({ evaluateCoach: () => COMPLETE_RESULT }),
    );
    startDemo(result);

    await act(async () => result.current.analyzeAttempt());

    expect(result.current.state).toMatchObject({
      status: 'decision_ready',
      coachResult: COMPLETE_RESULT,
    });
  });
});

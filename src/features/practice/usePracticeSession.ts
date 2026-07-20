import { useCallback, useMemo, useRef, useState } from 'react';

import { INITIAL_EXERCISE } from '../../domain/exercises';
import type {
  PracticeAttemptController,
  UsePracticeAttemptOptions,
} from './usePracticeAttempt';
import { usePracticeAttempt } from './usePracticeAttempt';
import {
  acceptSessionAttempt,
  activatePendingSessionExercise,
  composePracticeSessionState,
  continueBlockingSessionAttempt,
  createInitialPracticeSession,
  startNewPracticeSession,
  type PracticeSessionCoreState,
  type PracticeSessionError,
  type PracticeSessionState,
} from './practiceSessionState';

export type UsePracticeSessionOptions = Omit<
  UsePracticeAttemptOptions,
  'currentExercise' | 'validHistory'
>;

export interface PracticeSessionController {
  readonly acceptCurrentAttempt: () => void;
  readonly activatePendingExercise: () => void;
  readonly attempt: PracticeAttemptController;
  readonly clearSessionError: () => void;
  readonly continueBlockingAttempt: () => void;
  readonly finishSession: () => void;
  readonly repeatCurrentAttempt: () => void;
  readonly restartCurrentAttempt: () => void;
  readonly sessionError: PracticeSessionError | null;
  readonly startNewSession: () => void;
  readonly state: PracticeSessionState;
}

const DO_NOTHING = () => undefined;

export function usePracticeSession(
  options: UsePracticeSessionOptions = {},
): PracticeSessionController {
  const [coreState, setCoreState] = useState<PracticeSessionCoreState>(
    createInitialPracticeSession,
  );
  const [sessionError, setSessionError] =
    useState<PracticeSessionError | null>(null);
  const coreStateRef = useRef(coreState);
  const acceptanceGuardRef = useRef(false);
  const transitionGuardRef = useRef(false);
  const stopSpeech = options.stopSpeech ?? DO_NOTHING;
  const currentExercise =
    coreState.status === 'in_progress'
      ? coreState.currentExercise
      : coreState.status === 'selection_preview'
        ? coreState.pendingExercise
        : INITIAL_EXERCISE;
  const attempt = usePracticeAttempt({
    ...options,
    currentExercise,
    validHistory: coreState.validHistory,
  });

  const commitCoreState = useCallback((nextState: PracticeSessionCoreState) => {
    coreStateRef.current = nextState;
    setCoreState(nextState);
    setSessionError(null);
  }, []);

  const reportTransitionError = useCallback((error: PracticeSessionError) => {
    setSessionError(error);
  }, []);

  const accept = useCallback(
    (acceptedAction: 'continue' | 'complete_session') => {
      if (acceptanceGuardRef.current) {
        return;
      }
      const session = coreStateRef.current;
      const attemptState = attempt.state;
      if (
        session.status !== 'in_progress' ||
        attemptState.status !== 'decision_ready' ||
        attemptState.coachResult.decision.action !== acceptedAction
      ) {
        reportTransitionError({
          code: 'invalid_session_state',
          message: 'La decisi\u00f3n vigente no permite esta acci\u00f3n.',
        });
        return;
      }

      acceptanceGuardRef.current = true;
      const result = acceptSessionAttempt(session, {
        mode: attemptState.mode,
        coachInput: attemptState.coachInput,
        coachDecision: attemptState.coachResult.decision,
        acceptedAction,
      });
      if (!result.ok) {
        acceptanceGuardRef.current = false;
        reportTransitionError(result.error);
        return;
      }

      stopSpeech();
      attempt.clearAttemptForSessionTransition();
      commitCoreState(result.state);
    },
    [attempt, commitCoreState, reportTransitionError, stopSpeech],
  );

  const acceptCurrentAttempt = useCallback(() => {
    accept('continue');
  }, [accept]);

  const finishSession = useCallback(() => {
    accept('complete_session');
  }, [accept]);

  const continueBlockingAttempt = useCallback(() => {
    if (transitionGuardRef.current) {
      return;
    }
    const session = coreStateRef.current;
    const attemptState = attempt.state;
    if (
      session.status !== 'in_progress' ||
      attemptState.status !== 'decision_ready'
    ) {
      reportTransitionError({
        code: 'invalid_session_state',
        message: 'No existe una captura bloqueante vigente para continuar.',
      });
      return;
    }

    transitionGuardRef.current = true;
    const result = continueBlockingSessionAttempt(
      session,
      attemptState.coachResult.decision,
    );
    if (!result.ok) {
      transitionGuardRef.current = false;
      reportTransitionError(result.error);
      return;
    }

    stopSpeech();
    attempt.clearAttemptForSessionTransition();
    transitionGuardRef.current = false;
    commitCoreState(result.state);
  }, [attempt, commitCoreState, reportTransitionError, stopSpeech]);

  const activatePendingExercise = useCallback(() => {
    if (
      transitionGuardRef.current ||
      coreStateRef.current.status !== 'selection_preview'
    ) {
      return;
    }
    transitionGuardRef.current = true;
    const result = activatePendingSessionExercise(coreStateRef.current);
    if (!result.ok) {
      transitionGuardRef.current = false;
      reportTransitionError(result.error);
      return;
    }

    stopSpeech();
    attempt.startNewAttempt();
    acceptanceGuardRef.current = false;
    transitionGuardRef.current = false;
    commitCoreState(result.state);
  }, [attempt, commitCoreState, reportTransitionError, stopSpeech]);

  const repeatCurrentAttempt = useCallback(() => {
    acceptanceGuardRef.current = false;
    transitionGuardRef.current = false;
    setSessionError(null);
    attempt.repeatAttempt();
  }, [attempt]);

  const restartCurrentAttempt = useCallback(() => {
    acceptanceGuardRef.current = false;
    transitionGuardRef.current = false;
    setSessionError(null);
    attempt.discardAttempt();
  }, [attempt]);

  const startNewSession = useCallback(() => {
    if (transitionGuardRef.current) {
      return;
    }
    transitionGuardRef.current = true;
    const result = startNewPracticeSession(coreStateRef.current);
    if (!result.ok) {
      transitionGuardRef.current = false;
      reportTransitionError(result.error);
      return;
    }

    stopSpeech();
    attempt.startNewAttempt();
    acceptanceGuardRef.current = false;
    transitionGuardRef.current = false;
    commitCoreState(result.state);
  }, [attempt, commitCoreState, reportTransitionError, stopSpeech]);

  const clearSessionError = useCallback(() => setSessionError(null), []);
  const state = useMemo(
    () => composePracticeSessionState(coreState, attempt.state),
    [attempt.state, coreState],
  );

  return {
    acceptCurrentAttempt,
    activatePendingExercise,
    attempt,
    clearSessionError,
    continueBlockingAttempt,
    finishSession,
    repeatCurrentAttempt,
    restartCurrentAttempt,
    sessionError,
    startNewSession,
    state,
  };
}

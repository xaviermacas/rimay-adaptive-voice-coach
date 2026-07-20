import type { DeterministicMetrics } from '../../domain/audio';
import type {
  Exercise,
  ExerciseType,
  SpeechRecognitionMode,
} from '../../domain/contracts';
import type { CoachDecision, CoachInput } from '../../domain/coaching';
import {
  EXERCISE_CATALOG,
  INITIAL_EXERCISE,
  findExerciseById,
  selectExerciseCandidate,
} from '../../domain/exercises';
import type { TextMetrics } from '../../domain/text';
import type { PracticeAttemptState } from './practiceAttemptState';

export type SessionAttemptPosition = 1 | 2 | 3 | 4 | 5;
export type SessionAcceptedAction = 'continue' | 'complete_session';
export type SelectionPreviewOrigin =
  | 'accepted_valid_attempt'
  | 'continued_blocking_attempt';

export interface SessionAttemptRecord {
  readonly position: SessionAttemptPosition;
  readonly mode: SpeechRecognitionMode;
  readonly coachInputSnapshot: CoachInput;
  readonly coachDecisionSnapshot: CoachDecision;
  readonly acceptedAction: SessionAcceptedAction;
}

export type CompletedSessionHistory = readonly [
  SessionAttemptRecord,
  SessionAttemptRecord,
  SessionAttemptRecord,
  SessionAttemptRecord,
  SessionAttemptRecord,
];

interface InProgressSessionCoreState {
  readonly status: 'in_progress';
  readonly validHistory: readonly SessionAttemptRecord[];
  readonly currentExercise: Exercise;
}

export interface InProgressSessionState extends InProgressSessionCoreState {
  readonly currentAttemptState: PracticeAttemptState;
}

export interface SelectionPreviewSessionState {
  readonly status: 'selection_preview';
  readonly validHistory: readonly SessionAttemptRecord[];
  readonly pendingExercise: Exercise;
  readonly origin: SelectionPreviewOrigin;
  readonly captureNotice: string | null;
}

export interface CompletedSessionState {
  readonly status: 'completed';
  readonly validHistory: CompletedSessionHistory;
}

export type PracticeSessionState =
  | InProgressSessionState
  | SelectionPreviewSessionState
  | CompletedSessionState;

export type PracticeSessionCoreState =
  | InProgressSessionCoreState
  | SelectionPreviewSessionState
  | CompletedSessionState;

export type PracticeSessionErrorCode =
  | 'duplicate_acceptance'
  | 'record_out_of_order'
  | 'history_overflow'
  | 'preview_without_candidate'
  | 'invalid_completion_history'
  | 'selected_exercise_not_found'
  | 'stale_attempt'
  | 'incoherent_history'
  | 'invalid_session_state';

export interface PracticeSessionError {
  readonly code: PracticeSessionErrorCode;
  readonly message: string;
}

export type PracticeSessionTransitionResult =
  | { readonly ok: true; readonly state: PracticeSessionCoreState }
  | { readonly ok: false; readonly error: PracticeSessionError };

export interface AcceptSessionAttemptInput {
  readonly mode: SpeechRecognitionMode;
  readonly coachInput: CoachInput;
  readonly coachDecision: CoachDecision;
  readonly acceptedAction: SessionAcceptedAction;
}

const REQUIRED_EXERCISE_TYPES = Object.freeze([
  'word_repetition',
  'phrase_repetition',
  'guided_reading',
] as const satisfies readonly ExerciseType[]);

const SESSION_POSITIONS = Object.freeze([
  1,
  2,
  3,
  4,
  5,
] as const satisfies readonly SessionAttemptPosition[]);

export const BLOCKING_CAPTURE_NOTICE =
  'Esta captura no contar\u00e1 como intento v\u00e1lido.';
export const REQUIRED_COVERAGE_NOTICE =
  'La sesi\u00f3n a\u00fan necesita un intento v\u00e1lido de este tipo.';

function sessionError(
  code: PracticeSessionErrorCode,
  message: string,
): PracticeSessionTransitionResult {
  return { ok: false, error: { code, message } };
}

function cloneExercise(exercise: Exercise): Exercise {
  return Object.freeze({
    ...exercise,
    pauseCues: Object.freeze([...exercise.pauseCues]),
  });
}

function cloneAudioMetrics(metrics: DeterministicMetrics): DeterministicMetrics {
  return Object.freeze({
    ...metrics,
    qualityFlags: Object.freeze([...metrics.qualityFlags]),
    analysisWarnings: Object.freeze([...metrics.analysisWarnings]),
  });
}

function cloneTextMetrics(metrics: TextMetrics): TextMetrics {
  return Object.freeze({
    ...metrics,
    matchedWords: Object.freeze(
      metrics.matchedWords.map((item) => Object.freeze({ ...item })),
    ),
    omittedWords: Object.freeze(
      metrics.omittedWords.map((item) => Object.freeze({ ...item })),
    ),
    additionalWords: Object.freeze(
      metrics.additionalWords.map((item) => Object.freeze({ ...item })),
    ),
    substitutedWords: Object.freeze(
      metrics.substitutedWords.map((item) => Object.freeze({ ...item })),
    ),
    warnings: Object.freeze([...metrics.warnings]),
  });
}

function cloneCoachInput(input: CoachInput): CoachInput {
  return Object.freeze({
    ...input,
    currentExercise: cloneExercise(input.currentExercise),
    audioMetrics: cloneAudioMetrics(input.audioMetrics),
    textMetrics:
      input.textMetrics === null ? null : cloneTextMetrics(input.textMetrics),
    coveredExerciseTypesBeforeCurrent: Object.freeze([
      ...input.coveredExerciseTypesBeforeCurrent,
    ]),
    allowedExercises: Object.freeze(
      input.allowedExercises.map((exercise) => cloneExercise(exercise)),
    ),
  });
}

function cloneCoachDecision(decision: CoachDecision): CoachDecision {
  return Object.freeze({
    ...decision,
    evidenceKeys: Object.freeze([...decision.evidenceKeys]),
  });
}

function sameExerciseTypes(
  left: readonly ExerciseType[],
  right: readonly ExerciseType[],
): boolean {
  return (
    left.length === right.length &&
    left.every((type, index) => type === right[index])
  );
}

export function deriveSessionCoverage(
  history: readonly SessionAttemptRecord[],
): readonly ExerciseType[] {
  return Object.freeze(
    REQUIRED_EXERCISE_TYPES.filter((type) =>
      history.some(
        (record) => record.coachInputSnapshot.currentExercise.type === type,
      ),
    ),
  );
}

export function findPendingSessionExerciseType(
  history: readonly SessionAttemptRecord[],
): ExerciseType | null {
  const coverage = deriveSessionCoverage(history);
  return REQUIRED_EXERCISE_TYPES.find((type) => !coverage.includes(type)) ?? null;
}

export function validateSessionHistory(
  history: readonly SessionAttemptRecord[],
): PracticeSessionError | null {
  if (history.length > SESSION_POSITIONS.length) {
    return {
      code: 'history_overflow',
      message: 'El historial no puede contener m\u00e1s de cinco intentos v\u00e1lidos.',
    };
  }

  for (const [index, record] of history.entries()) {
    const expectedPosition = SESSION_POSITIONS[index];
    if (expectedPosition === undefined || record.position !== expectedPosition) {
      return {
        code: 'record_out_of_order',
        message: 'Las posiciones del historial deben ser consecutivas de uno a cinco.',
      };
    }

    const previousHistory = history.slice(0, index);
    if (
      record.coachInputSnapshot.validAttemptCountBeforeCurrent !== index ||
      !sameExerciseTypes(
        record.coachInputSnapshot.coveredExerciseTypesBeforeCurrent,
        deriveSessionCoverage(previousHistory),
      )
    ) {
      return {
        code: 'incoherent_history',
        message: 'El contador o la cobertura del snapshot no coincide con el historial.',
      };
    }

    const requiredType = REQUIRED_EXERCISE_TYPES[index];
    if (
      requiredType !== undefined &&
      record.coachInputSnapshot.currentExercise.type !== requiredType
    ) {
      return {
        code: 'incoherent_history',
        message: 'Los tres primeros intentos deben cubrir los tipos en orden can\u00f3nico.',
      };
    }

    const isFifth = index === 4;
    if (
      record.acceptedAction !== (isFifth ? 'complete_session' : 'continue') ||
      record.coachDecisionSnapshot.action !== record.acceptedAction
    ) {
      return {
        code: 'incoherent_history',
        message: 'La acci\u00f3n aceptada no coincide con la posici\u00f3n o la decisi\u00f3n.',
      };
    }
  }

  return null;
}

export function createInitialPracticeSession(): PracticeSessionCoreState {
  return Object.freeze({
    status: 'in_progress',
    validHistory: Object.freeze([]),
    currentExercise: INITIAL_EXERCISE,
  });
}

export function composePracticeSessionState(
  coreState: PracticeSessionCoreState,
  attemptState: PracticeAttemptState,
): PracticeSessionState {
  return coreState.status === 'in_progress'
    ? { ...coreState, currentAttemptState: attemptState }
    : coreState;
}

function createAttemptRecord(
  history: readonly SessionAttemptRecord[],
  input: AcceptSessionAttemptInput,
): SessionAttemptRecord | null {
  const position = SESSION_POSITIONS[history.length];
  if (position === undefined) {
    return null;
  }

  return Object.freeze({
    position,
    mode: input.mode,
    coachInputSnapshot: cloneCoachInput(input.coachInput),
    coachDecisionSnapshot: cloneCoachDecision(input.coachDecision),
    acceptedAction: input.acceptedAction,
  });
}

function asCompletedHistory(
  history: readonly SessionAttemptRecord[],
): CompletedSessionHistory | null {
  if (history.length !== 5) {
    return null;
  }
  return Object.freeze([...history]) as CompletedSessionHistory;
}

export function acceptSessionAttempt(
  state: PracticeSessionCoreState,
  input: AcceptSessionAttemptInput,
): PracticeSessionTransitionResult {
  if (state.status !== 'in_progress') {
    return sessionError(
      'duplicate_acceptance',
      'El intento ya no est\u00e1 disponible para aceptarse.',
    );
  }

  const historyError = validateSessionHistory(state.validHistory);
  if (historyError !== null) {
    return { ok: false, error: historyError };
  }
  if (state.validHistory.length >= 5) {
    return sessionError(
      'history_overflow',
      'La sesi\u00f3n ya contiene cinco intentos v\u00e1lidos.',
    );
  }
  if (
    input.coachInput.currentExercise.id !== state.currentExercise.id ||
    input.coachInput.currentDifficulty !== state.currentExercise.difficulty
  ) {
    return sessionError(
      'stale_attempt',
      'La decisi\u00f3n corresponde a un ejercicio anterior.',
    );
  }
  if (
    input.coachInput.validAttemptCountBeforeCurrent !==
      state.validHistory.length ||
    !sameExerciseTypes(
      input.coachInput.coveredExerciseTypesBeforeCurrent,
      deriveSessionCoverage(state.validHistory),
    )
  ) {
    return sessionError(
      'record_out_of_order',
      'El snapshot no corresponde a la siguiente posici\u00f3n del historial.',
    );
  }
  if (
    input.coachDecision.action !== input.acceptedAction ||
    (input.acceptedAction === 'continue' &&
      input.coachDecision.selectedExerciseId === null) ||
    (input.acceptedAction === 'complete_session' &&
      input.coachDecision.selectedExerciseId !== null)
  ) {
    return sessionError(
      'invalid_session_state',
      'La acci\u00f3n solicitada no coincide con la decisi\u00f3n vigente.',
    );
  }
  if (
    (input.acceptedAction === 'complete_session' &&
      state.validHistory.length !== 4) ||
    (input.acceptedAction === 'continue' && state.validHistory.length === 4)
  ) {
    return sessionError(
      'invalid_completion_history',
      'La finalizaci\u00f3n requiere exactamente cuatro intentos v\u00e1lidos previos.',
    );
  }

  const record = createAttemptRecord(state.validHistory, input);
  if (record === null) {
    return sessionError(
      'history_overflow',
      'No existe una posici\u00f3n v\u00e1lida disponible.',
    );
  }
  const nextHistory = Object.freeze([...state.validHistory, record]);
  const nextHistoryError = validateSessionHistory(nextHistory);
  if (nextHistoryError !== null) {
    return { ok: false, error: nextHistoryError };
  }

  if (input.acceptedAction === 'complete_session') {
    const completedHistory = asCompletedHistory(nextHistory);
    if (completedHistory === null) {
      return sessionError(
        'invalid_completion_history',
        'La sesi\u00f3n s\u00f3lo puede finalizar con cinco intentos v\u00e1lidos.',
      );
    }
    return {
      ok: true,
      state: Object.freeze({
        status: 'completed',
        validHistory: completedHistory,
      }),
    };
  }

  if (nextHistory.length >= 5) {
    return sessionError(
      'invalid_completion_history',
      'El quinto intento debe aceptarse mediante Finalizar sesi\u00f3n.',
    );
  }

  const selectedExerciseId = input.coachDecision.selectedExerciseId;
  const pendingExercise =
    selectedExerciseId === null ? undefined : findExerciseById(selectedExerciseId);
  if (pendingExercise === undefined) {
    return sessionError(
      'selected_exercise_not_found',
      'El ejercicio seleccionado no pertenece al cat\u00e1logo permitido.',
    );
  }

  return {
    ok: true,
    state: Object.freeze({
      status: 'selection_preview',
      validHistory: nextHistory,
      pendingExercise,
      origin: 'accepted_valid_attempt',
      captureNotice: null,
    }),
  };
}

export function continueBlockingSessionAttempt(
  state: PracticeSessionCoreState,
  decision: CoachDecision,
): PracticeSessionTransitionResult {
  if (state.status !== 'in_progress' || decision.action !== 'repeat_current') {
    return sessionError(
      'invalid_session_state',
      'S\u00f3lo una captura bloqueante vigente puede continuarse sin registrar.',
    );
  }

  const pendingRequiredExerciseType = findPendingSessionExerciseType(
    state.validHistory,
  );
  const pendingExercise = selectExerciseCandidate({
    allowedExercises: EXERCISE_CATALOG,
    currentExerciseId: state.currentExercise.id,
    targetDifficulty: state.currentExercise.difficulty,
    pendingRequiredExerciseType,
  });
  if (pendingExercise === null) {
    return sessionError(
      'preview_without_candidate',
      'No existe un ejercicio permitido para preparar la vista previa.',
    );
  }

  return {
    ok: true,
    state: Object.freeze({
      status: 'selection_preview',
      validHistory: state.validHistory,
      pendingExercise,
      origin: 'continued_blocking_attempt',
      captureNotice:
        pendingRequiredExerciseType === null
          ? BLOCKING_CAPTURE_NOTICE
          : `${BLOCKING_CAPTURE_NOTICE} ${REQUIRED_COVERAGE_NOTICE}`,
    }),
  };
}

export function activatePendingSessionExercise(
  state: PracticeSessionCoreState,
): PracticeSessionTransitionResult {
  if (state.status !== 'selection_preview') {
    return sessionError(
      'invalid_session_state',
      'No existe una vista previa activa.',
    );
  }
  const pendingExercise = findExerciseById(state.pendingExercise.id);
  if (pendingExercise === undefined) {
    return sessionError(
      'selected_exercise_not_found',
      'El ejercicio pendiente ya no pertenece al cat\u00e1logo.',
    );
  }

  return {
    ok: true,
    state: Object.freeze({
      status: 'in_progress',
      validHistory: state.validHistory,
      currentExercise: pendingExercise,
    }),
  };
}

export function startNewPracticeSession(
  state: PracticeSessionCoreState,
): PracticeSessionTransitionResult {
  if (state.status !== 'completed') {
    return sessionError(
      'invalid_session_state',
      'Una nueva sesi\u00f3n s\u00f3lo puede comenzar desde la vista completada.',
    );
  }
  return { ok: true, state: createInitialPracticeSession() };
}

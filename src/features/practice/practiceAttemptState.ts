import type { Exercise, SpeechTextResult } from '../../domain/contracts';
import type {
  CoachDecision,
  CoachInput,
  CoachResult,
} from '../../domain/coaching';
import type { DeterministicMetrics } from '../../domain/audio';
import type { TextMetrics } from '../../domain/text';
import type { PracticeAttemptError } from './practiceErrors';

export type PracticeMode = 'browser' | 'manual' | 'demo';
export type CoachSuccessResult = Extract<CoachResult, { readonly ok: true }>;

interface PracticeStateBase {
  readonly attemptId: string;
  readonly generation: number;
}

export interface InstructionState extends PracticeStateBase {
  readonly status: 'instruction';
}

export interface PrivacyChoiceState extends PracticeStateBase {
  readonly status: 'privacy_choice';
  readonly mode: PracticeMode;
  readonly consentAccepted: boolean;
}

export interface RequestingPermissionState extends PracticeStateBase {
  readonly status: 'requesting_permission';
  readonly mode: 'browser' | 'manual';
}

export interface RecordingState extends PracticeStateBase {
  readonly status: 'recording';
  readonly mode: 'browser' | 'manual';
}

export interface RecordedState extends PracticeStateBase {
  readonly status: 'recorded';
  readonly mode: 'browser';
}

export interface AwaitingTextState extends PracticeStateBase {
  readonly status: 'awaiting_text';
  readonly mode: 'browser' | 'manual';
  readonly recognitionError: PracticeAttemptError | null;
}

export interface ReadyToAnalyzeState extends PracticeStateBase {
  readonly status: 'ready_to_analyze';
  readonly mode: PracticeMode;
  readonly speechText: SpeechTextResult | null;
}

export interface AnalyzingState extends PracticeStateBase {
  readonly status: 'analyzing';
  readonly mode: PracticeMode;
  readonly speechText: SpeechTextResult | null;
}

export interface DecisionReadyState extends PracticeStateBase {
  readonly status: 'decision_ready';
  readonly mode: PracticeMode;
  readonly coachInput: CoachInput;
  readonly coachResult: CoachSuccessResult;
}

export interface RecoverableErrorState extends PracticeStateBase {
  readonly status: 'recoverable_error';
  readonly mode: PracticeMode | null;
  readonly error: PracticeAttemptError;
  readonly playbackAvailable: boolean;
  readonly speechText: SpeechTextResult | null;
  readonly coachInput: CoachInput | null;
  readonly coachResult: CoachResult | null;
}

export type PracticeAttemptState =
  | InstructionState
  | PrivacyChoiceState
  | RequestingPermissionState
  | RecordingState
  | RecordedState
  | AwaitingTextState
  | ReadyToAnalyzeState
  | AnalyzingState
  | DecisionReadyState
  | RecoverableErrorState;

export type PracticeAttemptEvent =
  | {
      readonly type: 'choose_mode';
      readonly mode: PracticeMode;
    }
  | { readonly type: 'set_consent'; readonly accepted: boolean }
  | { readonly type: 'request_capture' }
  | { readonly type: 'recording_started' }
  | {
      readonly type: 'recording_ready';
      readonly speechText: SpeechTextResult | null;
      readonly recognitionTerminal: boolean;
      readonly recognitionError: PracticeAttemptError | null;
    }
  | {
      readonly type: 'recognition_settled';
      readonly speechText: SpeechTextResult | null;
      readonly recognitionError: PracticeAttemptError | null;
    }
  | { readonly type: 'switch_to_manual' }
  | {
      readonly type: 'text_confirmed';
      readonly speechText: SpeechTextResult;
    }
  | { readonly type: 'continue_without_text' }
  | {
      readonly type: 'demo_ready';
      readonly speechText: SpeechTextResult;
    }
  | { readonly type: 'analysis_started' }
  | {
      readonly type: 'decision_ready';
      readonly coachInput: CoachInput;
      readonly coachResult: CoachSuccessResult;
    }
  | {
      readonly type: 'recoverable_error';
      readonly error: PracticeAttemptError;
      readonly playbackAvailable: boolean;
      readonly speechText: SpeechTextResult | null;
      readonly coachInput: CoachInput | null;
      readonly coachResult: CoachResult | null;
    }
  | { readonly type: 'retry_analysis' }
  | { readonly type: 'edit_text' }
  | {
      readonly type: 'restart';
      readonly attemptId: string;
      readonly generation: number;
    };

export function createInitialPracticeState(
  attemptId: string,
  generation: number,
): InstructionState {
  return { status: 'instruction', attemptId, generation };
}

function baseFrom(state: PracticeAttemptState): PracticeStateBase {
  return {
    attemptId: state.attemptId,
    generation: state.generation,
  };
}

export function transitionPracticeAttempt(
  state: PracticeAttemptState,
  event: PracticeAttemptEvent,
): PracticeAttemptState {
  const base = baseFrom(state);

  switch (event.type) {
    case 'choose_mode':
      if (state.status !== 'instruction' && state.status !== 'privacy_choice') {
        return state;
      }
      return {
        ...base,
        status: 'privacy_choice',
        mode: event.mode,
        consentAccepted: false,
      };
    case 'set_consent':
      return state.status === 'privacy_choice' && state.mode === 'browser'
        ? { ...state, consentAccepted: event.accepted }
        : state;
    case 'request_capture':
      if (
        state.status !== 'privacy_choice' ||
        state.mode === 'demo' ||
        (state.mode === 'browser' && !state.consentAccepted)
      ) {
        return state;
      }
      return { ...base, status: 'requesting_permission', mode: state.mode };
    case 'recording_started':
      return state.status === 'requesting_permission'
        ? { ...base, status: 'recording', mode: state.mode }
        : state;
    case 'recording_ready':
      if (
        state.status !== 'requesting_permission' &&
        state.status !== 'recording'
      ) {
        return state;
      }
      if (state.mode === 'manual') {
        return {
          ...base,
          status: 'awaiting_text',
          mode: 'manual',
          recognitionError: null,
        };
      }
      if (event.speechText !== null) {
        return {
          ...base,
          status: 'ready_to_analyze',
          mode: 'browser',
          speechText: event.speechText,
        };
      }
      return event.recognitionTerminal
        ? {
            ...base,
            status: 'awaiting_text',
            mode: 'browser',
            recognitionError: event.recognitionError,
          }
        : { ...base, status: 'recorded', mode: 'browser' };
    case 'recognition_settled':
      if (state.status !== 'recorded') {
        return state;
      }
      return event.speechText !== null
        ? {
            ...base,
            status: 'ready_to_analyze',
            mode: 'browser',
            speechText: event.speechText,
          }
        : {
            ...base,
            status: 'awaiting_text',
            mode: 'browser',
            recognitionError: event.recognitionError,
          };
    case 'switch_to_manual':
      return state.status === 'awaiting_text'
        ? { ...state, mode: 'manual', recognitionError: null }
        : state;
    case 'text_confirmed':
      return state.status === 'awaiting_text' && state.mode === 'manual'
        ? {
            ...base,
            status: 'ready_to_analyze',
            mode: 'manual',
            speechText: event.speechText,
          }
        : state;
    case 'continue_without_text':
      return state.status === 'awaiting_text' && state.mode === 'browser'
        ? {
            ...base,
            status: 'ready_to_analyze',
            mode: 'browser',
            speechText: null,
          }
        : state;
    case 'demo_ready':
      return state.status === 'privacy_choice' && state.mode === 'demo'
        ? {
            ...base,
            status: 'ready_to_analyze',
            mode: 'demo',
            speechText: event.speechText,
          }
        : state;
    case 'analysis_started':
      return state.status === 'ready_to_analyze'
        ? {
            ...base,
            status: 'analyzing',
            mode: state.mode,
            speechText: state.speechText,
          }
        : state;
    case 'decision_ready':
      return state.status === 'analyzing'
        ? {
            ...base,
            status: 'decision_ready',
            mode: state.mode,
            coachInput: event.coachInput,
            coachResult: event.coachResult,
          }
        : state;
    case 'recoverable_error': {
      const mode = 'mode' in state ? state.mode : null;
      return {
        ...base,
        status: 'recoverable_error',
        mode,
        error: event.error,
        playbackAvailable: event.playbackAvailable,
        speechText: event.speechText,
        coachInput: event.coachInput,
        coachResult: event.coachResult,
      };
    }
    case 'retry_analysis':
      return state.status === 'recoverable_error' && state.mode !== null
        ? {
            ...base,
            status: 'ready_to_analyze',
            mode: state.mode,
            speechText: state.speechText,
          }
        : state;
    case 'edit_text':
      return (state.status === 'recoverable_error' && state.mode !== null) ||
        state.status === 'ready_to_analyze'
        ? {
            ...base,
            status: 'awaiting_text',
            mode: 'manual',
            recognitionError: null,
          }
        : state;
    case 'restart':
      return createInitialPracticeState(
        event.attemptId,
        event.generation,
      );
  }
}

interface BuildCoachInputOptions {
  readonly attemptId: string;
  readonly currentExercise: Exercise;
  readonly audioMetrics: DeterministicMetrics;
  readonly textMetrics: TextMetrics | null;
  readonly allowedExercises: readonly Exercise[];
  readonly validAttemptCountBeforeCurrent: number;
  readonly coveredExerciseTypesBeforeCurrent: CoachInput['coveredExerciseTypesBeforeCurrent'];
}

export function buildPracticeCoachInput({
  attemptId,
  currentExercise,
  audioMetrics,
  textMetrics,
  allowedExercises,
  validAttemptCountBeforeCurrent,
  coveredExerciseTypesBeforeCurrent,
}: BuildCoachInputOptions): CoachInput {
  return {
    attemptId,
    currentExercise,
    textSource: textMetrics?.source ?? null,
    audioMetrics,
    textMetrics,
    currentDifficulty: currentExercise.difficulty,
    validAttemptCountBeforeCurrent,
    coveredExerciseTypesBeforeCurrent,
    allowedExercises,
  };
}

export function decisionFromState(
  state: DecisionReadyState,
): CoachDecision {
  return state.coachResult.decision;
}

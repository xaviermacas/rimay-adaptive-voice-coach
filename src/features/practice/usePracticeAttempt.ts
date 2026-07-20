import { useCallback, useEffect, useReducer, useRef, useState } from 'react';

import { AUDIO_METRICS_V1_CONFIG } from '../../config/audioAnalysis';
import type { Exercise, SpeechRecognizer } from '../../domain/contracts';
import { evaluateCoach as evaluateCoachDefault, type CoachResult } from '../../domain/coaching';
import {
  EXERCISE_CATALOG,
  INITIAL_EXERCISE,
} from '../../domain/exercises';
import { calculateTextMetrics, createSpeechTextResult } from '../../domain/text';
import { analyzeAudioBlob } from '../audio-analysis/analyzeAudio';
import type { AudioBlobAnalyzer } from '../audio-analysis/useAudioAnalysis';
import { useAudioRecorder } from '../recording/useAudioRecorder';
import { useSpeechRecognition } from '../speech-recognition/useSpeechRecognition';
import {
  audioAnalysisPracticeError,
  coachingPracticeError,
  emptyManualTextError,
  recognitionPracticeError,
  recordingPracticeError,
  textMetricsPracticeError,
  type PracticeAttemptError,
} from './practiceErrors';
import {
  buildPracticeCoachInput,
  createInitialPracticeState,
  transitionPracticeAttempt,
  type PracticeAttemptState,
  type PracticeMode,
} from './practiceAttemptState';
import {
  deriveSessionCoverage,
  type SessionAttemptRecord,
} from './practiceSessionState';
import { getDemoAttemptFixtures } from './demoFixtures';

export interface UsePracticeAttemptOptions {
  readonly analyzeAudio?: AudioBlobAnalyzer;
  readonly browserRecognizer?: SpeechRecognizer;
  readonly evaluateCoach?: (input: unknown) => CoachResult;
  readonly stopSpeech?: (() => void) | undefined;
  readonly currentExercise?: Exercise;
  readonly validHistory?: readonly SessionAttemptRecord[];
}

export interface PracticeAttemptController {
  readonly analyzeAttempt: () => Promise<void>;
  readonly browserRecognitionIsSupported: boolean;
  readonly clearAttemptForSessionTransition: () => void;
  readonly chooseMode: (mode: PracticeMode) => void;
  readonly confirmManualText: () => void;
  readonly consentAccepted: boolean;
  readonly continueWithoutText: () => void;
  readonly currentExercise: Exercise;
  readonly discardAttempt: () => void;
  readonly editText: () => void;
  readonly manualInputError: PracticeAttemptError | null;
  readonly manualText: string;
  readonly recordedAudio: ReturnType<typeof useAudioRecorder>['recordedAudio'];
  readonly recorderStatus: ReturnType<typeof useAudioRecorder>['status'];
  readonly recognitionState: ReturnType<typeof useSpeechRecognition>['state'];
  readonly repeatAttempt: () => void;
  readonly retryAnalysis: () => void;
  readonly setConsentAccepted: (accepted: boolean) => void;
  readonly setManualText: (text: string) => void;
  readonly startAttempt: () => void;
  readonly startNewAttempt: () => void;
  readonly state: PracticeAttemptState;
  readonly stopRecording: () => void;
  readonly switchToManual: () => void;
}

const ACTIVE_RECOGNITION_STATUSES = new Set([
  'requesting',
  'listening',
  'processing',
] as const);

const DO_NOTHING = () => undefined;
const EMPTY_VALID_HISTORY: readonly SessionAttemptRecord[] = Object.freeze([]);

function recognitionIsTerminal(
  status: PracticeAttemptController['recognitionState']['status'],
): boolean {
  return !ACTIVE_RECOGNITION_STATUSES.has(
    status as 'requesting' | 'listening' | 'processing',
  );
}

export function usePracticeAttempt(
  options: UsePracticeAttemptOptions = {},
): PracticeAttemptController {
  const analyzeAudio = options.analyzeAudio ?? analyzeAudioBlob;
  const coachEvaluator = options.evaluateCoach ?? evaluateCoachDefault;
  const stopSpeech = options.stopSpeech ?? DO_NOTHING;
  const currentExercise = options.currentExercise ?? INITIAL_EXERCISE;
  const validHistory = options.validHistory ?? EMPTY_VALID_HISTORY;
  const recorder = useAudioRecorder();
  const recognition = useSpeechRecognition({
    browserRecognizer: options.browserRecognizer,
  });
  const [state, dispatch] = useReducer(
    transitionPracticeAttempt,
    createInitialPracticeState('practice-attempt-1', 1),
  );
  const [manualText, setManualTextValue] = useState('');
  const [manualInputError, setManualInputError] =
    useState<PracticeAttemptError | null>(null);
  const attemptSequenceRef = useRef(1);
  const generationRef = useRef(1);
  const analysisOperationRef = useRef(0);
  const analysisInFlightRef = useRef(false);
  const mountedRef = useRef(true);

  const invalidateAttemptResources = useCallback(() => {
    generationRef.current += 1;
    analysisOperationRef.current += 1;
    analysisInFlightRef.current = false;
    recognition.reset();
    recorder.reset();
    setManualTextValue('');
    setManualInputError(null);
    return generationRef.current;
  }, [recognition, recorder]);

  const restartWithNewAttempt = useCallback(() => {
    const generation = invalidateAttemptResources();
    attemptSequenceRef.current += 1;
    dispatch({
      type: 'restart',
      attemptId: `practice-attempt-${attemptSequenceRef.current}`,
      generation,
    });
  }, [invalidateAttemptResources]);

  const clearAttemptForSessionTransition = useCallback(() => {
    invalidateAttemptResources();
  }, [invalidateAttemptResources]);

  useEffect(() => {
    if (
      (state.status === 'requesting_permission' || state.status === 'recording') &&
      recorder.status === 'error' &&
      recorder.error !== null
    ) {
      stopSpeech();
      recognition.cancel();
      dispatch({
        type: 'recoverable_error',
        error: recordingPracticeError(recorder.error),
        playbackAvailable: false,
        speechText: null,
        coachInput: null,
        coachResult: null,
      });
      return;
    }

    if (
      state.status === 'requesting_permission' &&
      recorder.status === 'recording'
    ) {
      dispatch({ type: 'recording_started' });
      return;
    }

    if (
      (state.status === 'requesting_permission' || state.status === 'recording') &&
      recorder.status === 'recorded'
    ) {
      const recognitionError =
        recognition.state.errorCode === null
          ? null
          : recognitionPracticeError(recognition.state.errorCode);
      dispatch({
        type: 'recording_ready',
        speechText: recognition.state.result,
        recognitionTerminal: recognitionIsTerminal(recognition.state.status),
        recognitionError,
      });
    }
  }, [recognition, recorder, state, stopSpeech]);

  useEffect(() => {
    if (
      state.status !== 'recorded' ||
      !recognitionIsTerminal(recognition.state.status)
    ) {
      return;
    }

    const errorCode = recognition.state.errorCode ?? 'no_speech';
    dispatch({
      type: 'recognition_settled',
      speechText: recognition.state.result,
      recognitionError:
        recognition.state.result === null
          ? recognitionPracticeError(errorCode)
          : null,
    });
  }, [recognition.state, state.status]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      generationRef.current += 1;
      analysisOperationRef.current += 1;
      analysisInFlightRef.current = false;
    };
  }, []);

  const chooseMode = useCallback((mode: PracticeMode) => {
    setManualInputError(null);
    dispatch({ type: 'choose_mode', mode });
  }, []);

  const setConsentAccepted = useCallback((accepted: boolean) => {
    dispatch({ type: 'set_consent', accepted });
  }, []);

  const startAttempt = useCallback(() => {
    if (state.status !== 'privacy_choice') {
      return;
    }

    stopSpeech();

    if (state.mode === 'demo') {
      dispatch({
        type: 'demo_ready',
        speechText: getDemoAttemptFixtures(currentExercise).speechText,
      });
      return;
    }

    if (state.mode === 'browser' && !recognition.browserIsSupported) {
      dispatch({
        type: 'recoverable_error',
        error: recognitionPracticeError('unsupported'),
        playbackAvailable: false,
        speechText: null,
        coachInput: null,
        coachResult: null,
      });
      return;
    }

    dispatch({ type: 'request_capture' });
    void recorder.startRecording();
    if (state.mode === 'browser') {
      recognition.start('browser');
    }
  }, [currentExercise, recognition, recorder, state, stopSpeech]);

  const stopRecording = useCallback(() => {
    if (state.status !== 'recording') {
      return;
    }
    recorder.stopRecording();
    if (state.mode === 'browser') {
      recognition.stop();
    }
  }, [recognition, recorder, state]);

  const setManualText = useCallback((text: string) => {
    setManualTextValue(text);
    setManualInputError(null);
  }, []);

  const confirmManualText = useCallback(() => {
    if (state.status !== 'awaiting_text' || state.mode !== 'manual') {
      return;
    }
    if (manualText.trim() === '') {
      setManualInputError(emptyManualTextError());
      return;
    }

    dispatch({
      type: 'text_confirmed',
      speechText: createSpeechTextResult({
        originalText: manualText,
        source: 'manual',
        languageRequested: null,
        isFinal: true,
      }),
    });
    setManualInputError(null);
  }, [manualText, state]);

  const switchToManual = useCallback(() => {
    if (state.status !== 'awaiting_text') {
      return;
    }
    recognition.reset();
    dispatch({ type: 'switch_to_manual' });
    setManualInputError(null);
  }, [recognition, state.status]);

  const continueWithoutText = useCallback(() => {
    recognition.reset();
    dispatch({ type: 'continue_without_text' });
  }, [recognition]);

  const analyzeAttempt = useCallback(async () => {
    if (state.status !== 'ready_to_analyze' || analysisInFlightRef.current) {
      return;
    }

    analysisInFlightRef.current = true;
    const operationId = analysisOperationRef.current + 1;
    analysisOperationRef.current = operationId;
    const generation = generationRef.current;
    const { attemptId, mode, speechText } = state;
    dispatch({ type: 'analysis_started' });

    try {
      const audioResult =
        mode === 'demo'
          ? {
              status: 'success' as const,
              metrics: getDemoAttemptFixtures(currentExercise).audioMetrics,
            }
          : recorder.recordedAudio === null
            ? {
                status: 'error' as const,
                error: {
                  code: 'insufficient_samples' as const,
                  message: 'No hay una grabaci\u00f3n disponible para analizar.',
                },
              }
            : await analyzeAudio(recorder.recordedAudio.blob);

      if (
        !mountedRef.current ||
        generationRef.current !== generation ||
        analysisOperationRef.current !== operationId
      ) {
        return;
      }

      if (audioResult.status === 'error') {
        stopSpeech();
        dispatch({
          type: 'recoverable_error',
          error: audioAnalysisPracticeError(audioResult.error),
          playbackAvailable: recorder.recordedAudio !== null,
          speechText,
          coachInput: null,
          coachResult: null,
        });
        return;
      }

      let textMetrics = null;
      if (speechText !== null) {
        const textResult = calculateTextMetrics({
          targetText: currentExercise.targetText,
          speechText,
          audioEvidence:
            mode === 'demo'
              ? null
              : {
                  totalDurationMs: audioResult.metrics.totalDurationMs,
                  estimatedSpeechDurationMs:
                    audioResult.metrics.estimatedSpeechDurationMs,
                  minimumSpeechDurationMs:
                    AUDIO_METRICS_V1_CONFIG.minimumSpeechDurationMs,
                  qualityFlags: audioResult.metrics.qualityFlags,
                },
        });
        if (textResult.status === 'error') {
          stopSpeech();
          dispatch({
            type: 'recoverable_error',
            error: textMetricsPracticeError(textResult.error),
            playbackAvailable: recorder.recordedAudio !== null,
            speechText,
            coachInput: null,
            coachResult: null,
          });
          return;
        }
        textMetrics = Object.freeze({
          ...textResult.metrics,
          targetText: currentExercise.targetText,
        });
      }

      const coachInput = buildPracticeCoachInput({
        attemptId,
        currentExercise,
        audioMetrics: audioResult.metrics,
        textMetrics,
        allowedExercises: EXERCISE_CATALOG,
        validAttemptCountBeforeCurrent: validHistory.length,
        coveredExerciseTypesBeforeCurrent: deriveSessionCoverage(validHistory),
      });
      const coachResult = coachEvaluator(coachInput);
      if (!coachResult.ok) {
        stopSpeech();
        dispatch({
          type: 'recoverable_error',
          error: coachingPracticeError(coachResult.error),
          playbackAvailable: recorder.recordedAudio !== null,
          speechText,
          coachInput,
          coachResult,
        });
        return;
      }
      dispatch({ type: 'decision_ready', coachInput, coachResult });
    } finally {
      if (analysisOperationRef.current === operationId) {
        queueMicrotask(() => {
          if (analysisOperationRef.current === operationId) {
            analysisInFlightRef.current = false;
          }
        });
      }
    }
  }, [
    analyzeAudio,
    coachEvaluator,
    recorder.recordedAudio,
    state,
    stopSpeech,
    currentExercise,
    validHistory,
  ]);

  const repeatAttempt = useCallback(() => {
    if (
      state.status !== 'decision_ready' ||
      state.coachResult.decision.action !== 'repeat_current'
    ) {
      return;
    }
    stopSpeech();
    restartWithNewAttempt();
  }, [restartWithNewAttempt, state, stopSpeech]);

  const discardAttempt = useCallback(() => {
    stopSpeech();
    restartWithNewAttempt();
  }, [restartWithNewAttempt, stopSpeech]);

  const retryAnalysis = useCallback(() => {
    dispatch({ type: 'retry_analysis' });
  }, []);

  const editText = useCallback(() => {
    if (state.status === 'ready_to_analyze' && state.speechText !== null) {
      setManualTextValue(state.speechText.originalText);
      recognition.reset();
    }
    dispatch({ type: 'edit_text' });
  }, [recognition, state]);

  return {
    analyzeAttempt,
    browserRecognitionIsSupported: recognition.browserIsSupported,
    clearAttemptForSessionTransition,
    chooseMode,
    confirmManualText,
    consentAccepted:
      state.status === 'privacy_choice' && state.mode === 'browser'
        ? state.consentAccepted
        : false,
    continueWithoutText,
    currentExercise,
    discardAttempt,
    editText,
    manualInputError,
    manualText,
    recordedAudio: recorder.recordedAudio,
    recorderStatus: recorder.status,
    recognitionState: recognition.state,
    repeatAttempt,
    retryAnalysis,
    setConsentAccepted,
    setManualText,
    startAttempt,
    startNewAttempt: restartWithNewAttempt,
    state,
    stopRecording,
    switchToManual,
  };
}

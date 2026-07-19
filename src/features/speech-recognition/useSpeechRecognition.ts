import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  FINAL_RESULT_WAIT_MS,
  RECOGNITION_LANGUAGE_TAG,
} from '../../config/speechRecognition';
import type {
  ActiveRecognition,
  SpeechRecognitionErrorCode,
  SpeechRecognitionStatus,
  SpeechRecognizer,
  SpeechTextResult,
} from '../../domain/contracts';
import { createSpeechTextResult } from '../../domain/text';
import { BrowserSpeechRecognizer } from '../../recognizers/browser';
import { DemoSpeechRecognizer } from '../../recognizers/demo';

export interface SpeechRecognitionState {
  readonly status: SpeechRecognitionStatus;
  readonly interimText: string;
  readonly result: SpeechTextResult | null;
  readonly errorCode: SpeechRecognitionErrorCode | null;
}

interface SpeechRecognitionController {
  readonly browserIsSupported: boolean;
  readonly cancel: () => void;
  readonly reset: () => void;
  readonly start: (source: 'browser' | 'demo') => void;
  readonly state: SpeechRecognitionState;
  readonly stop: () => void;
}

interface UseSpeechRecognitionInput {
  readonly browserRecognizer?: SpeechRecognizer | undefined;
  readonly demoRecognizer?: SpeechRecognizer | undefined;
}

const INITIAL_STATE: SpeechRecognitionState = {
  status: 'idle',
  interimText: '',
  result: null,
  errorCode: null,
};

function statusForError(
  errorCode: SpeechRecognitionErrorCode,
): SpeechRecognitionStatus {
  if (errorCode === 'unsupported') {
    return 'unsupported';
  }

  if (errorCode === 'aborted') {
    return 'cancelled';
  }

  return 'error';
}

export function useSpeechRecognition(
  input: UseSpeechRecognitionInput = {},
): SpeechRecognitionController {
  const browserRecognizer = useMemo(
    () => input.browserRecognizer ?? new BrowserSpeechRecognizer(),
    [input.browserRecognizer],
  );
  const demoRecognizer = useMemo(
    () => input.demoRecognizer ?? new DemoSpeechRecognizer(),
    [input.demoRecognizer],
  );
  const [state, setState] = useState<SpeechRecognitionState>(INITIAL_STATE);
  const activeRef = useRef<ActiveRecognition | null>(null);
  const generationRef = useRef(0);
  const finalWaitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const clearFinalWait = useCallback(() => {
    if (finalWaitTimerRef.current !== null) {
      clearTimeout(finalWaitTimerRef.current);
      finalWaitTimerRef.current = null;
    }
  }, []);

  const disposeActive = useCallback(() => {
    clearFinalWait();
    activeRef.current?.dispose();
    activeRef.current = null;
  }, [clearFinalWait]);

  const reset = useCallback(() => {
    generationRef.current += 1;
    disposeActive();
    setState(INITIAL_STATE);
  }, [disposeActive]);

  const cancel = useCallback(() => {
    generationRef.current += 1;
    clearFinalWait();
    const active = activeRef.current;
    activeRef.current = null;
    active?.abort();
    active?.dispose();
    setState((current) => ({
      ...current,
      status: 'cancelled',
      interimText: '',
      errorCode: 'aborted',
    }));
  }, [clearFinalWait]);

  const start = useCallback(
    (source: 'browser' | 'demo') => {
      if (activeRef.current !== null) {
        return;
      }

      const recognizer =
        source === 'browser' ? browserRecognizer : demoRecognizer;
      if (!recognizer.isSupported()) {
        setState({
          status: 'unsupported',
          interimText: '',
          result: null,
          errorCode: 'unsupported',
        });
        return;
      }

      const generation = generationRef.current + 1;
      generationRef.current = generation;
      clearFinalWait();
      setState({
        status: 'requesting',
        interimText: '',
        result: null,
        errorCode: null,
      });

      const callbackIsCurrent = () =>
        mountedRef.current && generationRef.current === generation;
      let recognitionEnded = false;

      const active = recognizer.start({
        languageTag: RECOGNITION_LANGUAGE_TAG,
        callbacks: {
          onInterim: (text) => {
            if (!callbackIsCurrent()) {
              return;
            }

            setState((current) => ({
              ...current,
              status:
                text === '' && current.status !== 'requesting'
                  ? current.status
                  : 'listening',
              interimText: text,
              errorCode: null,
            }));
          },
          onFinal: (text) => {
            if (!callbackIsCurrent() || text.trim() === '') {
              return;
            }

            clearFinalWait();
            setState({
              status: 'completed',
              interimText: '',
              result: createSpeechTextResult({
                originalText: text,
                source,
                languageRequested: RECOGNITION_LANGUAGE_TAG,
                isFinal: true,
                warnings:
                  source === 'demo'
                    ? ['demo_fixture_does_not_analyze_audio']
                    : [],
              }),
              errorCode: null,
            });
          },
          onError: (errorCode) => {
            if (!callbackIsCurrent()) {
              return;
            }

            clearFinalWait();
            setState((current) =>
              current.result !== null
                ? current
                : {
                    ...current,
                    status: statusForError(errorCode),
                    interimText: '',
                    errorCode,
                  },
            );
          },
          onEnd: () => {
            if (!callbackIsCurrent()) {
              return;
            }

            recognitionEnded = true;
            clearFinalWait();
            activeRef.current = null;
            setState((current) => {
              if (current.result !== null || current.errorCode !== null) {
                return current;
              }

              return {
                ...current,
                status: 'error',
                interimText: '',
                errorCode: 'no_speech',
              };
            });
          },
        },
      });
      if (recognitionEnded) {
        active.dispose();
      } else {
        activeRef.current = active;
      }
    },
    [browserRecognizer, clearFinalWait, demoRecognizer],
  );

  const stop = useCallback(() => {
    const active = activeRef.current;
    if (active === null) {
      return;
    }

    const generation = generationRef.current;
    setState((current) => ({
      ...current,
      status: current.result === null ? 'processing' : current.status,
    }));
    active.stop();

    if (activeRef.current !== active) {
      return;
    }

    clearFinalWait();
    finalWaitTimerRef.current = setTimeout(() => {
      if (
        !mountedRef.current ||
        generationRef.current !== generation ||
        activeRef.current !== active
      ) {
        return;
      }

      activeRef.current = null;
      active.dispose();
      setState((current) => {
        if (current.result !== null || current.errorCode !== null) {
          return current;
        }

        return {
          ...current,
          status: 'error',
          interimText: '',
          errorCode: 'no_speech',
        };
      });
    }, FINAL_RESULT_WAIT_MS);
  }, [clearFinalWait]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      generationRef.current += 1;
      disposeActive();
    };
  }, [disposeActive]);

  return {
    browserIsSupported: browserRecognizer.isSupported(),
    cancel,
    reset,
    start,
    state,
    stop,
  };
}

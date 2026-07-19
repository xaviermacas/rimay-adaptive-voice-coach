import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { BrowserSpeechOutput } from './BrowserSpeechOutput';
import {
  SpeechOutputFailure,
  type SpeechOutputAvailabilitySnapshot,
  type SpeechOutputState,
} from './types';

export interface SpeechOutputController {
  readonly isAvailable: boolean;
  readonly speak: (text: string) => Promise<void>;
  readonly state: SpeechOutputState;
  readonly stop: () => void;
  readonly dispose: () => void;
}

export interface UseSpeechOutputOptions {
  readonly output?: BrowserSpeechOutput | undefined;
}

function stateFromSnapshot(
  snapshot: SpeechOutputAvailabilitySnapshot,
): SpeechOutputState {
  return snapshot;
}

function failureMessage(error: unknown): string {
  if (error instanceof SpeechOutputFailure) {
    return error.message;
  }
  return 'No se pudo reproducir la voz. El texto sigue disponible.';
}

export function useSpeechOutput(
  options: UseSpeechOutputOptions = {},
): SpeechOutputController {
  const output = useMemo(
    () => options.output ?? new BrowserSpeechOutput(),
    [options.output],
  );
  const [state, setState] = useState<SpeechOutputState>(() =>
    stateFromSnapshot(output.getSnapshot()),
  );
  const operationRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const unsubscribe = output.subscribe((snapshot) => {
      if (!mountedRef.current) {
        return;
      }
      setState((current) =>
        current.status === 'speaking'
          ? snapshot.status === 'ready'
            ? { status: 'speaking', selectedVoice: snapshot.selectedVoice }
            : current
          : stateFromSnapshot(snapshot),
      );
    });
    output.connect();

    return () => {
      mountedRef.current = false;
      operationRef.current += 1;
      unsubscribe();
      output.dispose();
    };
  }, [output]);

  const speak = useCallback(
    async (text: string): Promise<void> => {
      const operation = operationRef.current + 1;
      operationRef.current = operation;
      const snapshot = output.getSnapshot();
      if (snapshot.status === 'ready') {
        setState({
          status: 'speaking',
          selectedVoice: snapshot.selectedVoice,
        });
      }

      try {
        await output.speak(text);
        if (!mountedRef.current || operationRef.current !== operation) {
          return;
        }
        setState(stateFromSnapshot(output.getSnapshot()));
      } catch (error: unknown) {
        if (!mountedRef.current || operationRef.current !== operation) {
          return;
        }
        setState({
          status: 'error',
          selectedVoice: output.getSnapshot().selectedVoice,
          message: failureMessage(error),
        });
      }
    },
    [output],
  );

  const stop = useCallback(() => {
    operationRef.current += 1;
    output.stop();
    setState((current) =>
      current.status === 'speaking'
        ? {
            status: 'stopped',
            selectedVoice: output.getSnapshot().selectedVoice,
          }
        : stateFromSnapshot(output.getSnapshot()),
    );
  }, [output]);

  const dispose = useCallback(() => {
    operationRef.current += 1;
    output.dispose();
    setState({ status: 'unsupported', selectedVoice: null });
  }, [output]);

  return {
    isAvailable: output.isAvailable(),
    speak,
    state,
    stop,
    dispose,
  };
}

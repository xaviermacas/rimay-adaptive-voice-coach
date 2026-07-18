import { useCallback, useEffect, useRef, useState } from 'react';

import type {
  AudioAnalysisError,
  AudioAnalysisResult,
  DeterministicMetrics,
} from '../../domain/audio';
import { analyzeAudioBlob } from './analyzeAudio';

export type AudioBlobAnalyzer = (audioBlob: Blob) => Promise<AudioAnalysisResult>;

export type AudioAnalysisState =
  | { readonly status: 'idle' }
  | { readonly status: 'analyzing' }
  | { readonly status: 'success'; readonly metrics: DeterministicMetrics }
  | { readonly status: 'error'; readonly error: AudioAnalysisError };

interface AudioAnalysisController {
  readonly analyze: (audioBlob: Blob) => Promise<void>;
  readonly reset: () => void;
  readonly state: AudioAnalysisState;
}

export function useAudioAnalysis(
  analyzer: AudioBlobAnalyzer = analyzeAudioBlob,
): AudioAnalysisController {
  const [state, setState] = useState<AudioAnalysisState>({ status: 'idle' });
  const mountedRef = useRef(true);
  const operationIdRef = useRef(0);

  const reset = useCallback(() => {
    operationIdRef.current += 1;
    setState({ status: 'idle' });
  }, []);

  const analyze = useCallback(
    async (audioBlob: Blob) => {
      const operationId = operationIdRef.current + 1;
      operationIdRef.current = operationId;
      setState({ status: 'analyzing' });

      const result = await analyzer(audioBlob);
      if (!mountedRef.current || operationIdRef.current !== operationId) {
        return;
      }

      if (result.status === 'success') {
        setState({ status: 'success', metrics: result.metrics });
      } else {
        setState({ status: 'error', error: result.error });
      }
    },
    [analyzer],
  );

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      operationIdRef.current += 1;
    };
  }, []);

  return { analyze, reset, state };
}

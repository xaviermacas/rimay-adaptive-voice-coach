import { useCallback, useEffect, useRef, useState } from 'react';

import {
  createRecordingError,
  mapCaptureError,
  MAX_RECORDING_DURATION_MS,
  MAX_RECORDING_SIZE_BYTES,
  MICROPHONE_REQUEST_TIMEOUT_MS,
  MIN_RECORDING_DURATION_MS,
  selectSupportedMimeType,
  type RecordingError,
  type RecordingErrorCode,
} from './recordingSupport';

export type RecorderStatus =
  | 'idle'
  | 'requestingPermission'
  | 'recording'
  | 'processing'
  | 'recorded'
  | 'error';

export interface RecordedAudio {
  blob: Blob;
  durationMs: number;
  mimeType: string;
  url: string;
}

interface AudioRecorderController {
  activeMimeType: string | null;
  error: RecordingError | null;
  recordedAudio: RecordedAudio | null;
  reset: () => void;
  startRecording: () => Promise<void>;
  status: RecorderStatus;
  stopRecording: () => void;
}

function stopAllTracks(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => {
    track.stop();
  });
}

export function useAudioRecorder(): AudioRecorderController {
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [error, setError] = useState<RecordingError | null>(null);
  const [recordedAudio, setRecordedAudio] = useState<RecordedAudio | null>(null);
  const [activeMimeType, setActiveMimeType] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const totalBytesRef = useRef(0);
  const startedAtRef = useRef(0);
  const recordingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const permissionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const terminalErrorRef = useRef<RecordingErrorCode | null>(null);
  const operationActiveRef = useRef(false);
  const mountedRef = useRef(true);

  const clearDurationTimer = useCallback(() => {
    if (recordingTimerRef.current !== null) {
      clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }, []);

  const clearPermissionTimer = useCallback(() => {
    if (permissionTimerRef.current !== null) {
      clearTimeout(permissionTimerRef.current);
      permissionTimerRef.current = null;
    }
  }, []);

  const revokeAudioUrl = useCallback(() => {
    if (audioUrlRef.current !== null) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }, []);

  const releaseCapture = useCallback(() => {
    clearDurationTimer();
    clearPermissionTimer();
    stopAllTracks(streamRef.current);
    streamRef.current = null;
    recorderRef.current = null;
    operationActiveRef.current = false;
  }, [clearDurationTimer, clearPermissionTimer]);

  const presentError = useCallback((recordingError: RecordingError) => {
    if (mountedRef.current) {
      setError(recordingError);
      setRecordedAudio(null);
      setStatus('error');
    }
  }, []);

  const finishWithError = useCallback(
    (code: RecordingErrorCode) => {
      chunksRef.current = [];
      totalBytesRef.current = 0;
      releaseCapture();
      presentError(createRecordingError(code));
    },
    [presentError, releaseCapture],
  );

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;

    if (recorder === null || recorder.state === 'inactive') {
      return;
    }

    if (mountedRef.current) {
      setStatus('processing');
    }

    try {
      recorder.stop();
    } catch {
      finishWithError('recording_failed');
    }
  }, [finishWithError]);

  const startRecording = useCallback(async () => {
    if (operationActiveRef.current) {
      return;
    }

    operationActiveRef.current = true;
    terminalErrorRef.current = null;
    chunksRef.current = [];
    totalBytesRef.current = 0;
    revokeAudioUrl();
    setRecordedAudio(null);
    setError(null);
    setActiveMimeType(null);
    setStatus('requestingPermission');

    try {
      if (
        typeof MediaRecorder === 'undefined' ||
        typeof MediaRecorder.isTypeSupported !== 'function' ||
        navigator.mediaDevices?.getUserMedia === undefined ||
        typeof URL.createObjectURL !== 'function' ||
        typeof URL.revokeObjectURL !== 'function'
      ) {
        releaseCapture();
        presentError(createRecordingError('browser_unsupported'));
        return;
      }

      let requestTimedOut = false;
      const streamRequest = navigator.mediaDevices.getUserMedia({ audio: true });
      const stream = await new Promise<MediaStream>((resolve, reject) => {
        permissionTimerRef.current = setTimeout(() => {
          requestTimedOut = true;
          permissionTimerRef.current = null;
          reject(new DOMException('Microphone request timed out', 'TimeoutError'));
        }, MICROPHONE_REQUEST_TIMEOUT_MS);

        void streamRequest.then(
          (requestedStream) => {
            if (requestTimedOut) {
              stopAllTracks(requestedStream);
              return;
            }

            clearPermissionTimer();
            resolve(requestedStream);
          },
          (requestError: unknown) => {
            if (requestTimedOut) {
              return;
            }

            clearPermissionTimer();
            reject(requestError);
          },
        );
      });

      if (!mountedRef.current) {
        stopAllTracks(stream);
        operationActiveRef.current = false;
        return;
      }

      streamRef.current = stream;
      const selectedMimeType = selectSupportedMimeType(MediaRecorder);
      const recorder = new MediaRecorder(
        stream,
        selectedMimeType === null ? undefined : { mimeType: selectedMimeType },
      );

      recorderRef.current = recorder;
      const runtimeMimeType =
        recorder.mimeType || selectedMimeType || 'formato predeterminado del navegador';
      setActiveMimeType(runtimeMimeType);

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size === 0 || terminalErrorRef.current !== null) {
          return;
        }

        chunksRef.current.push(event.data);
        totalBytesRef.current += event.data.size;

        if (
          totalBytesRef.current > MAX_RECORDING_SIZE_BYTES &&
          recorder.state !== 'inactive'
        ) {
          terminalErrorRef.current = 'file_too_large';
          stopRecording();
        }
      };

      recorder.onerror = () => {
        terminalErrorRef.current = 'recording_failed';

        if (recorder.state !== 'inactive') {
          stopRecording();
        } else {
          finishWithError('recording_failed');
        }
      };

      recorder.onstop = () => {
        const durationMs = Math.max(0, performance.now() - startedAtRef.current);
        const terminalError = terminalErrorRef.current;
        const chunks = chunksRef.current;
        const mimeType =
          recorder.mimeType || selectedMimeType || chunks[0]?.type || 'audio/webm';

        releaseCapture();
        chunksRef.current = [];
        totalBytesRef.current = 0;

        if (terminalError !== null) {
          presentError(createRecordingError(terminalError));
          return;
        }

        const blob = new Blob(chunks, { type: mimeType });

        if (blob.size === 0) {
          presentError(createRecordingError('audio_empty'));
          return;
        }

        if (durationMs < MIN_RECORDING_DURATION_MS) {
          presentError(createRecordingError('audio_too_short'));
          return;
        }

        if (blob.size > MAX_RECORDING_SIZE_BYTES) {
          presentError(createRecordingError('file_too_large'));
          return;
        }

        try {
          const url = URL.createObjectURL(blob);
          audioUrlRef.current = url;

          if (mountedRef.current) {
            setRecordedAudio({ blob, durationMs, mimeType, url });
            setError(null);
            setStatus('recorded');
          }
        } catch {
          presentError(createRecordingError('recording_failed'));
        }
      };

      startedAtRef.current = performance.now();
      recorder.start(250);
      setStatus('recording');
      recordingTimerRef.current = setTimeout(
        stopRecording,
        MAX_RECORDING_DURATION_MS,
      );
    } catch (captureError) {
      releaseCapture();
      presentError(mapCaptureError(captureError));
    }
  }, [
    clearPermissionTimer,
    finishWithError,
    presentError,
    releaseCapture,
    revokeAudioUrl,
    stopRecording,
  ]);

  const reset = useCallback(() => {
    revokeAudioUrl();
    setRecordedAudio(null);
    setError(null);
    setActiveMimeType(null);
    setStatus('idle');
  }, [revokeAudioUrl]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      clearDurationTimer();
      clearPermissionTimer();

      const recorder = recorderRef.current;
      if (recorder !== null) {
        recorder.ondataavailable = null;
        recorder.onerror = null;
        recorder.onstop = null;

        if (recorder.state !== 'inactive') {
          recorder.stop();
        }
      }

      stopAllTracks(streamRef.current);
      revokeAudioUrl();
    };
  }, [clearDurationTimer, clearPermissionTimer, revokeAudioUrl]);

  return {
    activeMimeType,
    error,
    recordedAudio,
    reset,
    startRecording,
    status,
    stopRecording,
  };
}

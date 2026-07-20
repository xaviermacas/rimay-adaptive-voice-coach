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
  sizeBytes: number;
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

interface RecordingSession {
  readonly recorder: MediaRecorder;
  readonly stream: MediaStream;
  readonly negotiatedMimeType: string | null;
  readonly operationId: number;
  readonly startedAtMs: number;
  chunks: Blob[];
  discardResult: boolean;
  finalized: boolean;
  stopRequested: boolean;
  terminalError: RecordingErrorCode | null;
  totalBytes: number;
  tracksReleased: boolean;
}

function stopAllTracks(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => {
    track.stop();
  });
}

function resolveFinalMimeType(session: RecordingSession): string {
  const recorderMimeType = session.recorder.mimeType.trim();
  if (recorderMimeType !== '') {
    return recorderMimeType;
  }
  if (session.negotiatedMimeType !== null) {
    return session.negotiatedMimeType;
  }
  return session.chunks[0]?.type ?? '';
}

export function useAudioRecorder(): AudioRecorderController {
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [error, setError] = useState<RecordingError | null>(null);
  const [recordedAudio, setRecordedAudio] = useState<RecordedAudio | null>(null);
  const [activeMimeType, setActiveMimeType] = useState<string | null>(null);

  const sessionRef = useRef<RecordingSession | null>(null);
  const pendingStreamRef = useRef<MediaStream | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const permissionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const operationActiveRef = useRef(false);
  const operationIdRef = useRef(0);
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

  const presentError = useCallback((recordingError: RecordingError) => {
    if (mountedRef.current) {
      setError(recordingError);
      setRecordedAudio(null);
      setStatus('error');
    }
  }, []);

  const releaseSession = useCallback(
    (session: RecordingSession) => {
      if (!session.tracksReleased) {
        stopAllTracks(session.stream);
        session.tracksReleased = true;
      }

      session.recorder.ondataavailable = null;
      session.recorder.onerror = null;
      session.recorder.onstop = null;

      if (pendingStreamRef.current === session.stream) {
        pendingStreamRef.current = null;
      }
      if (sessionRef.current === session) {
        clearDurationTimer();
        sessionRef.current = null;
        operationActiveRef.current = false;
      }
    },
    [clearDurationTimer],
  );

  const failSessionImmediately = useCallback(
    (session: RecordingSession, code: RecordingErrorCode) => {
      if (session.finalized) {
        return;
      }
      const shouldPublish =
        mountedRef.current &&
        !session.discardResult &&
        sessionRef.current === session &&
        operationIdRef.current === session.operationId;

      session.finalized = true;
      session.chunks = [];
      session.totalBytes = 0;
      releaseSession(session);

      if (shouldPublish) {
        presentError(createRecordingError(code));
      }
    },
    [presentError, releaseSession],
  );

  const finalizeSession = useCallback(
    (session: RecordingSession) => {
      if (session.finalized) {
        return;
      }
      session.finalized = true;

      const durationMs = Math.max(0, performance.now() - session.startedAtMs);
      const chunks = session.chunks.slice();
      const mimeType = resolveFinalMimeType(session);
      const terminalError = session.terminalError;
      const blob = new Blob(
        chunks,
        mimeType === '' ? undefined : { type: mimeType },
      );
      const shouldPublish =
        mountedRef.current &&
        !session.discardResult &&
        sessionRef.current === session &&
        operationIdRef.current === session.operationId;

      session.chunks = [];
      session.totalBytes = 0;
      releaseSession(session);

      if (!shouldPublish) {
        return;
      }
      if (terminalError !== null) {
        presentError(createRecordingError(terminalError));
        return;
      }
      if (chunks.length === 0 || blob.size === 0) {
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
        setRecordedAudio({
          blob,
          durationMs,
          mimeType: blob.type,
          sizeBytes: blob.size,
          url,
        });
        setError(null);
        setStatus('recorded');
      } catch {
        presentError(createRecordingError('recording_failed'));
      }
    },
    [presentError, releaseSession],
  );

  const requestSessionStop = useCallback(
    (session: RecordingSession) => {
      if (
        session.finalized ||
        session.stopRequested ||
        session.recorder.state === 'inactive'
      ) {
        return;
      }

      session.stopRequested = true;
      if (sessionRef.current === session) {
        clearDurationTimer();
        if (mountedRef.current && !session.discardResult) {
          setStatus('processing');
        }
      }

      if (
        session.recorder.state === 'recording' &&
        typeof session.recorder.requestData === 'function'
      ) {
        try {
          session.recorder.requestData();
        } catch {
          // stop() sigue siendo la fuente de finalización y del último chunk.
        }
      }

      try {
        session.recorder.stop();
      } catch {
        session.terminalError = 'recording_failed';
        failSessionImmediately(session, 'recording_failed');
      }
    },
    [clearDurationTimer, failSessionImmediately],
  );

  const stopRecording = useCallback(() => {
    const session = sessionRef.current;
    if (session !== null) {
      requestSessionStop(session);
    }
  }, [requestSessionStop]);

  const startRecording = useCallback(async () => {
    if (operationActiveRef.current) {
      return;
    }

    operationActiveRef.current = true;
    const operationId = operationIdRef.current + 1;
    operationIdRef.current = operationId;
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
        operationActiveRef.current = false;
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
            if (operationIdRef.current !== operationId) {
              stopAllTracks(requestedStream);
              reject(new DOMException('Recording request is stale', 'AbortError'));
              return;
            }
            clearPermissionTimer();
            resolve(requestedStream);
          },
          (requestError: unknown) => {
            if (requestTimedOut) {
              return;
            }
            if (operationIdRef.current !== operationId) {
              reject(requestError);
              return;
            }
            clearPermissionTimer();
            reject(requestError);
          },
        );
      });

      if (!mountedRef.current || operationIdRef.current !== operationId) {
        stopAllTracks(stream);
        return;
      }

      pendingStreamRef.current = stream;
      const selectedMimeType = selectSupportedMimeType(MediaRecorder);
      const recorder = new MediaRecorder(
        stream,
        selectedMimeType === null ? undefined : { mimeType: selectedMimeType },
      );
      const session: RecordingSession = {
        recorder,
        stream,
        negotiatedMimeType: selectedMimeType,
        operationId,
        startedAtMs: performance.now(),
        chunks: [],
        discardResult: false,
        finalized: false,
        stopRequested: false,
        terminalError: null,
        totalBytes: 0,
        tracksReleased: false,
      };

      sessionRef.current = session;
      pendingStreamRef.current = null;
      setActiveMimeType(
        recorder.mimeType ||
          selectedMimeType ||
          'formato predeterminado del navegador',
      );

      recorder.ondataavailable = (event: BlobEvent) => {
        if (session.finalized || event.data.size === 0) {
          return;
        }
        session.chunks.push(event.data);
        session.totalBytes += event.data.size;

        if (
          session.totalBytes > MAX_RECORDING_SIZE_BYTES &&
          session.terminalError === null
        ) {
          session.terminalError = 'file_too_large';
          requestSessionStop(session);
        }
      };

      recorder.onerror = () => {
        if (session.finalized) {
          return;
        }
        session.terminalError = 'recording_failed';
        requestSessionStop(session);
      };

      recorder.onstop = () => {
        finalizeSession(session);
      };

      recorder.start(250);
      setStatus('recording');
      recordingTimerRef.current = setTimeout(
        () => requestSessionStop(session),
        MAX_RECORDING_DURATION_MS,
      );
    } catch (captureError) {
      if (operationIdRef.current !== operationId) {
        return;
      }

      const session = sessionRef.current;
      if (session !== null && session.operationId === operationId) {
        failSessionImmediately(session, 'recording_failed');
        return;
      }

      clearPermissionTimer();
      stopAllTracks(pendingStreamRef.current);
      pendingStreamRef.current = null;
      operationActiveRef.current = false;
      presentError(mapCaptureError(captureError));
    }
  }, [
    clearPermissionTimer,
    failSessionImmediately,
    finalizeSession,
    presentError,
    requestSessionStop,
    revokeAudioUrl,
  ]);

  const reset = useCallback(() => {
    operationIdRef.current += 1;
    operationActiveRef.current = false;
    clearDurationTimer();
    clearPermissionTimer();

    const session = sessionRef.current;
    sessionRef.current = null;
    if (session !== null && !session.finalized) {
      session.discardResult = true;
      requestSessionStop(session);
    }

    stopAllTracks(pendingStreamRef.current);
    pendingStreamRef.current = null;
    revokeAudioUrl();
    setRecordedAudio(null);
    setError(null);
    setActiveMimeType(null);
    setStatus('idle');
  }, [
    clearDurationTimer,
    clearPermissionTimer,
    requestSessionStop,
    revokeAudioUrl,
  ]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      operationIdRef.current += 1;
      operationActiveRef.current = false;
      clearDurationTimer();
      clearPermissionTimer();

      const session = sessionRef.current;
      sessionRef.current = null;
      if (session !== null && !session.finalized) {
        session.discardResult = true;
        requestSessionStop(session);
      }

      stopAllTracks(pendingStreamRef.current);
      pendingStreamRef.current = null;
      revokeAudioUrl();
    };
  }, [
    clearDurationTimer,
    clearPermissionTimer,
    requestSessionStop,
    revokeAudioUrl,
  ]);

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

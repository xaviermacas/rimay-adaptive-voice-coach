import { useEffect, useMemo, useState } from 'react';

import { AUDIO_METRICS_V1_CONFIG } from '../../config/audioAnalysis';
import type {
  SpeechRecognitionMode,
  SpeechRecognizer,
  SpeechTextResult,
} from '../../domain/contracts';
import { calculateTextMetrics, createSpeechTextResult } from '../../domain/text';
import { AudioMetricsSummary } from '../audio-analysis/AudioMetricsSummary';
import {
  useAudioAnalysis,
  type AudioBlobAnalyzer,
} from '../audio-analysis/useAudioAnalysis';
import {
  SpeechTextPanel,
  TextMetricsSummary,
  useSpeechRecognition,
} from '../speech-recognition';
import { useAudioRecorder, type RecorderStatus } from './useAudioRecorder';

export const INCREMENT_THREE_TARGET_TEXT =
  'Hoy camino con calma y confianza.';

const STATUS_MESSAGES: Readonly<Record<RecorderStatus, string>> = {
  idle: 'Listo para iniciar la prueba del micrófono.',
  requestingPermission: 'Solicitando acceso al micrófono…',
  recording: 'Grabando. Habla con naturalidad y detén la prueba cuando termines.',
  processing: 'Preparando la reproducción local…',
  recorded: 'La grabación está lista para reproducirse en este dispositivo.',
  error: 'La prueba no se completó. Revisa el mensaje y vuelve a intentarlo.',
};

function formatDuration(durationMs: number): string {
  return `${(durationMs / 1_000).toFixed(1)} s`;
}

interface AudioRecorderCardProps {
  readonly analyzeAudio?: AudioBlobAnalyzer;
  readonly browserRecognizer?: SpeechRecognizer;
  readonly demoRecognizer?: SpeechRecognizer;
}

export function AudioRecorderCard({
  analyzeAudio,
  browserRecognizer,
  demoRecognizer,
}: AudioRecorderCardProps) {
  const {
    activeMimeType,
    error,
    recordedAudio,
    reset: resetRecording,
    startRecording,
    status,
    stopRecording,
  } = useAudioRecorder();
  const {
    analyze,
    reset: resetAnalysis,
    state: analysisState,
  } = useAudioAnalysis(analyzeAudio);
  const recognition = useSpeechRecognition({
    browserRecognizer,
    demoRecognizer,
  });
  const [mode, setMode] = useState<SpeechRecognitionMode>('manual');
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [editableText, setEditableText] = useState('');
  const [automaticResultWasEdited, setAutomaticResultWasEdited] =
    useState(false);
  const [textAnalysisRequested, setTextAnalysisRequested] = useState(false);
  const [textValidationError, setTextValidationError] = useState<string | null>(
    null,
  );

  const recognitionIsActive =
    recognition.state.status === 'requesting' ||
    recognition.state.status === 'listening' ||
    recognition.state.status === 'processing';
  const recordingIsActive =
    status === 'requestingPermission' ||
    status === 'recording' ||
    status === 'processing';
  const interactionIsActive =
    recordingIsActive ||
    recognitionIsActive ||
    analysisState.status === 'analyzing';

  useEffect(() => {
    if (
      mode === 'browser' &&
      status === 'error' &&
      recognitionIsActive
    ) {
      recognition.cancel();
    }
  }, [mode, recognition, recognitionIsActive, status]);

  const displayedText =
    recognition.state.result !== null && !automaticResultWasEdited
      ? recognition.state.result.originalText
      : editableText;

  const speechText: SpeechTextResult | null = useMemo(() => {
    if (displayedText.trim() === '') {
      return null;
    }

    if (
      mode === 'manual' ||
      automaticResultWasEdited ||
      recognition.state.result === null
    ) {
      return createSpeechTextResult({
        originalText: displayedText,
        source: 'manual',
        languageRequested: null,
        isFinal: true,
      });
    }

    return recognition.state.result;
  }, [automaticResultWasEdited, displayedText, mode, recognition.state.result]);

  const textMetricsResult = useMemo(() => {
    if (speechText === null || !textAnalysisRequested) {
      return null;
    }

    const audioEvidence =
      recordedAudio !== null && analysisState.status === 'success'
        ? {
            totalDurationMs: analysisState.metrics.totalDurationMs,
            estimatedSpeechDurationMs:
              analysisState.metrics.estimatedSpeechDurationMs,
            minimumSpeechDurationMs:
              AUDIO_METRICS_V1_CONFIG.minimumSpeechDurationMs,
            qualityFlags: analysisState.metrics.qualityFlags,
          }
        : null;
    return calculateTextMetrics({
      targetText: INCREMENT_THREE_TARGET_TEXT,
      speechText,
      audioEvidence,
    });
  }, [analysisState, recordedAudio, speechText, textAnalysisRequested]);

  const startNewAttempt = () => {
    resetAnalysis();
    setTextAnalysisRequested(false);
    setTextValidationError(null);

    if (mode === 'demo') {
      resetRecording();
      recognition.reset();
      setEditableText('');
      setAutomaticResultWasEdited(false);
      recognition.start('demo');
      return;
    }

    if (mode === 'browser') {
      recognition.reset();
      setEditableText('');
      setAutomaticResultWasEdited(false);
      const recordingPromise = startRecording();
      recognition.start('browser');
      void recordingPromise;
      return;
    }

    void startRecording();
  };

  const stopAttempt = () => {
    stopRecording();
    recognition.stop();
  };

  const discardAttempt = () => {
    recognition.reset();
    resetAnalysis();
    resetRecording();
    setEditableText('');
    setAutomaticResultWasEdited(false);
    setConsentAccepted(false);
    setTextAnalysisRequested(false);
    setTextValidationError(null);
  };

  const handleModeChange = (nextMode: SpeechRecognitionMode) => {
    setEditableText(displayedText);
    recognition.reset();
    setMode(nextMode);
    setAutomaticResultWasEdited(false);
    setTextAnalysisRequested(false);
    setTextValidationError(null);
  };

  const handleTextChange = (text: string) => {
    setEditableText(text);
    setTextAnalysisRequested(false);
    setTextValidationError(null);
    if (mode !== 'manual') {
      setAutomaticResultWasEdited(true);
    }
  };

  const analyzeText = () => {
    if (speechText === null) {
      setTextAnalysisRequested(false);
      setTextValidationError(
        mode === 'demo'
          ? 'El resultado demo no contiene un texto final válido. Reinicia la demostración o cambia a entrada manual.'
          : mode === 'browser'
            ? 'Aún no existe un texto final. Espera el resultado o cambia a entrada manual.'
            : 'Escribe el texto del intento antes de analizarlo.',
      );
      return;
    }

    setTextValidationError(null);
    setTextAnalysisRequested(true);
  };

  const startIsDisabled =
    interactionIsActive ||
    (mode === 'browser' &&
      (!recognition.browserIsSupported || !consentAccepted));
  const startLabel =
    mode === 'demo'
      ? recognition.state.status === 'completed' ||
        recognition.state.status === 'error' ||
        recognition.state.status === 'cancelled'
        ? 'Reintentar demostración'
        : 'Iniciar demostración'
      : status === 'recorded' || status === 'error'
        ? 'Intentar de nuevo'
        : 'Iniciar prueba';

  return (
    <section
      aria-labelledby="recording-test-title"
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold tracking-wide text-rimay-700 uppercase">
            Prueba técnica local
          </p>
          <h2
            id="recording-test-title"
            className="mt-1 text-2xl font-bold text-slate-950"
          >
            Graba, aporta texto y revisa métricas
          </h2>
        </div>
        <span className="inline-flex min-h-11 items-center self-start rounded-full bg-rimay-50 px-4 text-sm font-semibold text-rimay-900">
          Audio solo en memoria
        </span>
      </div>

      <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700">
        Antes de comenzar, verifica que el micrófono correcto esté conectado. El
        navegador solicita permiso sólo al iniciar una captura. Rimay no envía ni
        guarda la grabación y la descarta al recargar la página.
      </p>

      <SpeechTextPanel
        automaticResultWasEdited={automaticResultWasEdited}
        browserIsSupported={recognition.browserIsSupported}
        consentAccepted={consentAccepted}
        disabled={interactionIsActive}
        editableText={displayedText}
        effectiveSource={speechText?.source ?? null}
        mode={mode}
        onConsentChange={setConsentAccepted}
        onModeChange={handleModeChange}
        onTextChange={handleTextChange}
        recognitionState={recognition.state}
        targetText={INCREMENT_THREE_TARGET_TEXT}
      />

      <div
        aria-atomic="true"
        aria-live="polite"
        className="mt-5 rounded-2xl bg-slate-100 px-4 py-3 text-slate-800"
        role="status"
      >
        <span className="font-semibold">Estado del audio: </span>
        {mode === 'demo'
          ? 'La demostración no solicita ni analiza audio.'
          : STATUS_MESSAGES[status]}
        {activeMimeType !== null && (
          <span className="mt-1 block text-sm">Formato: {activeMimeType}</span>
        )}
      </div>

      {error !== null && (
        <div
          aria-atomic="true"
          className="mt-4 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-red-950"
          role="alert"
        >
          <p className="font-semibold">No pudimos completar la grabación.</p>
          <p className="mt-1">{error.message}</p>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          className="min-h-11 rounded-xl bg-rimay-700 px-5 py-3 font-semibold text-white transition hover:bg-rimay-900 disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={startIsDisabled}
          onClick={startNewAttempt}
          type="button"
        >
          {startLabel}
        </button>
        <button
          className="min-h-11 rounded-xl border-2 border-rimay-700 bg-white px-5 py-3 font-semibold text-rimay-900 transition hover:bg-rimay-50 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400"
          disabled={status !== 'recording' && !recognitionIsActive}
          onClick={stopAttempt}
          type="button"
        >
          {mode === 'browser'
            ? 'Detener grabación y reconocimiento'
            : 'Detener grabación'}
        </button>
        <button
          className="min-h-11 rounded-xl border-2 border-emerald-700 bg-white px-5 py-3 font-semibold text-emerald-900 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400"
          disabled={interactionIsActive}
          onClick={analyzeText}
          type="button"
        >
          {textAnalysisRequested ? 'Actualizar análisis textual' : 'Analizar texto'}
        </button>
      </div>

      {textValidationError !== null && (
        <div
          aria-atomic="true"
          className="mt-4 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-red-950"
          role="alert"
        >
          <p className="font-semibold">No pudimos analizar el texto.</p>
          <p className="mt-1">{textValidationError}</p>
        </div>
      )}

      {textMetricsResult?.status === 'success' && (
        <TextMetricsSummary metrics={textMetricsResult.metrics} />
      )}

      {recordedAudio !== null && (
        <div className="mt-6 rounded-2xl border border-rimay-100 bg-rimay-50 p-4">
          <h3 className="font-semibold text-rimay-900">Reproducción local</h3>
          <p className="mt-1 text-sm text-slate-700">
            Duración capturada: {formatDuration(recordedAudio.durationMs)}. Nada se
            cargó a un servidor.
          </p>
          <audio
            aria-label="Reproducir la grabación local"
            className="mt-4 w-full"
            controls
            preload="metadata"
            src={recordedAudio.url}
          >
            Tu navegador no puede reproducir este audio.
          </audio>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              className="min-h-11 rounded-xl bg-sky-800 px-5 py-3 font-semibold text-white transition hover:bg-sky-950 disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={analysisState.status === 'analyzing'}
              onClick={() => void analyze(recordedAudio.blob)}
              type="button"
            >
              {analysisState.status === 'analyzing'
                ? 'Analizando grabación…'
                : analysisState.status === 'idle'
                  ? 'Analizar grabación'
                  : 'Analizar nuevamente'}
            </button>
            <button
              className="min-h-11 rounded-xl px-4 py-2 font-semibold text-rimay-900 underline decoration-2 underline-offset-4 hover:bg-rimay-100"
              onClick={discardAttempt}
              type="button"
            >
              Descartar y grabar de nuevo
            </button>
          </div>

          <div
            aria-atomic="true"
            aria-live="polite"
            className="mt-4 text-sm font-semibold text-slate-800"
          >
            {analysisState.status === 'idle' &&
              'La grabación todavía no ha sido analizada.'}
            {analysisState.status === 'analyzing' &&
              'Procesando el audio localmente…'}
            {analysisState.status === 'success' &&
              'El análisis técnico terminó.'}
            {analysisState.status === 'error' &&
              'El análisis no se completó. La grabación sigue disponible.'}
          </div>

          {analysisState.status === 'error' && (
            <div
              aria-atomic="true"
              className="mt-4 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-red-950"
              role="alert"
            >
              <p className="font-semibold">No pudimos analizar la grabación.</p>
              <p className="mt-1">{analysisState.error.message}</p>
            </div>
          )}

          {analysisState.status === 'success' && (
            <AudioMetricsSummary
              hasUsableText={speechText !== null}
              metrics={analysisState.metrics}
            />
          )}
        </div>
      )}

      {recordedAudio === null && speechText !== null && !interactionIsActive && (
        <button
          className="mt-5 min-h-11 rounded-xl px-4 py-2 font-semibold text-rimay-900 underline decoration-2 underline-offset-4 hover:bg-rimay-50"
          onClick={discardAttempt}
          type="button"
        >
          Descartar texto e iniciar de nuevo
        </button>
      )}

      <p className="mt-6 text-sm leading-6 text-slate-600">
        Límites de la captura: 60 segundos o 10 MB. Sólo se puede realizar una
        grabación y una sesión de reconocimiento a la vez.
      </p>
    </section>
  );
}

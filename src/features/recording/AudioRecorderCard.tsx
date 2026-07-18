import { useAudioRecorder, type RecorderStatus } from './useAudioRecorder';

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

export function AudioRecorderCard() {
  const {
    activeMimeType,
    error,
    recordedAudio,
    reset,
    startRecording,
    status,
    stopRecording,
  } = useAudioRecorder();

  const recordingIsActive =
    status === 'requestingPermission' ||
    status === 'recording' ||
    status === 'processing';

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
            Graba y escucha una frase
          </h2>
        </div>
        <span className="inline-flex min-h-11 items-center self-start rounded-full bg-rimay-50 px-4 text-sm font-semibold text-rimay-900">
          Audio solo en memoria
        </span>
      </div>

      <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700">
        Antes de comenzar, verifica que el micrófono correcto esté conectado. El
        navegador solicitará permiso únicamente cuando pulses “Iniciar prueba”. La
        grabación no se envía ni se guarda y se descarta al recargar la página.
      </p>

      <div
        aria-atomic="true"
        aria-live="polite"
        className="mt-5 rounded-2xl bg-slate-100 px-4 py-3 text-slate-800"
        role="status"
      >
        <span className="font-semibold">Estado: </span>
        {STATUS_MESSAGES[status]}
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
          disabled={recordingIsActive}
          onClick={() => void startRecording()}
          type="button"
        >
          {status === 'recorded' || status === 'error'
            ? 'Intentar de nuevo'
            : 'Iniciar prueba'}
        </button>
        <button
          className="min-h-11 rounded-xl border-2 border-rimay-700 bg-white px-5 py-3 font-semibold text-rimay-900 transition hover:bg-rimay-50 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400"
          disabled={status !== 'recording'}
          onClick={stopRecording}
          type="button"
        >
          Detener grabación
        </button>
      </div>

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
          <button
            className="mt-4 min-h-11 rounded-xl px-4 py-2 font-semibold text-rimay-900 underline decoration-2 underline-offset-4 hover:bg-rimay-100"
            onClick={reset}
            type="button"
          >
            Descartar grabación
          </button>
        </div>
      )}

      <p className="mt-6 text-sm leading-6 text-slate-600">
        Límites de esta prueba: 60 segundos o 10 MB. Solo se puede realizar una
        grabación a la vez.
      </p>
    </section>
  );
}

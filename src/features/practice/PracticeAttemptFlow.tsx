import { useEffect, useRef } from 'react';

import {
  INITIAL_EXERCISE_SEQUENCE,
  getInitialSequencePosition,
} from '../../domain/exercises';
import { AudioMetricsSummary } from '../audio-analysis/AudioMetricsSummary';
import { TextMetricsSummary } from '../speech-recognition';
import {
  useSpeechOutput,
  type BrowserSpeechOutput,
  type SpeechOutputController,
} from '../speech-output';
import { CoachFeedback } from './CoachFeedback';
import { ExerciseInstruction } from './ExerciseInstruction';
import {
  usePracticeAttempt,
  type PracticeAttemptController,
  type UsePracticeAttemptOptions,
} from './usePracticeAttempt';

interface PracticeAttemptFlowProps extends UsePracticeAttemptOptions {
  readonly speechOutput?: BrowserSpeechOutput | undefined;
}

const MODE_LABELS = {
  browser: 'Reconocimiento del navegador',
  manual: 'Entrada manual',
  demo: 'Demostración con datos simulados',
} as const;

const FLOW_STATUS_MESSAGES = {
  instruction: 'Lee la instrucción y comienza cuando estés listo.',
  privacy_choice: 'Elige cómo realizar este intento.',
  requesting_permission: 'Solicitando acceso al micrófono…',
  recording: 'Grabación en curso.',
  recorded: 'La grabación terminó; esperando un resultado final de texto.',
  awaiting_text: 'La grabación se conserva mientras eliges cómo continuar.',
  ready_to_analyze: 'El intento está listo para analizarse.',
  analyzing: 'Analizando localmente el intento…',
  decision_ready: 'La devolución del intento está lista.',
  recoverable_error: 'El recorrido necesita una acción para continuar.',
  selection_preview: 'Vista previa del siguiente ejercicio.',
} as const;

export function PracticeAttemptFlow(props: PracticeAttemptFlowProps) {
  const { speechOutput, ...practiceOptions } = props;
  const speech = useSpeechOutput({ output: speechOutput });
  const controller = usePracticeAttempt({
    ...practiceOptions,
    stopSpeech: speech.stop,
  });
  const feedbackFocusRef = useRef<HTMLDivElement>(null);
  const errorFocusRef = useRef<HTMLDivElement>(null);
  const previewFocusRef = useRef<HTMLDivElement>(null);
  const previousStatusRef = useRef(controller.state.status);

  useEffect(() => {
    if (previousStatusRef.current === controller.state.status) {
      return;
    }
    previousStatusRef.current = controller.state.status;

    if (controller.state.status === 'decision_ready') {
      feedbackFocusRef.current?.focus();
    } else if (controller.state.status === 'recoverable_error') {
      errorFocusRef.current?.focus();
    } else if (controller.state.status === 'selection_preview') {
      previewFocusRef.current?.focus();
    }
  }, [controller.state.status]);

  return (
    <section aria-labelledby="practice-flow-title">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-wide text-rimay-700 uppercase">
              Práctica guiada local
            </p>
            <h2
              className="mt-1 text-2xl font-bold text-slate-950"
              id="practice-flow-title"
            >
              Un intento de una palabra
            </h2>
          </div>
          <span className="inline-flex min-h-11 items-center self-start rounded-full bg-rimay-50 px-4 text-sm font-semibold text-rimay-900">
            Audio sólo en memoria
          </span>
        </div>

        <p className="mt-4 max-w-3xl leading-7 text-slate-700">
          Rimay no envía ni guarda la grabación. El audio real permanece sólo en
          memoria durante este intento y se descarta al reiniciar, continuar o
          cerrar la página.
        </p>
        <p className="mt-2 text-sm font-semibold text-slate-600">
          Catálogo local ficticio del MVP; no contiene datos clínicos.
        </p>

        <div
          aria-atomic="true"
          aria-live="polite"
          className="mt-5 rounded-2xl bg-slate-100 px-4 py-3 text-slate-800"
          role="status"
        >
          <span className="font-semibold">Estado: </span>
          {FLOW_STATUS_MESSAGES[controller.state.status]}
        </div>

        <FlowBody controller={controller} speech={speech} />
      </div>

      {controller.state.status === 'decision_ready' && (
        <div className="mt-8" ref={feedbackFocusRef} tabIndex={-1}>
          <CoachFeedback
            onContinue={controller.continueToPreview}
            onRepeat={controller.repeatAttempt}
            speech={speech}
            state={controller.state}
          />
          <TechnicalResults controller={controller} />
        </div>
      )}

      {controller.state.status === 'recoverable_error' && (
        <div
          aria-labelledby="practice-error-title"
          className="mt-8 rounded-3xl border border-red-300 bg-red-50 p-6 text-red-950 shadow-sm sm:p-8"
          ref={errorFocusRef}
          role="alert"
          tabIndex={-1}
        >
          <h2 className="text-2xl font-bold" id="practice-error-title">
            No pudimos completar este paso
          </h2>
          <p className="mt-3 leading-7">{controller.state.error.message}</p>
          {controller.state.playbackAvailable && (
            <Playback controller={controller} />
          )}
          <div className="mt-5 flex flex-wrap gap-3">
            {(controller.state.error.kind === 'audio_analysis' ||
              controller.state.error.kind === 'coaching') && (
              <button
                className="min-h-11 rounded-xl border-2 border-rimay-700 bg-white px-5 py-3 font-semibold text-rimay-900 hover:bg-rimay-50"
                onClick={controller.retryAnalysis}
                type="button"
              >
                Preparar reanálisis
              </button>
            )}
            {controller.state.playbackAvailable && (
              <button
                className="min-h-11 rounded-xl border-2 border-violet-700 bg-white px-5 py-3 font-semibold text-violet-950 hover:bg-violet-50"
                onClick={controller.editText}
                type="button"
              >
                Corregir el texto
              </button>
            )}
            <button
              className="min-h-11 rounded-xl bg-rimay-700 px-5 py-3 font-semibold text-white hover:bg-rimay-900"
              onClick={controller.discardAttempt}
              type="button"
            >
              Reiniciar intento
            </button>
          </div>
        </div>
      )}

      {controller.state.status === 'selection_preview' && (
        <section
          aria-labelledby="selection-preview-title"
          className="mt-8 rounded-3xl border border-sky-300 bg-sky-50 p-6 shadow-sm sm:p-8"
          ref={previewFocusRef}
          tabIndex={-1}
        >
          <p className="text-sm font-semibold tracking-wide text-sky-900 uppercase">
            Vista previa; todavía no está activo
          </p>
          <h2
            className="mt-1 text-2xl font-bold text-slate-950"
            id="selection-preview-title"
          >
            Siguiente ejercicio
          </h2>
          <div className="mt-5">
            <ExerciseInstruction
              exercise={controller.state.selectedExercise}
              position={
                getInitialSequencePosition(
                  controller.state.selectedExercise.id,
                ) ?? 1
              }
              speech={speech}
              total={INITIAL_EXERCISE_SEQUENCE.length}
            />
          </div>
          <p className="mt-5 text-sm font-semibold leading-6 text-sky-950">
            Esta vista previa no inicia otra grabación, no crea un segundo
            intento y no vuelve a ejecutar las reglas.
          </p>
        </section>
      )}
    </section>
  );
}

function FlowBody({
  controller,
  speech,
}: {
  readonly controller: PracticeAttemptController;
  readonly speech: SpeechOutputController;
}) {
  const { state } = controller;

  if (state.status === 'instruction') {
    return (
      <div className="mt-6">
        <ExerciseInstruction
          exercise={state.currentExercise}
          position={getInitialSequencePosition(state.currentExercise.id) ?? 1}
          speech={speech}
          total={INITIAL_EXERCISE_SEQUENCE.length}
        />
        <button
          className="mt-6 min-h-11 rounded-xl bg-rimay-700 px-5 py-3 font-semibold text-white hover:bg-rimay-900"
          onClick={() => controller.chooseMode('manual')}
          type="button"
        >
          Preparar intento
        </button>
      </div>
    );
  }

  if (state.status === 'privacy_choice') {
    return (
      <div className="mt-6">
        <fieldset>
          <legend className="text-lg font-bold text-slate-950">
            Elige cómo realizar el intento
          </legend>
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            <ModeOption
              checked={state.mode === 'manual'}
              description="Graba audio real y escribe lo que pronunciaste."
              label="Entrada manual"
              onChange={() => controller.chooseMode('manual')}
            />
            <ModeOption
              checked={state.mode === 'browser'}
              description={
                controller.browserRecognitionIsSupported
                  ? 'Graba audio real y solicita texto al navegador.'
                  : 'No disponible en este navegador.'
              }
              disabled={!controller.browserRecognitionIsSupported}
              label="Reconocimiento del navegador"
              onChange={() => controller.chooseMode('browser')}
            />
            <ModeOption
              checked={state.mode === 'demo'}
              description="Carga datos locales predefinidos sin usar su voz."
              label="Demostración"
              onChange={() => controller.chooseMode('demo')}
            />
          </div>
        </fieldset>

        {state.mode === 'browser' && (
          <div className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950">
            <h3 className="font-bold">Aviso de privacidad del navegador</h3>
            <p className="mt-2 text-sm leading-6">
              Rimay no recibe, envía ni almacena el Blob de la grabación. La
              capacidad SpeechRecognition escucha por separado y algunos
              navegadores pueden enviar audio a un servicio remoto propio. Rimay
              no controla ese servicio ni puede prometer reconocimiento local u
              offline. La entrada manual evita el reconocimiento automático.
            </p>
            <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-3 font-semibold">
              <input
                checked={controller.consentAccepted}
                className="h-5 w-5 accent-amber-900"
                onChange={(event) =>
                  controller.setConsentAccepted(event.target.checked)
                }
                type="checkbox"
              />
              Entiendo el aviso y quiero usar el reconocimiento del navegador.
            </label>
          </div>
        )}

        {state.mode === 'manual' && (
          <p className="mt-5 rounded-2xl border border-violet-200 bg-violet-50 p-4 text-sm font-semibold leading-6 text-violet-950">
            Después de grabar, escribirás el texto. Rimay no verificará que el
            texto manual corresponda al audio.
          </p>
        )}

        {state.mode === 'demo' && <DemoNotices />}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            className="min-h-11 rounded-xl bg-rimay-700 px-5 py-3 font-semibold text-white hover:bg-rimay-900 disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={state.mode === 'browser' && !controller.consentAccepted}
            onClick={controller.startAttempt}
            type="button"
          >
            {state.mode === 'demo' ? 'Cargar datos simulados' : 'Iniciar grabación'}
          </button>
          <button
            className="min-h-11 rounded-xl px-4 py-2 font-semibold text-rimay-900 underline decoration-2 underline-offset-4 hover:bg-rimay-50"
            onClick={controller.discardAttempt}
            type="button"
          >
            Volver a la instrucción
          </button>
        </div>
      </div>
    );
  }

  if (state.status === 'requesting_permission') {
    return (
      <div className="mt-6">
        <p className="leading-7 text-slate-700">
          Responde a la solicitud del navegador. La grabación no comenzará sin
          permiso.
        </p>
        <DiscardButton controller={controller} />
      </div>
    );
  }

  if (state.status === 'recording') {
    return (
      <div className="mt-6">
        <p className="text-lg font-semibold text-slate-950">
          Pronuncia: “{state.currentExercise.targetText}”
        </p>
        {state.mode === 'browser' &&
          controller.recognitionState.interimText !== '' && (
            <p className="mt-3 rounded-xl bg-violet-50 px-4 py-3 text-slate-800">
              <span className="font-semibold">Texto provisional: </span>
              {controller.recognitionState.interimText}
            </p>
          )}
        <button
          className="mt-5 min-h-11 rounded-xl bg-red-800 px-5 py-3 font-semibold text-white hover:bg-red-950"
          onClick={controller.stopRecording}
          type="button"
        >
          {state.mode === 'browser'
            ? 'Detener grabación y reconocimiento'
            : 'Detener grabación'}
        </button>
      </div>
    );
  }

  if (state.status === 'recorded') {
    return (
      <div className="mt-6">
        <Playback controller={controller} />
        <p className="mt-4 leading-7 text-slate-700">
          Esperando únicamente el texto final. El resultado provisional no se
          usará para analizar el intento.
        </p>
        {controller.recognitionState.interimText !== '' && (
          <p className="mt-3 rounded-xl bg-violet-50 px-4 py-3 text-slate-800">
            <span className="font-semibold">Texto provisional: </span>
            {controller.recognitionState.interimText}
          </p>
        )}
      </div>
    );
  }

  if (state.status === 'awaiting_text') {
    return (
      <div className="mt-6">
        <Playback controller={controller} />
        {state.recognitionError !== null && (
          <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950">
            <p className="font-bold">No se obtuvo texto final automático.</p>
            <p className="mt-1 text-sm leading-6">
              {state.recognitionError.message}
            </p>
          </div>
        )}

        {state.mode === 'browser' ? (
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              className="min-h-11 rounded-xl bg-violet-800 px-5 py-3 font-semibold text-white hover:bg-violet-950"
              onClick={controller.switchToManual}
              type="button"
            >
              Cambiar a entrada manual
            </button>
            <button
              className="min-h-11 rounded-xl border-2 border-rimay-700 bg-white px-5 py-3 font-semibold text-rimay-900 hover:bg-rimay-50"
              onClick={controller.continueWithoutText}
              type="button"
            >
              Continuar sin texto
            </button>
          </div>
        ) : (
          <ManualTextForm controller={controller} />
        )}
      </div>
    );
  }

  if (state.status === 'ready_to_analyze') {
    return (
      <div className="mt-6">
        {state.mode === 'demo' ? <DemoNotices /> : <Playback controller={controller} />}
        <AttemptTextSummary controller={controller} />
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            className="min-h-11 rounded-xl bg-rimay-700 px-5 py-3 font-semibold text-white hover:bg-rimay-900"
            onClick={() => void controller.analyzeAttempt()}
            type="button"
          >
            Analizar intento
          </button>
          {state.speechText !== null && state.mode !== 'demo' && (
            <button
              className="min-h-11 rounded-xl border-2 border-violet-700 bg-white px-5 py-3 font-semibold text-violet-950 hover:bg-violet-50"
              onClick={controller.editText}
              type="button"
            >
              Editar texto antes de analizar
            </button>
          )}
          <DiscardButton controller={controller} />
        </div>
      </div>
    );
  }

  if (state.status === 'analyzing') {
    return (
      <div className="mt-6" aria-live="polite">
        <p className="font-semibold text-slate-950">
          Calculando métricas y ejecutando las reglas una sola vez…
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Se conserva el mismo identificador del intento mientras termina el
          análisis.
        </p>
        <DiscardButton controller={controller} />
      </div>
    );
  }

  return null;
}

function ManualTextForm({
  controller,
}: {
  readonly controller: PracticeAttemptController;
}) {
  return (
    <div className="mt-5">
      <p className="rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm font-semibold leading-6 text-violet-950">
        El texto será proporcionado por el usuario. Rimay no verificará que
        corresponda a la grabación.
      </p>
      <label className="mt-4 block font-bold text-slate-950" htmlFor="manual-attempt-text">
        Escribe lo que intentaste pronunciar
      </label>
      <textarea
        aria-describedby={
          controller.manualInputError === null ? undefined : 'manual-text-error'
        }
        className="mt-2 min-h-32 w-full rounded-xl border border-slate-400 bg-white px-4 py-3 text-slate-950 focus:border-violet-800 focus:outline-none focus:ring-2 focus:ring-violet-300"
        id="manual-attempt-text"
        onChange={(event) => controller.setManualText(event.target.value)}
        value={controller.manualText}
      />
      {controller.manualInputError !== null && (
        <p className="mt-2 font-semibold text-red-800" id="manual-text-error" role="alert">
          {controller.manualInputError.message}
        </p>
      )}
      <button
        className="mt-4 min-h-11 rounded-xl bg-violet-800 px-5 py-3 font-semibold text-white hover:bg-violet-950"
        onClick={controller.confirmManualText}
        type="button"
      >
        Confirmar texto manual
      </button>
    </div>
  );
}

function AttemptTextSummary({
  controller,
}: {
  readonly controller: PracticeAttemptController;
}) {
  const state = controller.state;
  if (state.status !== 'ready_to_analyze') {
    return null;
  }

  return (
    <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="font-bold text-slate-950">Texto final del intento</p>
      {state.speechText === null ? (
        <p className="mt-1 text-slate-700">
          No disponible por elección explícita. Las métricas textuales serán null.
        </p>
      ) : (
        <>
          <p className="mt-1 text-lg text-slate-950">
            “{state.speechText.originalText}”
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            Procedencia: {MODE_LABELS[state.speechText.source]}.
          </p>
          {state.speechText.source === 'manual' && (
            <p className="mt-2 text-sm text-violet-950">
              Rimay no verificó este texto contra la grabación.
            </p>
          )}
        </>
      )}
    </div>
  );
}

function TechnicalResults({
  controller,
}: {
  readonly controller: PracticeAttemptController;
}) {
  const state = controller.state;
  if (state.status !== 'decision_ready') {
    return null;
  }

  return (
    <section aria-labelledby="technical-results-title" className="mt-8">
      <h2 className="text-2xl font-bold text-slate-950" id="technical-results-title">
        Resultados técnicos del intento
      </h2>
      {state.mode === 'demo' && (
        <p className="mt-3 rounded-xl border border-sky-300 bg-sky-50 p-4 font-semibold leading-6 text-sky-950">
          Las métricas acústicas siguientes pertenecen a un fixture simulado; no
          son mediciones de su voz.
        </p>
      )}
      <AudioMetricsSummary
        hasUsableText={state.coachInput.textMetrics !== null}
        metrics={state.coachInput.audioMetrics}
        simulated={state.mode === 'demo'}
      />
      {state.coachInput.textMetrics !== null && (
        <TextMetricsSummary metrics={state.coachInput.textMetrics} />
      )}
      {state.mode !== 'demo' && <Playback controller={controller} />}
    </section>
  );
}

function Playback({
  controller,
}: {
  readonly controller: PracticeAttemptController;
}) {
  if (controller.recordedAudio === null) {
    return null;
  }

  return (
    <section
      aria-labelledby="practice-playback-title"
      className="mt-5 rounded-2xl border border-rimay-100 bg-rimay-50 p-4"
    >
      <h3 className="font-bold text-rimay-900" id="practice-playback-title">
        Reproducción local
      </h3>
      <p className="mt-1 text-sm leading-6 text-slate-700">
        Duración capturada: {(controller.recordedAudio.durationMs / 1_000).toFixed(1)} s.
        Nada se cargó a un servidor.
      </p>
      <audio
        aria-label="Reproducir la grabación local del intento"
        className="mt-3 w-full"
        controls
        preload="metadata"
        src={controller.recordedAudio.url}
      >
        Tu navegador no puede reproducir este audio.
      </audio>
    </section>
  );
}

function DemoNotices() {
  return (
    <div className="mt-5 rounded-2xl border border-sky-300 bg-sky-50 p-5 text-sky-950">
      <h3 className="font-bold">Demostración local</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm font-semibold leading-6">
        <li>Este recorrido utiliza datos simulados.</li>
        <li>No se grabó ni analizó su voz.</li>
        <li>El texto simulado no procede de audio.</li>
      </ul>
    </div>
  );
}

function DiscardButton({
  controller,
}: {
  readonly controller: PracticeAttemptController;
}) {
  return (
    <button
      className="mt-5 min-h-11 rounded-xl px-4 py-2 font-semibold text-rimay-900 underline decoration-2 underline-offset-4 hover:bg-rimay-50"
      onClick={controller.discardAttempt}
      type="button"
    >
      Descartar e iniciar de nuevo
    </button>
  );
}

interface ModeOptionProps {
  readonly checked: boolean;
  readonly description: string;
  readonly disabled?: boolean;
  readonly label: string;
  readonly onChange: () => void;
}

function ModeOption({
  checked,
  description,
  disabled = false,
  label,
  onChange,
}: ModeOptionProps) {
  return (
    <label
      className={`flex min-h-24 items-start gap-3 rounded-xl border bg-white p-4 ${
        checked ? 'border-rimay-700 ring-2 ring-rimay-100' : 'border-slate-300'
      } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
    >
      <input
        checked={checked}
        className="mt-1 h-5 w-5 shrink-0 accent-rimay-700"
        disabled={disabled}
        name="practice-mode"
        onChange={onChange}
        type="radio"
      />
      <span>
        <span className="block font-bold text-slate-950">{label}</span>
        <span className="mt-1 block text-sm leading-5 text-slate-600">
          {description}
        </span>
      </span>
    </label>
  );
}

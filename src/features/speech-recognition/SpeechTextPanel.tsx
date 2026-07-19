import { MAX_MANUAL_TEXT_LENGTH } from '../../config/speechRecognition';
import type {
  SpeechRecognitionErrorCode,
  SpeechRecognitionMode,
  SpeechTextSource,
} from '../../domain/contracts';
import type { SpeechRecognitionState } from './useSpeechRecognition';

const ERROR_MESSAGES: Readonly<Record<SpeechRecognitionErrorCode, string>> = {
  unsupported:
    'Este navegador no ofrece reconocimiento de voz compatible. Usa la entrada manual.',
  permission_denied:
    'El navegador no permitió usar el micrófono para reconocimiento. La grabación, si existe, sigue disponible; también puedes escribir el texto.',
  audio_capture_failed:
    'El navegador no pudo capturar audio para reconocimiento. Revisa el micrófono o usa la entrada manual.',
  network_failed:
    'El servicio de reconocimiento del navegador no respondió. Puedes continuar con entrada manual.',
  no_speech:
    'No se obtuvo texto final. Puedes volver a intentarlo o escribir lo que pronunciaste.',
  aborted:
    'El reconocimiento se canceló. Puedes continuar con entrada manual.',
  language_not_supported:
    'El navegador no admite el idioma español solicitado. No se cambió el idioma automáticamente; usa la entrada manual.',
  service_not_allowed:
    'La política del navegador bloqueó su servicio de reconocimiento. Usa la entrada manual.',
  unknown:
    'El reconocimiento del navegador no se completó. La entrada manual sigue disponible.',
};

const SOURCE_LABELS: Readonly<Record<SpeechTextSource, string>> = {
  browser: 'Reconocimiento del navegador',
  demo: 'Fixture demo predefinido',
  manual: 'Entrada manual',
};

const MODE_LABELS: Readonly<Record<SpeechRecognitionMode, string>> = {
  browser: 'Reconocimiento del navegador',
  demo: 'Demostración',
  manual: 'Entrada manual',
};

const STATUS_MESSAGES: Readonly<Record<SpeechRecognitionState['status'], string>> = {
  idle: 'Aún no hay reconocimiento en curso.',
  requesting: 'Preparando el reconocimiento…',
  listening: 'Escuchando desde la capacidad del navegador…',
  processing: 'Esperando el resultado final…',
  completed: 'Hay un texto final disponible.',
  unsupported: 'Reconocimiento automático no disponible.',
  cancelled: 'Reconocimiento cancelado.',
  error: 'El reconocimiento no se completó.',
};

interface SpeechTextPanelProps {
  readonly automaticResultWasEdited: boolean;
  readonly browserIsSupported: boolean;
  readonly consentAccepted: boolean;
  readonly disabled: boolean;
  readonly editableText: string;
  readonly effectiveSource: SpeechTextSource | null;
  readonly mode: SpeechRecognitionMode;
  readonly onConsentChange: (accepted: boolean) => void;
  readonly onModeChange: (mode: SpeechRecognitionMode) => void;
  readonly onTextChange: (text: string) => void;
  readonly recognitionState: SpeechRecognitionState;
  readonly targetText: string;
}

export function SpeechTextPanel({
  automaticResultWasEdited,
  browserIsSupported,
  consentAccepted,
  disabled,
  editableText,
  effectiveSource,
  mode,
  onConsentChange,
  onModeChange,
  onTextChange,
  recognitionState,
  targetText,
}: SpeechTextPanelProps) {
  const showRecognitionError =
    recognitionState.errorCode !== null &&
    recognitionState.status !== 'completed';

  return (
    <section
      aria-labelledby="speech-text-title"
      className="mt-6 rounded-2xl border border-violet-200 bg-violet-50 p-5"
    >
      <h3 id="speech-text-title" className="text-lg font-bold text-slate-950">
        Texto del intento
      </h3>
      <p className="mt-2 leading-6 text-slate-700">
        Frase temporal para esta prueba:{' '}
        <span className="font-semibold text-slate-950">“{targetText}”</span>
      </p>

      <fieldset className="mt-5" disabled={disabled}>
        <legend className="font-semibold text-slate-950">
          Elige cómo aportar el texto
        </legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <ModeOption
            checked={mode === 'manual'}
            description="Escribe lo que intentaste pronunciar."
            label="Entrada manual"
            onChange={() => onModeChange('manual')}
          />
          <ModeOption
            checked={mode === 'browser'}
            description={
              browserIsSupported
                ? 'Usa la capacidad opcional del navegador.'
                : 'No disponible en este navegador.'
            }
            label="Reconocimiento del navegador"
            onChange={() => onModeChange('browser')}
            unavailable={!browserIsSupported}
          />
          <ModeOption
            checked={mode === 'demo'}
            description="Usa siempre un texto predefinido."
            label="Demostración"
            onChange={() => onModeChange('demo')}
          />
        </div>
      </fieldset>

      {mode === 'browser' && (
        <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950">
          <p className="font-semibold">Aviso de privacidad del navegador</p>
          <p className="mt-2 text-sm leading-6">
            Rimay no recibe, envía ni almacena el Blob de la grabación. La
            capacidad SpeechRecognition escucha por separado y algunos
            navegadores pueden enviar audio a un servicio remoto propio. Rimay no
            controla la retención, ubicación, disponibilidad ni funcionamiento de
            ese servicio y no puede prometer reconocimiento local u offline. La
            entrada manual evita utilizar el reconocimiento automático.
          </p>
          <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-3 font-semibold">
            <input
              checked={consentAccepted}
              className="h-5 w-5 accent-violet-800"
              onChange={(event) => onConsentChange(event.target.checked)}
              type="checkbox"
            />
            Entiendo el aviso y quiero usar el reconocimiento del navegador.
          </label>
        </div>
      )}

      {mode === 'demo' && (
        <div className="mt-5 rounded-xl border border-sky-300 bg-sky-50 p-4 text-sky-950">
          <p className="font-semibold">Demostración sin análisis de voz</p>
          <p className="mt-1 text-sm leading-6">
            Esta ruta no solicita micrófono, no recibe audio y muestra un texto
            predefinido para comprobar la interfaz de forma determinista.
          </p>
        </div>
      )}

      <div aria-live="polite" className="mt-4 text-sm text-slate-700">
        <span className="font-semibold">Estado del texto: </span>
        {STATUS_MESSAGES[recognitionState.status]}
      </div>
      <p className="mt-2 text-sm font-semibold text-slate-700">
        Modo seleccionado: {MODE_LABELS[mode]}.
      </p>

      {mode === 'browser' && (
        <p className="mt-3 text-sm font-semibold text-amber-950">
          La transcripción automática puede contener errores.
        </p>
      )}

      {recognitionState.interimText !== '' && (
        <p className="mt-3 rounded-xl bg-white px-4 py-3 text-slate-800">
          <span className="font-semibold">Resultado provisional: </span>
          {recognitionState.interimText}
        </p>
      )}

      {showRecognitionError && recognitionState.errorCode !== null && (
        <div
          aria-atomic="true"
          className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-red-950"
          role="alert"
        >
          <p className="font-semibold">No se obtuvo texto automático.</p>
          <p className="mt-1 text-sm leading-6">
            {ERROR_MESSAGES[recognitionState.errorCode]}
          </p>
        </div>
      )}

      {(mode === 'manual' || effectiveSource === 'manual') && (
        <p
          className="mt-5 rounded-xl border border-violet-200 bg-white px-4 py-3 text-sm font-semibold leading-6 text-violet-950"
          id="manual-attempt-help"
        >
          Escribe exactamente las palabras que pronunciaste, incluidas omisiones
          o palabras adicionales. No copies automáticamente la frase objetivo.
        </p>
      )}

      <label className="mt-3 block font-semibold text-slate-950" htmlFor="attempt-text">
        {mode === 'manual'
          ? 'Escribe lo que intentaste pronunciar'
          : 'Texto final o corrección manual'}
      </label>
      <textarea
        className="mt-2 min-h-32 w-full rounded-xl border border-slate-400 bg-white px-4 py-3 text-slate-950 shadow-sm focus:border-violet-800 focus:outline-none focus:ring-2 focus:ring-violet-300"
        aria-describedby={
          mode === 'manual' || effectiveSource === 'manual'
            ? 'manual-attempt-help'
            : undefined
        }
        id="attempt-text"
        maxLength={MAX_MANUAL_TEXT_LENGTH}
        onChange={(event) => onTextChange(event.target.value)}
        placeholder="Escribe aquí el texto del intento."
        value={editableText}
      />
      <div className="mt-2 flex flex-col gap-1 text-sm text-slate-600 sm:flex-row sm:justify-between">
        <span>
          {effectiveSource === null
            ? 'Procedencia pendiente.'
            : `Procedencia: ${SOURCE_LABELS[effectiveSource]}.`}
          {automaticResultWasEdited &&
            ' Al editar un resultado automático, la procedencia cambia a manual.'}
        </span>
        <span>
          {editableText.length}/{MAX_MANUAL_TEXT_LENGTH}
        </span>
      </div>

      {effectiveSource === 'manual' && (
        <p className="mt-3 text-sm font-semibold text-violet-950">
          La entrada fue proporcionada manualmente.
        </p>
      )}
      {effectiveSource === 'demo' && (
        <p className="mt-3 text-sm font-semibold text-sky-950">
          Este resultado es una simulación.
        </p>
      )}

      {mode !== 'manual' && (
        <button
          className="mt-4 min-h-11 rounded-xl border-2 border-violet-800 bg-white px-4 py-2 font-semibold text-violet-950 hover:bg-violet-100"
          onClick={() => onModeChange('manual')}
          type="button"
        >
          Cambiar a entrada manual
        </button>
      )}
    </section>
  );
}

interface ModeOptionProps {
  readonly checked: boolean;
  readonly description: string;
  readonly label: string;
  readonly onChange: () => void;
  readonly unavailable?: boolean;
}

function ModeOption({
  checked,
  description,
  label,
  onChange,
  unavailable = false,
}: ModeOptionProps) {
  return (
    <label
      className={`flex min-h-20 cursor-pointer items-start gap-3 rounded-xl border bg-white p-3 ${
        checked ? 'border-violet-700 ring-2 ring-violet-200' : 'border-slate-300'
      } ${unavailable ? 'cursor-not-allowed opacity-60' : ''}`}
    >
      <input
        checked={checked}
        className="mt-1 h-5 w-5 shrink-0 accent-violet-800"
        disabled={unavailable}
        name="speech-text-mode"
        onChange={onChange}
        type="radio"
      />
      <span>
        <span className="block font-semibold text-slate-950">{label}</span>
        <span className="mt-1 block text-sm leading-5 text-slate-600">
          {description}
        </span>
      </span>
    </label>
  );
}

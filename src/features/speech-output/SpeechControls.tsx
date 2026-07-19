import type { SpeechOutputController } from './useSpeechOutput';

export type SpeechContentKind = 'instruction' | 'feedback';

interface SpeechControlsProps {
  readonly controller: SpeechOutputController;
  readonly kind: SpeechContentKind;
  readonly text: string;
}

const LABELS = {
  instruction: {
    listen: 'Escuchar instrucción',
    playing: 'Reproduciendo la instrucción.',
  },
  feedback: {
    listen: 'Escuchar devolución',
    playing: 'Reproduciendo la devolución.',
  },
} as const;

function statusMessage(
  controller: SpeechOutputController,
  kind: SpeechContentKind,
): string {
  switch (controller.state.status) {
    case 'unsupported':
      return 'La lectura por voz no está disponible en este navegador.';
    case 'loading_voices':
      return 'Buscando una voz en español. El texto permanece disponible.';
    case 'unavailable':
      return 'No hay una voz española disponible. Puedes continuar con el texto.';
    case 'ready':
      return `Voz española disponible: ${controller.state.selectedVoice.name}.`;
    case 'speaking':
      return LABELS[kind].playing;
    case 'stopped':
      return 'La voz está detenida.';
    case 'error':
      return controller.state.message;
  }
}

export function SpeechControls({
  controller,
  kind,
  text,
}: SpeechControlsProps) {
  const labels = LABELS[kind];
  const isSpeaking = controller.state.status === 'speaking';

  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap gap-3">
        {isSpeaking ? (
          <button
            className="min-h-11 rounded-xl border-2 border-red-800 bg-white px-5 py-3 font-semibold text-red-900 hover:bg-red-50"
            onClick={controller.stop}
            type="button"
          >
            Detener voz
          </button>
        ) : (
          <button
            className="min-h-11 rounded-xl bg-rimay-700 px-5 py-3 font-semibold text-white hover:bg-rimay-900 disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={!controller.isAvailable}
            onClick={() => void controller.speak(text)}
            type="button"
          >
            {labels.listen}
          </button>
        )}
      </div>
      <p
        aria-atomic="true"
        className="mt-3 text-sm font-semibold leading-6 text-slate-700"
        role="status"
      >
        {statusMessage(controller, kind)}
      </p>
      <p className="mt-1 text-xs leading-5 text-slate-600">
        La voz es gestionada por el navegador y algunas voces pueden usar su
        propia infraestructura. Rimay no realiza solicitudes propias para
        sintetizar este contenido ficticio.
      </p>
    </div>
  );
}

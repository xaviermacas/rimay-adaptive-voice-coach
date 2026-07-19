import type { DecisionReadyState } from './practiceAttemptState';
import { CoachEvidence } from './CoachEvidenceView';

interface CoachFeedbackProps {
  readonly onContinue: () => void;
  readonly onRepeat: () => void;
  readonly state: DecisionReadyState;
}

const FOCUS_LABELS = {
  repeat_calmly: 'Pronunciar con calma',
  steady_pace: 'Mantener un ritmo estable',
  follow_pause_cues: 'Seguir las pausas indicadas',
  clear_capture: 'Obtener una captura más clara',
  continue: 'Continuar la práctica',
  complete: 'Completar la sesión',
} as const;

const SOURCE_LABELS = {
  browser: 'Texto final reconocido por el navegador',
  manual: 'Texto introducido por el usuario',
  demo: 'Texto simulado predefinido',
} as const;

export function CoachFeedback({
  onContinue,
  onRepeat,
  state,
}: CoachFeedbackProps) {
  const { coachInput, coachResult } = state;
  const { decision } = coachResult;
  const sourceLabel =
    coachInput.textSource === null
      ? 'Sin texto final; no se calcularon métricas textuales'
      : SOURCE_LABELS[coachInput.textSource];

  return (
    <section
      aria-labelledby="coach-feedback-title"
      className="rounded-3xl border border-emerald-300 bg-emerald-50 p-6 shadow-sm sm:p-8"
    >
      <p className="text-sm font-semibold tracking-wide text-emerald-800 uppercase">
        Resultado del motor local
      </p>
      <h2
        className="mt-1 text-2xl font-bold text-slate-950"
        id="coach-feedback-title"
      >
        Devolución del intento
      </h2>

      <p className="mt-5 text-xl font-bold leading-8 text-emerald-950">
        {decision.shortFeedback}
      </p>
      <p className="mt-3 leading-7 text-slate-800">{decision.explanation}</p>

      <dl className="mt-5 grid gap-3 sm:grid-cols-2">
        <SummaryItem label="Foco" value={FOCUS_LABELS[decision.focus]} />
        <SummaryItem label="Procedencia textual" value={sourceLabel} />
        <SummaryItem
          label="Acción recomendada"
          value={
            decision.action === 'repeat_current'
              ? 'Repetir el intento actual'
              : 'Continuar al siguiente ejercicio'
          }
        />
        <SummaryItem label="Versión de reglas" value={decision.rulesVersion} />
      </dl>

      <CoachEvidence
        coachInput={coachInput}
        evidenceKeys={decision.evidenceKeys}
      />

      {coachInput.textSource === 'manual' && (
        <p className="mt-5 rounded-xl border border-violet-300 bg-violet-50 px-4 py-3 text-sm font-semibold leading-6 text-violet-950">
          El texto fue introducido por el usuario y no se verificó contra la
          grabación.
        </p>
      )}
      {coachInput.textSource === 'demo' && (
        <p className="mt-5 rounded-xl border border-sky-300 bg-sky-50 px-4 py-3 text-sm font-semibold leading-6 text-sky-950">
          La devolución se generó con datos simulados.
        </p>
      )}

      <p className="mt-5 border-t border-emerald-300 pt-4 text-sm font-semibold leading-6 text-emerald-950">
        Esta devolución utiliza reglas técnicas no clínicamente validadas y no
        constituye diagnóstico ni recomendación terapéutica.
      </p>

      <div className="mt-6">
        {decision.action === 'repeat_current' && (
          <button
            className="min-h-11 rounded-xl bg-rimay-700 px-5 py-3 font-semibold text-white hover:bg-rimay-900"
            onClick={onRepeat}
            type="button"
          >
            Repetir este intento
          </button>
        )}
        {decision.action === 'continue' && (
          <button
            className="min-h-11 rounded-xl bg-rimay-700 px-5 py-3 font-semibold text-white hover:bg-rimay-900"
            onClick={onContinue}
            type="button"
          >
            Continuar
          </button>
        )}
      </div>
    </section>
  );
}

interface SummaryItemProps {
  readonly label: string;
  readonly value: string;
}

function SummaryItem({ label, value }: SummaryItemProps) {
  return (
    <div className="rounded-xl bg-white px-4 py-3 shadow-sm">
      <dt className="text-sm font-semibold text-slate-600">{label}</dt>
      <dd className="mt-1 font-bold text-slate-950">{value}</dd>
    </div>
  );
}

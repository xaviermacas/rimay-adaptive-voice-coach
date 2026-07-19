import type { CoachInput, MetricEvidenceKey } from '../../domain/coaching';
import { resolveCoachEvidence } from './coachEvidence';

interface CoachEvidenceProps {
  readonly coachInput: CoachInput;
  readonly evidenceKeys: readonly MetricEvidenceKey[];
}

const SOURCE_LABELS = {
  audio: 'Captura de audio',
  text: 'Comparación textual',
  attempt: 'Estado del intento',
  exercise: 'Ejercicio',
} as const;

export function CoachEvidence({
  coachInput,
  evidenceKeys,
}: CoachEvidenceProps) {
  const evidence = resolveCoachEvidence(coachInput, evidenceKeys);

  return (
    <section aria-labelledby="coach-evidence-title" className="mt-6">
      <h3 id="coach-evidence-title" className="text-lg font-bold text-slate-950">
        Evidencia utilizada
      </h3>
      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        {evidence.map((item) => (
          <div
            className="rounded-xl border border-slate-200 bg-white px-4 py-3"
            key={item.key}
          >
            <dt className="text-sm font-semibold text-slate-600">
              {item.label}
            </dt>
            <dd className="mt-1 font-bold text-slate-950">
              {item.value}
              {item.unit === null ? '' : ` ${item.unit}`}
            </dd>
            <dd className="mt-1 text-xs font-semibold text-slate-500">
              Fuente: {SOURCE_LABELS[item.source]}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

import type { ExerciseType } from '../../domain/contracts';
import { deriveSessionCoverage, type PracticeSessionState } from './practiceSessionState';

interface SessionProgressProps {
  readonly state: Exclude<PracticeSessionState, { readonly status: 'completed' }>;
}

const EXERCISE_TYPE_LABELS: Readonly<Record<ExerciseType, string>> = {
  word_repetition: 'Repetici\u00f3n de palabra',
  phrase_repetition: 'Repetici\u00f3n de frase',
  guided_reading: 'Lectura guiada',
};

export function SessionProgress({ state }: SessionProgressProps) {
  const validAttemptCount = state.validHistory.length;
  const nextPosition = validAttemptCount + 1;

  return (
    <section
      aria-labelledby="session-progress-title"
      className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4"
    >
      <h3 className="font-bold text-slate-950" id="session-progress-title">
        Progreso técnico de la sesión
      </h3>
      {state.status === 'in_progress' ? (
        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
          <ProgressItem
            label="Intentos válidos"
            value={`${validAttemptCount} de 5`}
          />
          <ProgressItem
            label="Intento válido pendiente"
            value={`${nextPosition} de 5`}
          />
          <ProgressItem
            label="Tipo actual"
            value={EXERCISE_TYPE_LABELS[state.currentExercise.type]}
          />
          <ProgressItem
            label="Tipos cubiertos"
            value={`${deriveSessionCoverage(state.validHistory).length} de 3`}
          />
        </dl>
      ) : (
        <>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            <ProgressItem
              label="Intentos válidos registrados"
              value={`${validAttemptCount} de 5`}
            />
            <ProgressItem
              label="Siguiente intento válido"
              value={`${nextPosition} de 5`}
            />
            <ProgressItem
              label="Tipo pendiente"
              value={EXERCISE_TYPE_LABELS[state.pendingExercise.type]}
            />
          </dl>
          {state.origin === 'continued_blocking_attempt' && (
            <p className="mt-3 font-semibold text-amber-900">
              La captura anterior no fue registrada.
            </p>
          )}
        </>
      )}
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Este progreso describe sólo el flujo técnico de esta sesión.
      </p>
    </section>
  );
}

function ProgressItem({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div className="rounded-xl bg-white px-4 py-3 shadow-sm">
      <dt className="text-sm font-semibold text-slate-600">{label}</dt>
      <dd className="mt-1 font-bold text-slate-950">{value}</dd>
    </div>
  );
}

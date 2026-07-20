interface SessionCompleteProps {
  readonly onStartNewSession: () => void;
}

export function SessionComplete({ onStartNewSession }: SessionCompleteProps) {
  return (
    <section
      aria-labelledby="session-complete-title"
      className="rounded-3xl border border-emerald-300 bg-emerald-50 p-6 shadow-sm sm:p-8"
    >
      <h2
        className="text-3xl font-bold text-slate-950"
        id="session-complete-title"
      >
        Sesión técnica completada
      </h2>
      <ul className="mt-5 space-y-3 text-lg font-semibold text-slate-900">
        <li>5 de 5 intentos válidos</li>
        <li>3 tipos de ejercicios practicados</li>
        <li>El audio no fue conservado</li>
      </ul>
      <p className="mt-5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 font-semibold leading-7 text-amber-950">
        Estos resultados describen una sesión técnica y no constituyen una
        evaluación clínica.
      </p>
      <button
        className="mt-6 min-h-11 rounded-xl bg-rimay-700 px-5 py-3 font-semibold text-white hover:bg-rimay-900"
        onClick={onStartNewSession}
        type="button"
      >
        Iniciar nueva sesión
      </button>
    </section>
  );
}

import { PracticeAttemptFlow } from '../features/practice';

export function App() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#ccfbf1_0,_#f6f8fb_36rem)]">
      <header className="border-b border-white/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <p className="text-sm font-semibold tracking-[0.16em] text-rimay-700 uppercase">
              Rimay
            </p>
            <p className="mt-1 text-lg font-bold text-slate-950">
              Adaptive Voice Coach
            </p>
          </div>
          <span className="inline-flex min-h-11 items-center self-start rounded-full border border-rimay-600 bg-white px-4 text-sm font-semibold text-rimay-900 sm:self-auto">
            Sin backend
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="max-w-4xl">
          <p className="text-sm font-semibold text-rimay-700">
            Incremento 7 · Sesión de cinco intentos y adaptación completa
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Completa una sesión técnica de cinco intentos
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-700">
            Practica los tres tipos de ejercicio y avanza con decisiones locales
            y deterministas. El recorrido conserva sólo resultados técnicos en
            memoria; no diagnostica ni evalúa clínicamente la voz.
          </p>
        </div>

        <div className="mt-8">
          <PracticeAttemptFlow />
        </div>

        <aside
          aria-labelledby="safety-title"
          className="mt-8 rounded-3xl border border-amber-300 bg-amber-50 p-6 text-amber-950 sm:p-8"
        >
          <h2 id="safety-title" className="text-lg font-bold">
            Alcance y seguridad
          </h2>
          <p className="mt-2 leading-7">
            Rimay es un prototipo educativo no clínico. No diagnostica, no reemplaza
            la evaluación de un profesional y no debe usarse para tomar decisiones
            médicas. En esta versión no se usan datos reales ni se almacena audio.
          </p>
        </aside>
      </main>
    </div>
  );
}

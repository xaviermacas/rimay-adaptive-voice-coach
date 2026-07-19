import type { TextMetrics } from '../../domain/text';

interface TextMetricsSummaryProps {
  readonly metrics: TextMetrics;
}

const COMPARISON_TITLES = {
  browser: 'Comparación de texto reconocido por el navegador',
  demo: 'Comparación de texto simulado',
  manual: 'Comparación de texto introducido manualmente',
} as const;

const SIMILARITY_LABELS = {
  browser: 'Coincidencia del texto reconocido con la frase objetivo',
  demo: 'Coincidencia del texto simulado con la frase objetivo',
  manual: 'Coincidencia del texto introducido con la frase objetivo',
} as const;

const SOURCE_LABELS = {
  browser: 'Reconocimiento del navegador',
  demo: 'Fixture demo predefinido',
  manual: 'Entrada manual',
} as const;

function formatRatio(ratio: number): string {
  return `${(ratio * 100).toFixed(1)} %`;
}

function wordList(words: readonly { readonly token: string }[]): string {
  return words.length === 0 ? 'Ninguna' : words.map((word) => word.token).join(', ');
}

export function TextMetricsSummary({ metrics }: TextMetricsSummaryProps) {
  return (
    <section
      aria-labelledby="text-metrics-title"
      className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-slate-900"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <h3 id="text-metrics-title" className="text-lg font-bold">
          Resumen técnico del texto
        </h3>
        <p className="text-sm font-semibold text-emerald-950">
          Algoritmo: {metrics.algorithmVersion}
        </p>
      </div>

      <div className="mt-4 rounded-xl border border-emerald-300 bg-white px-4 py-3">
        <p className="font-bold text-emerald-950">
          {COMPARISON_TITLES[metrics.source]}
        </p>
        <p className="mt-1 text-sm font-semibold text-slate-700">
          Fuente: {SOURCE_LABELS[metrics.source]}.
        </p>
        {metrics.source === 'manual' && (
          <p className="mt-2 text-sm leading-6 text-slate-800">
            Este texto fue proporcionado por el usuario. Rimay no verificó que
            corresponda al contenido de la grabación.
          </p>
        )}
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Metric label="Palabras objetivo" value={String(metrics.targetWordCount)} />
        <Metric
          label="Palabras del intento"
          value={String(metrics.transcribedWordCount)}
        />
        <Metric label="Coincidencias" value={String(metrics.matchedWordCount)} />
        <Metric
          label="Sustituciones"
          value={String(metrics.substitutedWords.length)}
        />
        <Metric label="Omisiones" value={String(metrics.omittedWords.length)} />
        <Metric label="Adiciones" value={String(metrics.additionalWords.length)} />
        <Metric
          label="Tasa de error de palabras"
          value={formatRatio(metrics.wordErrorRate)}
        />
        <Metric
          label={SIMILARITY_LABELS[metrics.source]}
          value={formatRatio(metrics.textSimilarity)}
        />
        <Metric
          label="Palabras por minuto"
          value={
            metrics.wordsPerMinute === null
              ? metrics.wordsPerMinuteUnavailableReason ===
                'insufficient_voice_activity'
                ? 'WPM no disponible: no se detectó actividad de voz suficiente.'
                : 'No disponible sin audio real analizado'
              : `${metrics.wordsPerMinute.toFixed(1)} palabras/min`
          }
        />
      </dl>

      {metrics.source === 'manual' && metrics.wordsPerMinute !== null && (
        <p className="mt-4 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-semibold leading-6 text-violet-950">
          Estimación calculada con el número de palabras declarado por el usuario
          y la duración total de la captura.
        </p>
      )}

      <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
        <Detail label="Omitidas" value={wordList(metrics.omittedWords)} />
        <Detail label="Añadidas" value={wordList(metrics.additionalWords)} />
        <Detail
          label="Sustituidas"
          value={
            metrics.substitutedWords.length === 0
              ? 'Ninguna'
              : metrics.substitutedWords
                  .map(
                    (word) =>
                      `${word.targetToken} → ${word.transcribedToken}`,
                  )
                  .join(', ')
          }
        />
      </dl>

      {metrics.source === 'demo' && (
        <p className="mt-5 rounded-xl border border-sky-300 bg-sky-50 px-4 py-3 text-sm font-semibold leading-6 text-sky-950">
          Procedencia demo: el texto es predefinido y no está asociado a audio
          real. Por eso palabras por minuto no está disponible.
        </p>
      )}

      <p className="mt-5 border-t border-emerald-200 pt-4 text-sm font-semibold leading-6 text-emerald-950">
        La coincidencia textual es una comparación técnica y no una evaluación
        clínica. Estas métricas describen únicamente este intento y no son una
        puntuación clínica.
      </p>
    </section>
  );
}

interface MetricProps {
  readonly label: string;
  readonly value: string;
}

function Metric({ label, value }: MetricProps) {
  return (
    <div className="rounded-xl bg-white px-4 py-3 shadow-sm">
      <dt className="text-sm font-semibold text-slate-600">{label}</dt>
      <dd className="mt-1 font-bold text-slate-950">{value}</dd>
    </div>
  );
}

function Detail({ label, value }: MetricProps) {
  return (
    <div className="rounded-xl border border-emerald-200 bg-white px-4 py-3">
      <dt className="font-semibold text-slate-700">{label}</dt>
      <dd className="mt-1 text-slate-950">{value}</dd>
    </div>
  );
}

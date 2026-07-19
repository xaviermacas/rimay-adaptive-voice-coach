import type {
  AudioQualityFlag,
  DeterministicMetrics,
} from '../../domain/audio';

interface AudioMetricsSummaryProps {
  readonly hasUsableText?: boolean;
  readonly metrics: DeterministicMetrics;
  readonly simulated?: boolean;
}

const FLAG_LABELS: Readonly<Record<AudioQualityFlag, string>> = {
  audio_too_short: 'La captura dura menos de medio segundo.',
  no_speech_detected: 'No se detectó suficiente actividad de voz estimada.',
  too_quiet: 'El nivel de la captura es demasiado bajo.',
  possible_clipping: 'La captura puede contener recorte de amplitud.',
  transcription_missing: 'Las métricas basadas en texto no están disponibles.',
};

function formatDuration(durationMs: number): string {
  return `${(durationMs / 1_000).toFixed(1)} s`;
}

function formatAmplitude(amplitude: number): string {
  return amplitude.toFixed(3);
}

function formatPercentage(ratio: number): string {
  return `${(ratio * 100).toFixed(1)} %`;
}

function formatPauses(metrics: DeterministicMetrics): string {
  if (metrics.pauseCount === 0) {
    return '0 (duración promedio: No aplica)';
  }

  return `${metrics.pauseCount} (promedio: ${formatDuration(
    metrics.averagePauseDurationMs ?? 0,
  )})`;
}

export function AudioMetricsSummary({
  hasUsableText = false,
  metrics,
  simulated = false,
}: AudioMetricsSummaryProps) {
  const captureFlags = metrics.qualityFlags.filter(
    (flag) => flag !== 'transcription_missing',
  );
  const displayedFlags = hasUsableText
    ? metrics.qualityFlags.filter((flag) => flag !== 'transcription_missing')
    : metrics.qualityFlags;

  return (
    <section
      aria-labelledby="audio-metrics-title"
      className="mt-5 rounded-2xl border border-sky-200 bg-sky-50 p-5 text-slate-900"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <h3 id="audio-metrics-title" className="text-lg font-bold">
          {simulated
            ? 'Resumen técnico del fixture acústico simulado'
            : 'Resumen técnico de la captura'}
        </h3>
        <p className="text-sm font-semibold text-sky-900">
          Algoritmo: {metrics.algorithmVersion}
        </p>
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Metric label="Duración" value={formatDuration(metrics.totalDurationMs)} />
        <Metric label="Nivel RMS" value={formatAmplitude(metrics.rms)} />
        <Metric label="Pico máximo" value={formatAmplitude(metrics.peak)} />
        <Metric
          label="Tiempo estimado de voz"
          value={formatDuration(metrics.estimatedSpeechDurationMs)}
        />
        <Metric label="Pausas detectadas" value={formatPauses(metrics)} />
        <Metric
          label="Proporción de silencio"
          value={formatPercentage(metrics.silenceRatio)}
        />
        <Metric
          label="Calidad de la captura"
          value={
            captureFlags.length === 0
              ? 'Sin alertas técnicas'
              : `${captureFlags.length} alerta${captureFlags.length === 1 ? '' : 's'}`
          }
        />
        <Metric
          label="Muestreo"
          value={`${(metrics.sampleRateHz / 1_000).toFixed(1)} kHz`}
        />
        <Metric
          label="Canales de origen"
          value={String(metrics.channelCount)}
        />
      </dl>

      {displayedFlags.length > 0 && (
        <div className="mt-5">
          <h4 className="font-semibold">Observaciones técnicas</h4>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6">
            {displayedFlags.map((flag) => (
              <li key={flag}>{FLAG_LABELS[flag]}</li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-5 border-t border-sky-200 pt-4 text-sm font-semibold leading-6 text-sky-950">
        {simulated
          ? 'Estas métricas pertenecen a datos simulados y no representan una medición de su voz ni una evaluación clínica.'
          : 'Estas métricas son técnicas y experimentales. No representan una evaluación clínica.'}
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

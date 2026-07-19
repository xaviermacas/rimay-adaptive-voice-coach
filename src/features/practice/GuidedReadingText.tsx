import { segmentGuidedReadingText } from '../../domain/exercises';

interface GuidedReadingTextProps {
  readonly pauseCues: readonly number[];
  readonly targetText: string;
}

export function GuidedReadingText({
  pauseCues,
  targetText,
}: GuidedReadingTextProps) {
  const result = segmentGuidedReadingText(targetText, pauseCues);
  if (!result.ok) {
    return (
      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4">
        <p className="font-semibold text-amber-950" role="alert">
          {result.error.message} Lee el texto visible sin una marca adicional.
        </p>
        <p className="mt-3 text-2xl font-bold leading-10 text-slate-950">
          {targetText}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-rimay-100 bg-rimay-50 px-5 py-4 text-rimay-900">
      {result.segments.map((segment, index) => (
        <div key={`${index}-${segment.text}`}>
          <span className="block text-2xl font-bold leading-10">
            {segment.text}
          </span>
          {segment.pauseAfter && (
            <span className="my-2 inline-flex min-h-11 items-center rounded-full border border-rimay-600 bg-white px-4 text-sm font-bold text-rimay-900">
              Pausa
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export interface GuidedReadingSegment {
  readonly text: string;
  readonly pauseAfter: boolean;
}

export type GuidedReadingSegmentationResult =
  | {
      readonly ok: true;
      readonly segments: readonly GuidedReadingSegment[];
    }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: 'invalid_pause_cues';
        readonly message: string;
      };
    };

function cueSplitsSurrogatePair(text: string, cue: number): boolean {
  const previous = text.charCodeAt(cue - 1);
  const next = text.charCodeAt(cue);
  return (
    previous >= 0xd800 &&
    previous <= 0xdbff &&
    next >= 0xdc00 &&
    next <= 0xdfff
  );
}

export function segmentGuidedReadingText(
  targetText: string,
  pauseCues: readonly number[],
): GuidedReadingSegmentationResult {
  let previousCue = 0;
  for (const cue of pauseCues) {
    if (
      !Number.isInteger(cue) ||
      cue <= previousCue ||
      cue >= targetText.length ||
      cueSplitsSurrogatePair(targetText, cue) ||
      !/[,.!?;:]/u.test(targetText.slice(cue - 1, cue))
    ) {
      return {
        ok: false,
        error: {
          code: 'invalid_pause_cues',
          message: 'No se pudieron presentar las pausas de este ejercicio.',
        },
      };
    }
    previousCue = cue;
  }

  if (pauseCues.length === 0) {
    return {
      ok: true,
      segments: Object.freeze([
        Object.freeze({ text: targetText, pauseAfter: false }),
      ]),
    };
  }

  const segments: GuidedReadingSegment[] = [];
  let start = 0;
  for (const cue of pauseCues) {
    segments.push(
      Object.freeze({ text: targetText.slice(start, cue), pauseAfter: true }),
    );
    start = cue;
  }
  segments.push(
    Object.freeze({ text: targetText.slice(start), pauseAfter: false }),
  );

  return { ok: true, segments: Object.freeze(segments) };
}

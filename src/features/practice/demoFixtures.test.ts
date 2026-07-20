import { describe, expect, it } from 'vitest';

import { EXERCISE_CATALOG } from '../../domain/exercises';
import { calculateTextMetrics } from '../../domain/text';
import { getDemoAttemptFixtures } from './demoFixtures';

describe('fixtures demo por ejercicio', () => {
  it('mantiene texto, m\u00e9tricas y rotulado coherentes para los tres ejercicios', () => {
    const fixtures = EXERCISE_CATALOG.map((exercise) => ({
      exercise,
      fixture: getDemoAttemptFixtures(exercise),
    }));

    expect(
      fixtures.map(({ fixture }) => fixture.speechText.originalText),
    ).toEqual(EXERCISE_CATALOG.map(({ targetText }) => targetText));
    expect(
      fixtures.map(({ fixture }) => fixture.audioMetrics.totalDurationMs),
    ).toEqual([1_600, 4_000, 9_000]);
    expect(fixtures[2]?.fixture.audioMetrics.pauseCount).toBe(1);

    for (const { exercise, fixture } of fixtures) {
      expect(fixture.speechText.source).toBe('demo');
      expect(fixture.audioMetrics.qualityFlags).not.toEqual(
        expect.arrayContaining([
          'audio_too_short',
          'no_speech_detected',
          'too_quiet',
          'possible_clipping',
        ]),
      );
      expect(fixture.audioMetrics.wordCount).toBeNull();
      expect(fixture.audioMetrics.wordsPerMinute).toBeNull();
      expect(fixture.audioMetrics.analysisWarnings).toContain(
        `simulated_audio_metrics_fixture:${exercise.id}`,
      );

      const textResult = calculateTextMetrics({
        targetText: exercise.targetText,
        speechText: fixture.speechText,
        audioEvidence: null,
      });
      expect(textResult).toMatchObject({
        status: 'success',
        metrics: {
          source: 'demo',
          textSimilarity: 1,
          wordsPerMinute: null,
          wordsPerMinuteUnavailableReason: 'demo_source',
        },
      });
    }
  });
});

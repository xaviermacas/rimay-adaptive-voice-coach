import { describe, expect, it } from 'vitest';

import {
  GUIDED_EXERCISE,
  PHRASE_EXERCISE,
  VALID_AUDIO_METRICS,
} from '../../test/fixtures/coaching/coachFixtures';
import {
  calculateTargetDifficulty,
  selectFeedbackFocus,
} from './adaptation';

describe('adaptación de dificultad de coach-rules-v1', () => {
  it.each([
    [2, null, 2],
    [2, 0.64, 1],
    [2, 0.65, 2],
    [2, 0.85, 2],
    [2, 0.86, 3],
    [1, 0.2, 1],
    [3, 0.9, 3],
  ] as const)(
    'desde dificultad %s y similitud %s produce %s',
    (currentDifficulty, textSimilarity, expected) => {
      expect(
        calculateTargetDifficulty(currentDifficulty, textSimilarity),
      ).toBe(expected);
    },
  );
});

describe('prioridad de foco de coach-rules-v1', () => {
  it('prioriza lectura guiada sin pausas sobre duración y similitud', () => {
    expect(
      selectFeedbackFocus({
        currentExercise: GUIDED_EXERCISE,
        audioMetrics: {
          ...VALID_AUDIO_METRICS,
          pauseCount: 0,
          totalDurationMs: GUIDED_EXERCISE.expectedMaxDurationMs + 1,
        },
        textSimilarity: 0.2,
      }),
    ).toBe('follow_pause_cues');
  });

  it('continúa con la siguiente prioridad si la lectura guiada no define pausas', () => {
    expect(
      selectFeedbackFocus({
        currentExercise: { ...GUIDED_EXERCISE, pauseCues: [] },
        audioMetrics: { ...VALID_AUDIO_METRICS, pauseCount: 0 },
        textSimilarity: 0.75,
      }),
    ).toBe('continue');
  });

  it('prioriza duración superior cuando existen pausas', () => {
    expect(
      selectFeedbackFocus({
        currentExercise: GUIDED_EXERCISE,
        audioMetrics: {
          ...VALID_AUDIO_METRICS,
          pauseCount: 1,
          totalDurationMs: GUIDED_EXERCISE.expectedMaxDurationMs + 1,
        },
        textSimilarity: 0.2,
      }),
    ).toBe('steady_pace');
  });

  it('no activa ritmo cuando la duración es exactamente la esperada', () => {
    expect(
      selectFeedbackFocus({
        currentExercise: PHRASE_EXERCISE,
        audioMetrics: {
          ...VALID_AUDIO_METRICS,
          totalDurationMs: PHRASE_EXERCISE.expectedMaxDurationMs,
        },
        textSimilarity: 0.64,
      }),
    ).toBe('repeat_calmly');
  });

  it('selecciona repetir con calma para similitud baja', () => {
    expect(
      selectFeedbackFocus({
        currentExercise: PHRASE_EXERCISE,
        audioMetrics: VALID_AUDIO_METRICS,
        textSimilarity: 0.64,
      }),
    ).toBe('repeat_calmly');
  });

  it('no activa pausas para lectura guiada cuando existe al menos una', () => {
    expect(
      selectFeedbackFocus({
        currentExercise: GUIDED_EXERCISE,
        audioMetrics: { ...VALID_AUDIO_METRICS, pauseCount: 1 },
        textSimilarity: 0.75,
      }),
    ).toBe('continue');
  });

  it('no activa pausas para repetición de frase sin pausas indicadas', () => {
    expect(
      selectFeedbackFocus({
        currentExercise: PHRASE_EXERCISE,
        audioMetrics: { ...VALID_AUDIO_METRICS, pauseCount: 0 },
        textSimilarity: 0.75,
      }),
    ).toBe('continue');
  });

  it('selecciona continuar para el resto, incluso sin texto', () => {
    expect(
      selectFeedbackFocus({
        currentExercise: PHRASE_EXERCISE,
        audioMetrics: VALID_AUDIO_METRICS,
        textSimilarity: null,
      }),
    ).toBe('continue');
  });
});

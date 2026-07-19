import { describe, expect, it } from 'vitest';

import { evaluateCoach } from '../../domain/coaching';
import { calculateTextMetrics } from '../../domain/text';
import { buildPracticeCoachInput } from './practiceAttemptState';
import {
  DEMO_AUDIO_METRICS_FIXTURE,
  DEMO_SPEECH_TEXT_FIXTURE,
  PRACTICE_PHRASE_PREVIEW,
  PRACTICE_WORD_EXERCISE,
  TEMPORARY_PRACTICE_CATALOG,
} from './practiceFixture';

describe('fixture temporal de practica', () => {
  it('produce una decision determinista para continuar a la frase', () => {
    const textResult = calculateTextMetrics({
      targetText: PRACTICE_WORD_EXERCISE.targetText,
      speechText: DEMO_SPEECH_TEXT_FIXTURE,
      audioEvidence: null,
    });
    expect(textResult.status).toBe('success');
    if (textResult.status !== 'success') {
      throw new Error('Se esperaban metricas textuales de demo.');
    }

    const input = buildPracticeCoachInput({
      attemptId: 'fixture-attempt',
      currentExercise: PRACTICE_WORD_EXERCISE,
      audioMetrics: DEMO_AUDIO_METRICS_FIXTURE,
      textMetrics: textResult.metrics,
      allowedExercises: TEMPORARY_PRACTICE_CATALOG,
    });

    expect(evaluateCoach(input)).toMatchObject({
      ok: true,
      decision: {
        action: 'continue',
        selectedExerciseId: PRACTICE_PHRASE_PREVIEW.id,
        templateId: 'continue-text-demo-v1',
      },
    });
    expect(textResult.metrics.wordsPerMinute).toBeNull();
    expect(textResult.metrics.wordsPerMinuteUnavailableReason).toBe(
      'demo_source',
    );
  });
});

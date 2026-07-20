import { describe, expect, it } from 'vitest';

import {
  EXERCISE_CATALOG,
  INITIAL_EXERCISE,
} from '../../domain/exercises';
import { calculateTextMetrics } from '../../domain/text';
import { resolveCoachEvidence, resolveCoachEvidenceKey } from './coachEvidence';
import { buildPracticeCoachInput } from './practiceAttemptState';
import {
  DEMO_AUDIO_METRICS_FIXTURE,
  DEMO_SPEECH_TEXT_FIXTURE,
} from './demoFixtures';

function coachInput() {
  const textResult = calculateTextMetrics({
    targetText: INITIAL_EXERCISE.targetText,
    speechText: DEMO_SPEECH_TEXT_FIXTURE,
    audioEvidence: null,
  });
  if (textResult.status !== 'success') {
    throw new Error('Se esperaban metricas textuales.');
  }
  return buildPracticeCoachInput({
    attemptId: 'evidence-attempt',
    currentExercise: {
      ...INITIAL_EXERCISE,
      pauseCues: [1, 3],
    },
    audioMetrics: { ...DEMO_AUDIO_METRICS_FIXTURE, pauseCount: 2 },
    textMetrics: textResult.metrics,
    allowedExercises: EXERCISE_CATALOG,
    validAttemptCountBeforeCurrent: 0,
    coveredExerciseTypesBeforeCurrent: [],
  });
}

describe('resolucion visible de evidencia', () => {
  it('resuelve todas las claves admitidas con fuente, unidad y formato', () => {
    const items = resolveCoachEvidence(coachInput(), [
      'qualityFlags',
      'silenceRatio',
      'validAttemptCountBeforeCurrent',
      'pauseCount',
      'pauseCues',
      'totalDurationMs',
      'expectedMaxDurationMs',
      'textSimilarity',
      'currentDifficulty',
    ]);

    expect(items).toEqual([
      expect.objectContaining({ key: 'qualityFlags', value: 'Sin alertas t\u00e9cnicas', source: 'audio' }),
      expect.objectContaining({ key: 'silenceRatio', value: '25.0', unit: '%', source: 'audio' }),
      expect.objectContaining({ key: 'validAttemptCountBeforeCurrent', value: '0', unit: 'intentos', source: 'attempt' }),
      expect.objectContaining({ key: 'pauseCount', value: '2', unit: 'pausas', source: 'audio' }),
      expect.objectContaining({ key: 'pauseCues', value: '1, 3', source: 'exercise' }),
      expect.objectContaining({ key: 'totalDurationMs', value: '1.6', unit: 's', source: 'audio' }),
      expect.objectContaining({ key: 'expectedMaxDurationMs', value: '3.0', unit: 's', source: 'exercise' }),
      expect.objectContaining({ key: 'textSimilarity', value: '100.0', unit: '%', source: 'text' }),
      expect.objectContaining({ key: 'currentDifficulty', value: 'Nivel 1', source: 'exercise' }),
    ]);
  });

  it('rechaza una clave no compatible de forma explicita', () => {
    expect(() =>
      resolveCoachEvidenceKey(coachInput(), 'rms'),
    ).toThrow('Clave de evidencia no compatible: rms');
  });
});

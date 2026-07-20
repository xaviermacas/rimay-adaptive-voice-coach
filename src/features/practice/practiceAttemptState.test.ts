import { describe, expect, it } from 'vitest';

import {
  EXERCISE_CATALOG,
  INITIAL_EXERCISE,
} from '../../domain/exercises';
import { createSpeechTextResult } from '../../domain/text';
import {
  buildPracticeCoachInput,
  createInitialPracticeState,
  transitionPracticeAttempt,
} from './practiceAttemptState';
import {
  DEMO_AUDIO_METRICS_FIXTURE,
} from './demoFixtures';

const MANUAL_TEXT = createSpeechTextResult({
  originalText: 'casa',
  source: 'manual',
  languageRequested: null,
  isFinal: true,
  createdAt: '2026-07-19T00:00:00.000Z',
});

describe('maquina de estados de un intento', () => {
  it('recorre captura manual sin permitir saltos invalidos', () => {
    const initial = createInitialPracticeState(
      'practice-attempt-1',
      1,
    );
    expect(transitionPracticeAttempt(initial, { type: 'analysis_started' })).toBe(
      initial,
    );

    const privacy = transitionPracticeAttempt(initial, {
      type: 'choose_mode',
      mode: 'manual',
    });
    const requesting = transitionPracticeAttempt(privacy, {
      type: 'request_capture',
    });
    const recording = transitionPracticeAttempt(requesting, {
      type: 'recording_started',
    });
    const awaiting = transitionPracticeAttempt(recording, {
      type: 'recording_ready',
      speechText: null,
      recognitionTerminal: true,
      recognitionError: null,
    });
    const ready = transitionPracticeAttempt(awaiting, {
      type: 'text_confirmed',
      speechText: MANUAL_TEXT,
    });

    expect(privacy).toMatchObject({ status: 'privacy_choice', mode: 'manual' });
    expect(requesting.status).toBe('requesting_permission');
    expect(recording.status).toBe('recording');
    expect(awaiting).toMatchObject({ status: 'awaiting_text', mode: 'manual' });
    expect(ready).toMatchObject({
      status: 'ready_to_analyze',
      mode: 'manual',
      speechText: MANUAL_TEXT,
    });
  });

  it('exige consentimiento para iniciar el modo navegador', () => {
    const initial = createInitialPracticeState(
      'practice-attempt-1',
      1,
    );
    const privacy = transitionPracticeAttempt(initial, {
      type: 'choose_mode',
      mode: 'browser',
    });

    expect(
      transitionPracticeAttempt(privacy, { type: 'request_capture' }),
    ).toBe(privacy);
    const consented = transitionPracticeAttempt(privacy, {
      type: 'set_consent',
      accepted: true,
    });
    expect(
      transitionPracticeAttempt(consented, { type: 'request_capture' }).status,
    ).toBe('requesting_permission');
  });

  it('construye el historial explicito del primer intento', () => {
    expect(
      buildPracticeCoachInput({
        attemptId: 'practice-attempt-7',
        currentExercise: INITIAL_EXERCISE,
        audioMetrics: DEMO_AUDIO_METRICS_FIXTURE,
        textMetrics: null,
        allowedExercises: EXERCISE_CATALOG,
        validAttemptCountBeforeCurrent: 0,
        coveredExerciseTypesBeforeCurrent: [],
      }),
    ).toMatchObject({
      attemptId: 'practice-attempt-7',
      textSource: null,
      validAttemptCountBeforeCurrent: 0,
      coveredExerciseTypesBeforeCurrent: [],
    });
  });
});

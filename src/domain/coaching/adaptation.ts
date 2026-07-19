import type { DeterministicMetrics } from '../audio/types';
import type { Difficulty, Exercise } from '../contracts/domain';
import { COACH_RULES_V1_CONFIG } from './config';
import type { FeedbackFocus } from './types';

export function calculateTargetDifficulty(
  currentDifficulty: Difficulty,
  textSimilarity: number | null,
): Difficulty {
  if (
    textSimilarity !== null &&
    textSimilarity < COACH_RULES_V1_CONFIG.lowerSimilarityThreshold
  ) {
    if (currentDifficulty === 1) {
      return 1;
    }
    return currentDifficulty === 2 ? 1 : 2;
  }

  if (
    textSimilarity !== null &&
    textSimilarity > COACH_RULES_V1_CONFIG.upperSimilarityThreshold
  ) {
    if (currentDifficulty === 3) {
      return 3;
    }
    return currentDifficulty === 2 ? 3 : 2;
  }

  return currentDifficulty;
}

export interface FeedbackFocusInput {
  readonly currentExercise: Exercise;
  readonly audioMetrics: DeterministicMetrics;
  readonly textSimilarity: number | null;
}

export function selectFeedbackFocus({
  currentExercise,
  audioMetrics,
  textSimilarity,
}: FeedbackFocusInput): FeedbackFocus {
  if (
    currentExercise.type === 'guided_reading' &&
    currentExercise.pauseCues.length > 0 &&
    audioMetrics.pauseCount === 0
  ) {
    return 'follow_pause_cues';
  }

  if (audioMetrics.totalDurationMs > currentExercise.expectedMaxDurationMs) {
    return 'steady_pace';
  }

  if (
    textSimilarity !== null &&
    textSimilarity < COACH_RULES_V1_CONFIG.lowerSimilarityThreshold
  ) {
    return 'repeat_calmly';
  }

  return 'continue';
}

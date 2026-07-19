import type {
  Difficulty,
  ExerciseType,
} from '../contracts/domain';
import type {
  CoachRulesVersion,
  CoachTemplateCatalogVersion,
} from './types';

export const COACH_RULES_VERSION =
  'coach-rules-v1' satisfies CoachRulesVersion;
export const COACH_TEMPLATE_CATALOG_VERSION =
  'coach-templates-v1' satisfies CoachTemplateCatalogVersion;

export const REQUIRED_EXERCISE_TYPES = Object.freeze([
  'word_repetition',
  'phrase_repetition',
  'guided_reading',
] as const satisfies readonly ExerciseType[]);

export const COACH_RULES_V1_CONFIG = Object.freeze({
  minimumDifficulty: 1,
  maximumDifficulty: 3,
  lowerSimilarityThreshold: 0.65,
  upperSimilarityThreshold: 0.85,
  blockingSilenceRatio: 0.85,
  maximumValidAttemptCountBeforeCurrent: 4,
}) satisfies {
  readonly minimumDifficulty: Difficulty;
  readonly maximumDifficulty: Difficulty;
  readonly lowerSimilarityThreshold: number;
  readonly upperSimilarityThreshold: number;
  readonly blockingSilenceRatio: number;
  readonly maximumValidAttemptCountBeforeCurrent: number;
};

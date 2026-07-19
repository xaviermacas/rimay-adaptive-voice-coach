import type {
  Difficulty,
  Exercise,
  ExerciseType,
} from '../contracts/domain';

const EXERCISE_TYPE_ORDER = Object.freeze({
  word_repetition: 0,
  phrase_repetition: 1,
  guided_reading: 2,
}) satisfies Readonly<Record<ExerciseType, number>>;

export interface ExerciseCandidatePolicyInput {
  readonly allowedExercises: readonly Exercise[];
  readonly currentExerciseId: string;
  readonly targetDifficulty: Difficulty;
  readonly pendingRequiredExerciseType: ExerciseType | null;
}

function compareOrdinal(left: string, right: string): number {
  if (left < right) {
    return -1;
  }
  if (left > right) {
    return 1;
  }
  return 0;
}

export function orderExerciseCandidates({
  allowedExercises,
  currentExerciseId,
  targetDifficulty,
  pendingRequiredExerciseType,
}: ExerciseCandidatePolicyInput): readonly Exercise[] {
  const candidates =
    pendingRequiredExerciseType === null
      ? [...allowedExercises]
      : allowedExercises.filter(
          ({ type }) => type === pendingRequiredExerciseType,
        );

  return candidates.sort((left, right) => {
    const difficultyDistance =
      Math.abs(left.difficulty - targetDifficulty) -
      Math.abs(right.difficulty - targetDifficulty);
    if (difficultyDistance !== 0) {
      return difficultyDistance;
    }

    const currentIdPreference =
      Number(left.id === currentExerciseId) -
      Number(right.id === currentExerciseId);
    if (currentIdPreference !== 0) {
      return currentIdPreference;
    }

    const typeOrder =
      EXERCISE_TYPE_ORDER[left.type] - EXERCISE_TYPE_ORDER[right.type];
    if (typeOrder !== 0) {
      return typeOrder;
    }

    const difficultyOrder = left.difficulty - right.difficulty;
    if (difficultyOrder !== 0) {
      return difficultyOrder;
    }

    return compareOrdinal(left.id, right.id);
  });
}

export function selectExerciseCandidate(
  input: ExerciseCandidatePolicyInput,
): Exercise | null {
  return orderExerciseCandidates(input)[0] ?? null;
}

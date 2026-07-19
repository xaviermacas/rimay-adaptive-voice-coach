import type { Exercise } from '../contracts/domain';

export type ExerciseCatalogId =
  | 'practice-word-casa'
  | 'practice-phrase-calm'
  | 'practice-guided-calm';

const WORD_EXERCISE = Object.freeze({
  id: 'practice-word-casa',
  type: 'word_repetition',
  difficulty: 1,
  instruction: 'Pronuncia la palabra visible cuando estés listo.',
  targetText: 'casa',
  pauseCues: Object.freeze([]),
  expectedMaxDurationMs: 3_000,
} as const satisfies Exercise);

const PHRASE_EXERCISE = Object.freeze({
  id: 'practice-phrase-calm',
  type: 'phrase_repetition',
  difficulty: 2,
  instruction: 'Pronuncia la frase visible cuando estés listo.',
  targetText: 'Camino con calma.',
  pauseCues: Object.freeze([]),
  expectedMaxDurationMs: 6_000,
} as const satisfies Exercise);

const GUIDED_READING_EXERCISE = Object.freeze({
  id: 'practice-guided-calm',
  type: 'guided_reading',
  difficulty: 3,
  instruction:
    'Lee el texto visible y haz una pausa donde aparece la indicación.',
  targetText: 'La mañana está tranquila, camino con calma.',
  pauseCues: Object.freeze([25]),
  expectedMaxDurationMs: 12_000,
} as const satisfies Exercise);

export const EXERCISE_CATALOG = Object.freeze([
  WORD_EXERCISE,
  PHRASE_EXERCISE,
  GUIDED_READING_EXERCISE,
] as const satisfies readonly Exercise[]);

export const INITIAL_EXERCISE_SEQUENCE = Object.freeze([
  'practice-word-casa',
  'practice-phrase-calm',
  'practice-guided-calm',
] as const satisfies readonly ExerciseCatalogId[]);

const EXERCISES_BY_ID = Object.freeze({
  'practice-word-casa': WORD_EXERCISE,
  'practice-phrase-calm': PHRASE_EXERCISE,
  'practice-guided-calm': GUIDED_READING_EXERCISE,
}) satisfies Readonly<Record<ExerciseCatalogId, Exercise>>;

export const INITIAL_EXERCISE =
  EXERCISES_BY_ID[INITIAL_EXERCISE_SEQUENCE[0]];

export function findExerciseById(id: string): Exercise | undefined {
  return EXERCISE_CATALOG.find((exercise) => exercise.id === id);
}

export function getInitialSequencePosition(exerciseId: string): number | null {
  const index = INITIAL_EXERCISE_SEQUENCE.findIndex((id) => id === exerciseId);
  return index === -1 ? null : index + 1;
}

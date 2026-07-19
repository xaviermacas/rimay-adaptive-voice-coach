export type UserRole = 'patient' | 'professional';
export type ExerciseType =
  | 'word_repetition'
  | 'phrase_repetition'
  | 'guided_reading';
export type Difficulty = 1 | 2 | 3;

export interface Exercise {
  readonly id: string;
  readonly type: ExerciseType;
  readonly difficulty: Difficulty;
  readonly instruction: string;
  readonly targetText: string;
  readonly pauseCues: readonly number[];
  readonly expectedMaxDurationMs: number;
}

export interface RecordingMetadata {
  readonly mimeType: string;
  readonly durationMs: number;
  readonly sizeBytes: number;
  readonly sampleRateHz: number | null;
  readonly channelCount: number | null;
}

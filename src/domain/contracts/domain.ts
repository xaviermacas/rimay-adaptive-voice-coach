export type ProviderMode = 'demo' | 'live';
export type UserRole = 'patient' | 'professional';
export type ExerciseType = 'word' | 'phrase' | 'guided_reading';
export type Difficulty = 1 | 2 | 3 | 4 | 5;

export interface Exercise {
  id: string;
  type: ExerciseType;
  promptText: string;
  instructionText: string;
  targetText: string;
  difficulty: Difficulty;
  tags: readonly string[];
}

export interface RecordingMetadata {
  mimeType: string;
  durationMs: number;
  sizeBytes: number;
  sampleRateHz: number | null;
}

export type AudioQualityFlag =
  | 'audio_empty'
  | 'audio_too_short'
  | 'audio_too_long'
  | 'file_too_large'
  | 'low_voiced_ratio'
  | 'excessive_clipping'
  | 'transcript_unavailable'
  | 'transcript_low_confidence';

export interface DeterministicMetrics {
  algorithmVersion: string;
  durationMs: number;
  voicedDurationMs: number;
  voicedRatio: number;
  pauseCount: number;
  pauseDurationMs: number;
  meanPauseMs: number;
  maxPauseMs: number;
  clippingRatio: number;
  wordsPerMinute: number | null;
  targetSimilarity: number | null;
  targetWordCoverage: number | null;
  qualityFlags: readonly AudioQualityFlag[];
}

export interface TranscriptionResult {
  text: string;
  provider: string;
  confidence: number | null;
  warnings: readonly string[];
}

export interface CoachEvidence {
  metric: keyof DeterministicMetrics;
  value: number | string | null;
  attemptId: string;
}

export interface CoachRequest {
  attemptId: string;
  exercise: Exercise;
  transcript: TranscriptionResult | null;
  metrics: DeterministicMetrics;
  allowedNextExerciseIds: readonly string[];
  recentExerciseIds: readonly string[];
}

export interface CoachResponse {
  feedbackText: string;
  strengths: readonly string[];
  focus: string;
  nextExerciseId: string;
  evidence: readonly CoachEvidence[];
  source: 'model' | 'deterministic_fallback';
}

export interface Attempt {
  id: string;
  index: number;
  exercise: Exercise;
  recording: RecordingMetadata;
  audio: Blob;
  transcript: TranscriptionResult | null;
  metrics: DeterministicMetrics;
  coach: CoachResponse;
  createdAt: string;
}

export interface Session {
  id: string;
  patientProfileId: string;
  startedAt: string;
  completedAt: string | null;
  attempts: readonly Attempt[];
  plannedExerciseId: string;
  providerMode: ProviderMode;
}

export interface ProfessionalSummary {
  sessionId: string;
  overview: string;
  observedStrengths: readonly string[];
  practiceFocus: readonly string[];
  evidence: readonly CoachEvidence[];
  disclaimer: string;
  source: 'model' | 'deterministic_fallback';
}


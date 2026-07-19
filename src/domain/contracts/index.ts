export type {
  Attempt,
  CoachEvidence,
  CoachRequest,
  CoachResponse,
  Difficulty,
  Exercise,
  ExerciseType,
  ProfessionalSummary,
  RecordingMetadata,
  Session,
  UserRole,
} from './domain';
export type {
  ActiveRecognition,
  RecognitionCallbacks,
  SpeechRecognitionErrorCode,
  SpeechRecognitionMode,
  SpeechRecognitionStatus,
  SpeechRecognizer,
  SpeechTextResult,
  SpeechTextSource,
} from './speech';
export type {
  AudioQualityFlag,
  DeterministicMetrics,
} from '../audio/types';
export type {
  Coach,
  SessionRepository,
  SpeechOutput,
} from './providers';
export type {
  TextMetrics,
  TextMetricsResult,
  WordAlignmentOperation,
  WordsPerMinuteUnavailableReason,
} from '../text/types';

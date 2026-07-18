import type {
  Attempt,
  CoachRequest,
  CoachResponse,
  ProfessionalSummary,
  RecordingMetadata,
  Session,
  TranscriptionResult,
} from './domain';

export interface Transcriber {
  transcribe(
    audio: Blob,
    metadata: RecordingMetadata,
  ): Promise<TranscriptionResult>;
}

export interface Coach {
  coachAttempt(request: CoachRequest): Promise<CoachResponse>;
  summarizeSession(session: Session): Promise<ProfessionalSummary>;
}

export interface SessionRepository {
  listSessions(): Promise<readonly Session[]>;
  getSession(sessionId: string): Promise<Session | null>;
  saveSession(session: Session): Promise<void>;
  addAttempt(sessionId: string, attempt: Attempt): Promise<void>;
  clearAll(): Promise<void>;
}

export interface SpeechOutput {
  speak(text: string, language: 'es-ES' | 'es-MX'): Promise<void>;
  stop(): void;
  isSupported(): boolean;
}


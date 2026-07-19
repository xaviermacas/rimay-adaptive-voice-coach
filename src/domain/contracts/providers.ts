import type {
  Attempt,
  CoachRequest,
  CoachResponse,
  ProfessionalSummary,
  Session,
} from './domain';

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
  speak(text: string, language: string): Promise<void>;
  stop(): void;
  isSupported(): boolean;
}

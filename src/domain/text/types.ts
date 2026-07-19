import type {
  SpeechTextResult,
  SpeechTextSource,
} from '../contracts/speech';
import type { AudioQualityFlag } from '../audio/types';

export type TextMetricsAlgorithmVersion = 'text-metrics-v1';

export type WordAlignmentOperation =
  | 'match'
  | 'substitution'
  | 'omission'
  | 'addition';

export interface NormalizedText {
  readonly originalText: string;
  readonly normalizedText: string;
  readonly comparisonText: string;
}

export interface WordMatch {
  readonly targetIndex: number;
  readonly transcribedIndex: number;
  readonly token: string;
}

export interface IndexedToken {
  readonly index: number;
  readonly token: string;
}

export interface WordSubstitution {
  readonly targetIndex: number;
  readonly transcribedIndex: number;
  readonly targetToken: string;
  readonly transcribedToken: string;
}

export type WordAlignmentStep =
  | ({ readonly operation: 'match' } & WordMatch)
  | ({ readonly operation: 'substitution' } & WordSubstitution)
  | ({ readonly operation: 'omission' } & IndexedToken)
  | ({ readonly operation: 'addition' } & IndexedToken);

export interface TextMetrics {
  readonly algorithmVersion: TextMetricsAlgorithmVersion;
  readonly source: SpeechTextSource;
  readonly targetText: string;
  readonly transcribedText: string;
  readonly targetWordCount: number;
  readonly transcribedWordCount: number;
  readonly matchedWordCount: number;
  readonly matchedWords: readonly WordMatch[];
  readonly omittedWords: readonly IndexedToken[];
  readonly additionalWords: readonly IndexedToken[];
  readonly substitutedWords: readonly WordSubstitution[];
  readonly wordErrorCount: number;
  readonly wordErrorRate: number;
  readonly textSimilarity: number;
  readonly wordsPerMinute: number | null;
  readonly wordsPerMinuteUnavailableReason: WordsPerMinuteUnavailableReason | null;
  readonly warnings: readonly string[];
}

export type WordsPerMinuteUnavailableReason =
  | 'no_real_recording'
  | 'invalid_total_duration'
  | 'demo_source'
  | 'insufficient_voice_activity';

export interface TextMetricsAudioEvidence {
  readonly totalDurationMs: number;
  readonly estimatedSpeechDurationMs: number;
  readonly minimumSpeechDurationMs: number;
  readonly qualityFlags: readonly AudioQualityFlag[];
}

export interface TextMetricsError {
  readonly code: 'empty_target';
  readonly message: string;
}

export type TextMetricsResult =
  | { readonly status: 'success'; readonly metrics: TextMetrics }
  | { readonly status: 'error'; readonly error: TextMetricsError };

export interface TextMetricsInput {
  readonly targetText: string;
  readonly speechText: SpeechTextResult;
  readonly audioEvidence: TextMetricsAudioEvidence | null;
}

export interface CreateSpeechTextResultInput {
  readonly originalText: string;
  readonly source: SpeechTextSource;
  readonly languageRequested: string | null;
  readonly isFinal: boolean;
  readonly warnings?: readonly string[];
  readonly createdAt?: string;
}

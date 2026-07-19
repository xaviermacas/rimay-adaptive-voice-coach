export interface SpeechVoiceSummary {
  readonly voiceURI: string;
  readonly lang: string;
  readonly name: string;
  readonly localService: boolean;
  readonly default: boolean;
}

export type SpeechOutputAvailabilitySnapshot =
  | {
      readonly status: 'unsupported';
      readonly selectedVoice: null;
    }
  | {
      readonly status: 'loading_voices';
      readonly selectedVoice: null;
    }
  | {
      readonly status: 'unavailable';
      readonly selectedVoice: null;
    }
  | {
      readonly status: 'ready';
      readonly selectedVoice: SpeechVoiceSummary;
    };

export type SpeechOutputState =
  | SpeechOutputAvailabilitySnapshot
  | {
      readonly status: 'speaking';
      readonly selectedVoice: SpeechVoiceSummary;
    }
  | {
      readonly status: 'stopped';
      readonly selectedVoice: SpeechVoiceSummary | null;
    }
  | {
      readonly status: 'error';
      readonly selectedVoice: SpeechVoiceSummary | null;
      readonly message: string;
    };

export type SpeechOutputFailureCode =
  | 'empty_text'
  | 'unsupported'
  | 'voices_loading'
  | 'spanish_voice_unavailable'
  | 'synthesis_failed'
  | 'disposed';

export class SpeechOutputFailure extends Error {
  override readonly name = 'SpeechOutputFailure';

  constructor(
    readonly code: SpeechOutputFailureCode,
    message: string,
  ) {
    super(message);
  }
}

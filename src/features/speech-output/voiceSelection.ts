import type { SpeechVoiceSummary } from './types';

export type SpanishVoiceSelectionResult =
  | {
      readonly status: 'available';
      readonly voice: SpeechSynthesisVoice;
      readonly summary: SpeechVoiceSummary;
    }
  | {
      readonly status: 'unavailable';
      readonly reason: 'empty_voice_list' | 'spanish_voice_unavailable';
    };

function compareOrdinal(left: string, right: string): number {
  if (left < right) {
    return -1;
  }
  if (left > right) {
    return 1;
  }
  return 0;
}

function voiceGroup(voice: SpeechSynthesisVoice): number | null {
  const language = voice.lang.toLowerCase();
  if (language === 'es-ec') {
    return voice.localService ? 0 : 1;
  }
  if (language.startsWith('es-')) {
    return voice.localService ? 2 : 3;
  }
  return null;
}

function compareVoices(
  left: SpeechSynthesisVoice,
  right: SpeechSynthesisVoice,
): number {
  const leftGroup = voiceGroup(left);
  const rightGroup = voiceGroup(right);
  if (leftGroup === null || rightGroup === null) {
    return 0;
  }
  const groupOrder = leftGroup - rightGroup;
  if (groupOrder !== 0) {
    return groupOrder;
  }
  const defaultOrder = Number(right.default) - Number(left.default);
  if (defaultOrder !== 0) {
    return defaultOrder;
  }
  const uriOrder = compareOrdinal(left.voiceURI, right.voiceURI);
  if (uriOrder !== 0) {
    return uriOrder;
  }
  const languageOrder = compareOrdinal(
    left.lang.toLowerCase(),
    right.lang.toLowerCase(),
  );
  return languageOrder !== 0
    ? languageOrder
    : compareOrdinal(left.name, right.name);
}

export function summarizeVoice(
  voice: SpeechSynthesisVoice,
): SpeechVoiceSummary {
  return Object.freeze({
    voiceURI: voice.voiceURI,
    lang: voice.lang,
    name: voice.name,
    localService: voice.localService,
    default: voice.default,
  });
}

export function voiceIdentity(voice: SpeechSynthesisVoice): string {
  return `${voice.voiceURI}\u0000${voice.lang}\u0000${voice.name}`;
}

export function selectSpanishVoice(
  voices: readonly SpeechSynthesisVoice[],
): SpanishVoiceSelectionResult {
  if (voices.length === 0) {
    return { status: 'unavailable', reason: 'empty_voice_list' };
  }

  const selectedVoice = voices
    .filter((voice) => voiceGroup(voice) !== null)
    .sort(compareVoices)[0];
  if (selectedVoice === undefined) {
    return { status: 'unavailable', reason: 'spanish_voice_unavailable' };
  }

  return {
    status: 'available',
    voice: selectedVoice,
    summary: summarizeVoice(selectedVoice),
  };
}

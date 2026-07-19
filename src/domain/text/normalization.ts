import type { SpeechTextResult } from '../contracts/speech';
import type {
  CreateSpeechTextResultInput,
  NormalizedText,
} from './types';

const PUNCTUATION_PATTERN = /\p{P}+/gu;
const COMBINING_MARK_PATTERN = /\p{M}+/gu;
const WHITESPACE_PATTERN = /\s+/gu;

export function normalizeText(originalText: string): NormalizedText {
  const normalizedText = originalText
    .normalize('NFC')
    .toLocaleLowerCase('es')
    .replace(PUNCTUATION_PATTERN, ' ')
    .replace(WHITESPACE_PATTERN, ' ')
    .trim();

  const comparisonText = Array.from(normalizedText, (character) =>
    character === 'ñ'
      ? character
      : character.normalize('NFD').replace(COMBINING_MARK_PATTERN, ''),
  )
    .join('')
    .normalize('NFC');

  return { originalText, normalizedText, comparisonText };
}

export function createSpeechTextResult(
  input: CreateSpeechTextResultInput,
): SpeechTextResult {
  const text = normalizeText(input.originalText);

  return {
    ...text,
    source: input.source,
    languageRequested: input.languageRequested,
    isFinal: input.isFinal,
    warnings: input.warnings ?? [],
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
}

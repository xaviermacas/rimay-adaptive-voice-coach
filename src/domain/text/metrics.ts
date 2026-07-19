import { normalizeText } from './normalization';
import type {
  IndexedToken,
  TextMetrics,
  TextMetricsInput,
  TextMetricsResult,
  WordAlignmentStep,
  WordMatch,
  WordSubstitution,
} from './types';

function roundTo(value: number, decimalPlaces: number): number {
  const factor = 10 ** decimalPlaces;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function tokens(text: string): readonly string[] {
  return text === '' ? [] : text.split(' ');
}

function matrixValue(
  matrix: readonly (readonly number[])[],
  rowIndex: number,
  columnIndex: number,
): number {
  return matrix[rowIndex]?.[columnIndex] ?? Number.POSITIVE_INFINITY;
}

function createDistanceMatrix(
  targetTokens: readonly string[],
  transcribedTokens: readonly string[],
): readonly (readonly number[])[] {
  const matrix = Array.from({ length: targetTokens.length + 1 }, () =>
    Array<number>(transcribedTokens.length + 1).fill(0),
  );

  for (let targetIndex = 0; targetIndex <= targetTokens.length; targetIndex += 1) {
    const row = matrix[targetIndex];
    if (row !== undefined) {
      row[0] = targetIndex;
    }
  }

  const firstRow = matrix[0];
  if (firstRow !== undefined) {
    for (
      let transcribedIndex = 0;
      transcribedIndex <= transcribedTokens.length;
      transcribedIndex += 1
    ) {
      firstRow[transcribedIndex] = transcribedIndex;
    }
  }

  for (let targetIndex = 1; targetIndex <= targetTokens.length; targetIndex += 1) {
    for (
      let transcribedIndex = 1;
      transcribedIndex <= transcribedTokens.length;
      transcribedIndex += 1
    ) {
      const substitutionCost =
        targetTokens[targetIndex - 1] === transcribedTokens[transcribedIndex - 1]
          ? 0
          : 1;
      const row = matrix[targetIndex];
      if (row !== undefined) {
        row[transcribedIndex] = Math.min(
          matrixValue(matrix, targetIndex - 1, transcribedIndex - 1) +
            substitutionCost,
          matrixValue(matrix, targetIndex - 1, transcribedIndex) + 1,
          matrixValue(matrix, targetIndex, transcribedIndex - 1) + 1,
        );
      }
    }
  }

  return matrix;
}

function alignWords(input: {
  readonly targetComparisonTokens: readonly string[];
  readonly transcribedComparisonTokens: readonly string[];
  readonly targetDisplayTokens: readonly string[];
  readonly transcribedDisplayTokens: readonly string[];
}): readonly WordAlignmentStep[] {
  const matrix = createDistanceMatrix(
    input.targetComparisonTokens,
    input.transcribedComparisonTokens,
  );
  const reversedSteps: WordAlignmentStep[] = [];
  let targetCount = input.targetComparisonTokens.length;
  let transcribedCount = input.transcribedComparisonTokens.length;

  while (targetCount > 0 || transcribedCount > 0) {
    const current = matrixValue(matrix, targetCount, transcribedCount);
    const targetIndex = targetCount - 1;
    const transcribedIndex = transcribedCount - 1;
    const targetComparisonToken = input.targetComparisonTokens[targetIndex];
    const transcribedComparisonToken =
      input.transcribedComparisonTokens[transcribedIndex];

    if (
      targetCount > 0 &&
      transcribedCount > 0 &&
      targetComparisonToken === transcribedComparisonToken &&
      current === matrixValue(matrix, targetCount - 1, transcribedCount - 1)
    ) {
      reversedSteps.push({
        operation: 'match',
        targetIndex,
        transcribedIndex,
        token: input.targetDisplayTokens[targetIndex] ?? '',
      });
      targetCount -= 1;
      transcribedCount -= 1;
      continue;
    }

    if (
      targetCount > 0 &&
      transcribedCount > 0 &&
      current === matrixValue(matrix, targetCount - 1, transcribedCount - 1) + 1
    ) {
      reversedSteps.push({
        operation: 'substitution',
        targetIndex,
        transcribedIndex,
        targetToken: input.targetDisplayTokens[targetIndex] ?? '',
        transcribedToken: input.transcribedDisplayTokens[transcribedIndex] ?? '',
      });
      targetCount -= 1;
      transcribedCount -= 1;
      continue;
    }

    if (
      targetCount > 0 &&
      current === matrixValue(matrix, targetCount - 1, transcribedCount) + 1
    ) {
      reversedSteps.push({
        operation: 'omission',
        index: targetIndex,
        token: input.targetDisplayTokens[targetIndex] ?? '',
      });
      targetCount -= 1;
      continue;
    }

    reversedSteps.push({
      operation: 'addition',
      index: transcribedIndex,
      token: input.transcribedDisplayTokens[transcribedIndex] ?? '',
    });
    transcribedCount -= 1;
  }

  return reversedSteps.reverse();
}

function calculateWordsPerMinute(
  input: TextMetricsInput,
  wordCount: number,
): Pick<
  TextMetrics,
  'wordsPerMinute' | 'wordsPerMinuteUnavailableReason'
> {
  if (input.speechText.source === 'demo') {
    return {
      wordsPerMinute: null,
      wordsPerMinuteUnavailableReason: 'demo_source',
    };
  }

  if (input.audioEvidence === null) {
    return {
      wordsPerMinute: null,
      wordsPerMinuteUnavailableReason: 'no_real_recording',
    };
  }

  const {
    estimatedSpeechDurationMs,
    minimumSpeechDurationMs,
    qualityFlags,
    totalDurationMs,
  } = input.audioEvidence;
  if (!Number.isFinite(totalDurationMs) || totalDurationMs <= 0) {
    return {
      wordsPerMinute: null,
      wordsPerMinuteUnavailableReason: 'invalid_total_duration',
    };
  }

  const hasInsufficientVoiceActivity =
    qualityFlags.includes('no_speech_detected') ||
    qualityFlags.includes('too_quiet') ||
    !Number.isFinite(estimatedSpeechDurationMs) ||
    estimatedSpeechDurationMs < minimumSpeechDurationMs;
  if (hasInsufficientVoiceActivity) {
    return {
      wordsPerMinute: null,
      wordsPerMinuteUnavailableReason: 'insufficient_voice_activity',
    };
  }

  return {
    wordsPerMinute: roundTo(wordCount / (totalDurationMs / 60_000), 1),
    wordsPerMinuteUnavailableReason: null,
  };
}

export function calculateTextMetrics(
  input: TextMetricsInput,
): TextMetricsResult {
  const target = normalizeText(input.targetText);
  if (target.normalizedText === '') {
    return {
      status: 'error',
      error: {
        code: 'empty_target',
        message:
          'El texto objetivo está vacío. Define una frase antes de calcular las métricas.',
      },
    };
  }

  const targetDisplayTokens = tokens(target.normalizedText);
  const targetComparisonTokens = tokens(target.comparisonText);
  const transcribedDisplayTokens = tokens(input.speechText.normalizedText);
  const transcribedComparisonTokens = tokens(input.speechText.comparisonText);
  const alignment = alignWords({
    targetComparisonTokens,
    transcribedComparisonTokens,
    targetDisplayTokens,
    transcribedDisplayTokens,
  });
  const matchedWords: WordMatch[] = [];
  const omittedWords: IndexedToken[] = [];
  const additionalWords: IndexedToken[] = [];
  const substitutedWords: WordSubstitution[] = [];

  for (const step of alignment) {
    switch (step.operation) {
      case 'match':
        matchedWords.push({
          targetIndex: step.targetIndex,
          transcribedIndex: step.transcribedIndex,
          token: step.token,
        });
        break;
      case 'substitution':
        substitutedWords.push({
          targetIndex: step.targetIndex,
          transcribedIndex: step.transcribedIndex,
          targetToken: step.targetToken,
          transcribedToken: step.transcribedToken,
        });
        break;
      case 'omission':
        omittedWords.push({ index: step.index, token: step.token });
        break;
      case 'addition':
        additionalWords.push({ index: step.index, token: step.token });
        break;
    }
  }

  const wordErrorCount =
    substitutedWords.length + omittedWords.length + additionalWords.length;
  const wordErrorRate = wordErrorCount / targetDisplayTokens.length;
  const wordsPerMinute = calculateWordsPerMinute(
    input,
    transcribedDisplayTokens.length,
  );

  return {
    status: 'success',
    metrics: {
      algorithmVersion: 'text-metrics-v1',
      source: input.speechText.source,
      targetText: target.normalizedText,
      transcribedText: input.speechText.normalizedText,
      targetWordCount: targetDisplayTokens.length,
      transcribedWordCount: transcribedDisplayTokens.length,
      matchedWordCount: matchedWords.length,
      matchedWords,
      omittedWords,
      additionalWords,
      substitutedWords,
      wordErrorCount,
      wordErrorRate: roundTo(wordErrorRate, 4),
      textSimilarity: roundTo(Math.max(0, 1 - wordErrorRate), 4),
      ...wordsPerMinute,
      warnings: input.speechText.warnings,
    },
  };
}

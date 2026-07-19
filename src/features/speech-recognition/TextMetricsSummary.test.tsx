import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { SpeechTextSource } from '../../domain/contracts';
import {
  calculateTextMetrics,
  createSpeechTextResult,
  type TextMetrics,
} from '../../domain/text';
import { TextMetricsSummary } from './TextMetricsSummary';

function metricsFor(source: SpeechTextSource): TextMetrics {
  const result = calculateTextMetrics({
    targetText: 'Hoy camino con calma y confianza.',
    speechText: createSpeechTextResult({
      originalText: 'Hoy camino con calma y confianza.',
      source,
      languageRequested: source === 'manual' ? null : 'es-EC',
      isFinal: true,
      createdAt: '2026-07-18T12:00:00.000Z',
    }),
    audioEvidence: null,
  });

  if (result.status === 'error') {
    throw new Error(result.error.code);
  }

  return result.metrics;
}

describe('TextMetricsSummary provenance', () => {
  it('destaca que la comparación manual usa texto declarado y no audio verificado', () => {
    render(<TextMetricsSummary metrics={metricsFor('manual')} />);
    const summary = screen.getByRole('region', {
      name: 'Resumen técnico del texto',
    });

    expect(
      within(summary).getByText('Comparación de texto introducido manualmente'),
    ).toBeInTheDocument();
    expect(
      within(summary).getByText(
        'Este texto fue proporcionado por el usuario. Rimay no verificó que corresponda al contenido de la grabación.',
      ),
    ).toBeInTheDocument();
    expect(
      within(summary).getByText(
        'Coincidencia del texto introducido con la frase objetivo',
      ),
    ).toBeInTheDocument();
  });

  it('etiqueta la comparación browser como texto reconocido', () => {
    render(<TextMetricsSummary metrics={metricsFor('browser')} />);

    expect(
      screen.getByText('Coincidencia del texto reconocido con la frase objetivo'),
    ).toBeInTheDocument();
  });

  it('etiqueta la comparación demo como texto simulado', () => {
    render(<TextMetricsSummary metrics={metricsFor('demo')} />);

    expect(
      screen.getByText('Coincidencia del texto simulado con la frase objetivo'),
    ).toBeInTheDocument();
  });
});

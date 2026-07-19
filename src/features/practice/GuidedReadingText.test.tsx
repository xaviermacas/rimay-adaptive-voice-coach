import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { GuidedReadingText } from './GuidedReadingText';

describe('GuidedReadingText', () => {
  it('muestra la pausa canónica con texto y conserva puntuación', () => {
    render(
      <GuidedReadingText
        pauseCues={[25]}
        targetText="La mañana está tranquila, camino con calma."
      />,
    );
    expect(screen.getByText('La mañana está tranquila,')).toBeInTheDocument();
    expect(screen.getByText('Pausa')).toBeInTheDocument();
    expect(screen.getByText(/camino con calma\./)).toBeInTheDocument();
  });

  it('soporta múltiples cues y texto sin cues', () => {
    const { rerender } = render(
      <GuidedReadingText
        pauseCues={[7, 16]}
        targetText="Mañana, después; seguimos."
      />,
    );
    expect(screen.getAllByText('Pausa')).toHaveLength(2);
    rerender(
      <GuidedReadingText pauseCues={[]} targetText="Mañana está aquí." />,
    );
    expect(screen.queryByText('Pausa')).not.toBeInTheDocument();
    expect(screen.getByText('Mañana está aquí.')).toBeInTheDocument();
  });

  it('falla de forma controlada y conserva el objetivo visible', () => {
    render(<GuidedReadingText pauseCues={[0]} targetText="Texto visible." />);
    expect(screen.getByRole('alert')).toHaveTextContent(/no se pudieron presentar/i);
    expect(screen.getByText('Texto visible.')).toBeInTheDocument();
  });
});

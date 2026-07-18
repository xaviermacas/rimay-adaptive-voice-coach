import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { App } from './App';

describe('App', () => {
  it('muestra modo demo, privacidad y descargo no clínico sin pedir permiso', () => {
    const getUserMedia = vi.fn();
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    });

    render(<App />);

    expect(screen.getByText('Modo demo')).toBeInTheDocument();
    expect(screen.getByText(/no se envía ni se guarda/i)).toBeInTheDocument();
    expect(screen.getByText(/prototipo educativo no clínico/i)).toBeInTheDocument();
    expect(getUserMedia).not.toHaveBeenCalled();
  });
});


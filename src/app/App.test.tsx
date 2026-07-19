import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { App } from './App';

describe('App', () => {
  it('inicia en la instrucción, explica privacidad y no pide permiso', () => {
    const getUserMedia = vi.fn();
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    });

    render(<App />);

    expect(screen.getByText('Sin backend')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /un intento de una palabra/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /preparar intento/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/no envía ni guarda/i)).toBeInTheDocument();
    expect(screen.getByText(/prototipo educativo no clínico/i)).toBeInTheDocument();
    expect(getUserMedia).not.toHaveBeenCalled();
  });
});

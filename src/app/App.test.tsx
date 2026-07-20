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
      screen.getByRole('heading', {
        level: 1,
        name: /sesión guiada de práctica/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /completa cinco intentos válidos con ejercicios de palabra, frase y lectura guiada/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: /sesión de cinco intentos válidos/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('0 de 5')).toBeInTheDocument();
    expect(screen.getByText('1 de 5')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /preparar intento/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/no envía ni guarda/i)).toBeInTheDocument();
    expect(screen.getByText(/prototipo educativo no clínico/i)).toBeInTheDocument();
    expect(getUserMedia).not.toHaveBeenCalled();
  });
});

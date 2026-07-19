import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SpeechControls } from './SpeechControls';
import type { SpeechOutputController } from './useSpeechOutput';

const VOICE = {
  name: 'Español Ecuador',
  lang: 'es-EC',
  localService: true,
  default: true,
  voiceURI: 'voice:ec',
} as const;

function controller(
  overrides: Partial<SpeechOutputController> = {},
): SpeechOutputController {
  return {
    isAvailable: true,
    speak: vi.fn().mockResolvedValue(undefined),
    state: { status: 'ready', selectedVoice: VOICE },
    stop: vi.fn(),
    dispose: vi.fn(),
    ...overrides,
  };
}

describe('SpeechControls', () => {
  it('habla únicamente el texto autorizado por clic explícito', async () => {
    const speech = controller();
    render(
      <SpeechControls
        controller={speech}
        kind="instruction"
        text="Instrucción visible"
      />,
    );
    expect(speech.speak).not.toHaveBeenCalled();
    expect(
      screen.queryByRole('button', { name: 'Repetir instrucción' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Detener voz' }),
    ).not.toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: 'Escuchar instrucción' }),
    );
    expect(speech.speak).toHaveBeenCalledWith('Instrucción visible');
  });

  it('muestra únicamente detener mientras existe una locución activa', async () => {
    const stop = vi.fn();
    const speech = controller({
      state: { status: 'speaking', selectedVoice: VOICE },
      stop,
    });
    render(
      <SpeechControls
        controller={speech}
        kind="feedback"
        text="Devolución visible"
      />,
    );
    expect(
      screen.queryByRole('button', { name: 'Escuchar devolución' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Repetir devolución' }),
    ).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Detener voz' }));
    expect(stop).toHaveBeenCalledOnce();
  });

  it('mantiene texto y fallback cuando no existe voz', () => {
    const speech = controller({
      isAvailable: false,
      state: { status: 'unavailable', selectedVoice: null },
    });
    render(
      <SpeechControls
        controller={speech}
        kind="instruction"
        text="Instrucción visible"
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Escuchar instrucción' }),
    ).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent(/no hay una voz española/i);
  });
});

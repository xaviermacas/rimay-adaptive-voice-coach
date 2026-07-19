import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { EXERCISE_CATALOG } from '../../domain/exercises';
import type { SpeechOutputController } from '../speech-output';
import { ExerciseInstruction } from './ExerciseInstruction';

const VOICE = {
  name: 'Español Ecuador',
  lang: 'es-EC',
  localService: true,
  default: true,
  voiceURI: 'voice:ec',
} as const;

function speechController(): SpeechOutputController {
  return {
    isAvailable: true,
    speak: vi.fn().mockResolvedValue(undefined),
    state: { status: 'ready', selectedVoice: VOICE },
    stop: vi.fn(),
    dispose: vi.fn(),
  };
}

describe('ExerciseInstruction', () => {
  it('muestra progreso, tipo, dificultad e instrucción y habla su valor exacto', async () => {
    const speech = speechController();
    render(
      <ExerciseInstruction
        exercise={EXERCISE_CATALOG[0]}
        position={1}
        speech={speech}
        total={3}
      />,
    );
    expect(screen.getByText('Ejercicio 1 de 3')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Repetición de palabra' })).toBeInTheDocument();
    expect(screen.getByText('Dificultad: nivel 1')).toBeInTheDocument();
    expect(screen.getByText('casa')).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: 'Escuchar instrucción' }),
    );
    expect(speech.speak).toHaveBeenCalledWith(
      EXERCISE_CATALOG[0].instruction,
    );
  });

  it('soporta progreso 3 de 3 y lectura guiada accesible', () => {
    render(
      <ExerciseInstruction
        exercise={EXERCISE_CATALOG[2]}
        position={3}
        speech={speechController()}
        total={3}
      />,
    );
    expect(screen.getByText('Ejercicio 3 de 3')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Lectura guiada' })).toBeInTheDocument();
    expect(screen.getByText('Pausa')).toBeInTheDocument();
  });
});

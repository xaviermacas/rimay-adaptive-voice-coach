import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
  ActiveRecognition,
  RecognitionCallbacks,
  SpeechRecognizer,
} from '../../domain/contracts';
import type { DeterministicMetrics } from '../../domain/audio';
import { AudioRecorderCard } from './AudioRecorderCard';

class FunctionalMediaRecorder {
  static instances: FunctionalMediaRecorder[] = [];
  static isTypeSupported(): boolean {
    return true;
  }

  readonly mimeType: string;
  ondataavailable: ((event: BlobEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  onstop: (() => void) | null = null;
  state: RecordingState = 'inactive';

  constructor(
    readonly stream: MediaStream,
    options?: MediaRecorderOptions,
  ) {
    this.mimeType = options?.mimeType ?? 'audio/webm';
    FunctionalMediaRecorder.instances.push(this);
  }

  start(): void {
    this.state = 'recording';
  }

  stop(): void {
    this.state = 'inactive';
    this.onstop?.();
  }

  emitData(data: Blob): void {
    this.ondataavailable?.(new BlobEvent('dataavailable', { data }));
  }
}

class ControlledRecognizer implements SpeechRecognizer {
  readonly source: 'browser' | 'demo';
  readonly active: ActiveRecognition = {
    stop: vi.fn(),
    abort: vi.fn(),
    dispose: vi.fn(),
  };
  callbacks: RecognitionCallbacks | null = null;

  constructor(
    source: 'browser' | 'demo',
    private readonly onStart: () => void = () => undefined,
  ) {
    this.source = source;
  }

  isSupported(): boolean {
    return true;
  }

  start(input: {
    readonly languageTag: string;
    readonly callbacks: RecognitionCallbacks;
  }): ActiveRecognition {
    this.onStart();
    this.callbacks = input.callbacks;
    return this.active;
  }

  interim(text: string): void {
    this.callbacks?.onInterim(text);
  }

  final(text: string): void {
    this.callbacks?.onFinal(text);
  }

  error(): void {
    this.callbacks?.onError('network_failed');
  }

  end(): void {
    this.callbacks?.onEnd();
  }
}

const originalMediaDevices = Object.getOwnPropertyDescriptor(
  navigator,
  'mediaDevices',
);
const originalCreateObjectUrl = Object.getOwnPropertyDescriptor(
  URL,
  'createObjectURL',
);
const originalRevokeObjectUrl = Object.getOwnPropertyDescriptor(
  URL,
  'revokeObjectURL',
);

const SUCCESSFUL_AUDIO_METRICS: DeterministicMetrics = {
  algorithmVersion: 'audio-metrics-v1',
  sampleRateHz: 1_000,
  channelCount: 1,
  totalDurationMs: 1_000,
  analyzedDurationMs: 1_000,
  estimatedSpeechDurationMs: 600,
  silenceDurationMs: 400,
  silenceRatio: 0.4,
  pauseCount: 0,
  averagePauseDurationMs: null,
  maximumPauseDurationMs: null,
  rms: 0.2,
  peak: 0.4,
  estimatedNoiseFloorRms: 0.01,
  adaptiveVoiceThresholdRms: 0.03,
  clippedSampleRatio: 0,
  possibleClipping: false,
  wordCount: null,
  wordsPerMinute: null,
  promptSimilarity: null,
  qualityFlags: ['transcription_missing'],
  analysisWarnings: [],
};

function restoreMediaDevices(): void {
  if (originalMediaDevices === undefined) {
    Reflect.deleteProperty(navigator, 'mediaDevices');
  } else {
    Object.defineProperty(navigator, 'mediaDevices', originalMediaDevices);
  }
}

function restoreProperty(
  target: object,
  property: PropertyKey,
  descriptor: PropertyDescriptor | undefined,
): void {
  if (descriptor === undefined) {
    Reflect.deleteProperty(target, property);
  } else {
    Object.defineProperty(target, property, descriptor);
  }
}

async function renderManualAttemptWithAudio(
  metrics: DeterministicMetrics,
): Promise<HTMLElement> {
  const user = userEvent.setup();
  const mediaStream = {
    getTracks: () => [{ stop: vi.fn() }],
  } as unknown as MediaStream;
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia: vi.fn().mockResolvedValue(mediaStream) },
  });
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: vi.fn().mockReturnValue('blob:manual-wpm-test'),
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    value: vi.fn(),
  });
  let currentTimeMs = 0;
  vi.spyOn(performance, 'now').mockImplementation(() => currentTimeMs);
  vi.stubGlobal('MediaRecorder', FunctionalMediaRecorder);
  const analyzeAudio = vi.fn().mockResolvedValue({
    status: 'success',
    metrics,
  });
  render(<AudioRecorderCard analyzeAudio={analyzeAudio} />);

  await user.type(
    screen.getByRole('textbox', {
      name: /escribe lo que intentaste pronunciar/i,
    }),
    'Hoy camino con calma y confianza.',
  );
  await user.click(screen.getByRole('button', { name: 'Iniciar prueba' }));
  await waitFor(() => expect(FunctionalMediaRecorder.instances).toHaveLength(1));
  act(() => {
    FunctionalMediaRecorder.instances[0]?.emitData(
      new Blob(['audio-manual-ficticio'], { type: 'audio/webm' }),
    );
  });
  currentTimeMs = 1_200;
  await user.click(screen.getByRole('button', { name: 'Detener grabación' }));
  await user.click(
    await screen.findByRole('button', { name: 'Analizar grabación' }),
  );
  await screen.findByRole('region', {
    name: 'Resumen técnico de la captura',
  });
  await user.click(screen.getByRole('button', { name: 'Analizar texto' }));

  return screen.getByRole('region', {
    name: 'Resumen técnico del texto',
  });
}

describe('AudioRecorderCard speech text flow', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    restoreMediaDevices();
    restoreProperty(URL, 'createObjectURL', originalCreateObjectUrl);
    restoreProperty(URL, 'revokeObjectURL', originalRevokeObjectUrl);
    FunctionalMediaRecorder.instances = [];
  });

  it('permite entrada manual sin captura y mantiene WPM no disponible', async () => {
    const user = userEvent.setup();
    const getUserMedia = vi.fn();
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    });
    render(<AudioRecorderCard />);

    await user.type(
      screen.getByRole('textbox', {
        name: /escribe lo que intentaste pronunciar/i,
      }),
      'Hoy camino con calma y confianza.',
    );
    await user.click(screen.getByRole('button', { name: 'Analizar texto' }));

    const summary = screen.getByRole('region', {
      name: 'Resumen técnico del texto',
    });
    expect(within(summary).getByText(/text-metrics-v1/)).toBeInTheDocument();
    expect(
      within(summary).getByText('No disponible sin audio real analizado'),
    ).toBeInTheDocument();
    expect(
      within(summary).getByText('Comparación de texto introducido manualmente'),
    ).toBeInTheDocument();
    expect(
      within(summary).getByText(
        'Este texto fue proporcionado por el usuario. Rimay no verificó que corresponda al contenido de la grabación.',
      ),
    ).toBeInTheDocument();
    expect(within(summary).getByText('Fuente: Entrada manual.')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Escribe exactamente las palabras que pronunciaste, incluidas omisiones o palabras adicionales. No copies automáticamente la frase objetivo.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/procedencia: entrada manual/i)).toBeInTheDocument();
    expect(getUserMedia).not.toHaveBeenCalled();
  });

  it('mantiene WPM nulo para texto manual con no_speech_detected', async () => {
    const summary = await renderManualAttemptWithAudio({
      ...SUCCESSFUL_AUDIO_METRICS,
      estimatedSpeechDurationMs: 0,
      qualityFlags: ['no_speech_detected', 'transcription_missing'],
    });

    expect(
      within(summary).getByText(
        'WPM no disponible: no se detectó actividad de voz suficiente.',
      ),
    ).toBeInTheDocument();
  });

  it('mantiene WPM nulo para texto manual con too_quiet', async () => {
    const summary = await renderManualAttemptWithAudio({
      ...SUCCESSFUL_AUDIO_METRICS,
      qualityFlags: ['too_quiet', 'transcription_missing'],
    });

    expect(
      within(summary).getByText(
        'WPM no disponible: no se detectó actividad de voz suficiente.',
      ),
    ).toBeInTheDocument();
  });

  it('muestra WPM manual válido con el aviso de estimación declarada', async () => {
    const summary = await renderManualAttemptWithAudio(
      SUCCESSFUL_AUDIO_METRICS,
    );

    expect(within(summary).getByText('360.0 palabras/min')).toBeInTheDocument();
    expect(
      within(summary).getByText(
        'Estimación calculada con el número de palabras declarado por el usuario y la duración total de la captura.',
      ),
    ).toBeInTheDocument();
  });

  it('ejecuta demo sin micrófono y deja claro que el texto es predefinido', async () => {
    const user = userEvent.setup();
    const demo = new ControlledRecognizer('demo');
    const getUserMedia = vi.fn();
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    });
    render(<AudioRecorderCard demoRecognizer={demo} />);

    await user.click(screen.getByRole('radio', { name: /demostración/i }));
    expect(screen.getByText(/no solicita micrófono/i)).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: 'Iniciar demostración' }),
    );
    act(() => {
      demo.interim('hoy camino');
    });
    expect(screen.getByText(/resultado provisional/i).parentElement).toHaveTextContent(
      'hoy camino',
    );
    act(() => {
      demo.final('Hoy camino con calma y confianza.');
      demo.end();
    });
    await user.click(screen.getByRole('button', { name: 'Analizar texto' }));

    expect(screen.getByText(/procedencia: fixture demo/i)).toBeInTheDocument();
    expect(screen.getByText('Este resultado es una simulación.')).toBeInTheDocument();
    expect(
      screen.getByText(/el texto es predefinido y no está asociado a audio real/i),
    ).toBeInTheDocument();
    expect(getUserMedia).not.toHaveBeenCalled();
  });

  it('inicia MediaRecorder antes del reconocedor desde la misma acción', async () => {
    const user = userEvent.setup();
    const callOrder: string[] = [];
    const browser = new ControlledRecognizer('browser', () => {
      callOrder.push('recognizer');
    });
    const getUserMedia = vi.fn(() => {
      callOrder.push('media');
      return new Promise<MediaStream>(() => undefined);
    });
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    });
    class AvailableMediaRecorder {
      static isTypeSupported(): boolean {
        return true;
      }
    }
    vi.stubGlobal('MediaRecorder', AvailableMediaRecorder);
    render(<AudioRecorderCard browserRecognizer={browser} />);

    await user.click(
      screen.getByRole('radio', { name: /reconocimiento del navegador/i }),
    );
    expect(
      screen.getByText(/pueden enviar audio a un servicio remoto propio/i),
    ).toBeInTheDocument();
    const startButton = screen.getByRole('button', { name: 'Iniciar prueba' });
    expect(startButton).toBeDisabled();
    await user.click(
      screen.getByRole('checkbox', { name: /entiendo el aviso/i }),
    );
    expect(
      screen.getByText('La transcripción automática puede contener errores.'),
    ).toBeInTheDocument();
    await user.click(startButton);

    expect(callOrder).toEqual(['media', 'recognizer']);
  });

  it('muestra provisionales, conserva recuperación manual y cambia procedencia al editar', async () => {
    const user = userEvent.setup();
    const browser = new ControlledRecognizer('browser');
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn(() => new Promise<MediaStream>(() => undefined)),
      },
    });
    class AvailableMediaRecorder {
      static isTypeSupported(): boolean {
        return true;
      }
    }
    vi.stubGlobal('MediaRecorder', AvailableMediaRecorder);
    render(<AudioRecorderCard browserRecognizer={browser} />);

    await user.click(
      screen.getByRole('radio', { name: /reconocimiento del navegador/i }),
    );
    await user.click(
      screen.getByRole('checkbox', { name: /entiendo el aviso/i }),
    );
    await user.click(screen.getByRole('button', { name: 'Iniciar prueba' }));
    act(() => browser.interim('hoy camino'));
    expect(screen.getByText(/resultado provisional/i).parentElement).toHaveTextContent(
      'hoy camino',
    );
    act(() => browser.final('Hoy camino con calma y confianza.'));

    const textBox = screen.getByRole('textbox', {
      name: /texto final o corrección manual/i,
    });
    expect(textBox).toHaveValue('Hoy camino con calma y confianza.');
    await user.clear(textBox);
    await user.type(textBox, 'Hoy camino con mucha calma.');

    expect(screen.getByText(/procedencia: entrada manual/i)).toHaveTextContent(
      /al editar un resultado automático/i,
    );

    act(() => browser.error());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(textBox).toHaveValue('Hoy camino con mucha calma.');
  });

  it('ofrece entrada manual cuando el reconocimiento falla antes del final', async () => {
    const user = userEvent.setup();
    const browser = new ControlledRecognizer('browser');
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn(() => new Promise<MediaStream>(() => undefined)),
      },
    });
    class AvailableMediaRecorder {
      static isTypeSupported(): boolean {
        return true;
      }
    }
    vi.stubGlobal('MediaRecorder', AvailableMediaRecorder);
    render(<AudioRecorderCard browserRecognizer={browser} />);

    await user.click(
      screen.getByRole('radio', { name: /reconocimiento del navegador/i }),
    );
    await user.click(
      screen.getByRole('checkbox', { name: /entiendo el aviso/i }),
    );
    await user.click(screen.getByRole('button', { name: 'Iniciar prueba' }));
    act(() => browser.error());

    expect(screen.getByRole('alert')).toHaveTextContent(
      /continuar con entrada manual/i,
    );
    const textBox = screen.getByRole('textbox', {
      name: /texto final o corrección manual/i,
    });
    await user.type(textBox, 'Texto declarado por la persona.');
    expect(screen.getByText(/procedencia: entrada manual/i)).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: 'Cambiar a entrada manual' }),
    );
    expect(screen.getByRole('radio', { name: /entrada manual/i })).toBeChecked();
  });

  it('conserva grabación, reproducción y análisis si falla el reconocimiento', async () => {
    const user = userEvent.setup();
    const browser = new ControlledRecognizer('browser');
    const stopTrack = vi.fn();
    const mediaStream = {
      getTracks: () => [{ stop: stopTrack }],
    } as unknown as MediaStream;
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: vi.fn().mockResolvedValue(mediaStream) },
    });
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn().mockReturnValue('blob:speech-error-test'),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
    });
    let currentTimeMs = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => currentTimeMs);
    vi.stubGlobal('MediaRecorder', FunctionalMediaRecorder);
    const analyzeAudio = vi.fn().mockResolvedValue({
      status: 'success',
      metrics: SUCCESSFUL_AUDIO_METRICS,
    });
    render(
      <AudioRecorderCard
        analyzeAudio={analyzeAudio}
        browserRecognizer={browser}
      />,
    );

    await user.click(
      screen.getByRole('radio', { name: /reconocimiento del navegador/i }),
    );
    await user.click(
      screen.getByRole('checkbox', { name: /entiendo el aviso/i }),
    );
    await user.click(screen.getByRole('button', { name: 'Iniciar prueba' }));
    await waitFor(() => expect(FunctionalMediaRecorder.instances).toHaveLength(1));
    act(() => {
      FunctionalMediaRecorder.instances[0]?.emitData(
        new Blob(['audio-ficticio'], { type: 'audio/webm' }),
      );
      browser.error();
    });
    expect(FunctionalMediaRecorder.instances[0]?.state).toBe('recording');

    currentTimeMs = 1_200;
    await user.click(
      screen.getByRole('button', {
        name: 'Detener grabación y reconocimiento',
      }),
    );

    expect(browser.active.stop).toHaveBeenCalledOnce();
    expect(
      await screen.findByLabelText('Reproducir la grabación local'),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: 'Analizar grabación' }),
    );
    expect(
      await screen.findByRole('region', {
        name: 'Resumen técnico de la captura',
      }),
    ).toBeInTheDocument();
    expect(stopTrack).toHaveBeenCalledOnce();
  });

  it('cancela el reconocimiento cuando falla la captura', async () => {
    const user = userEvent.setup();
    const browser = new ControlledRecognizer('browser');
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi
          .fn()
          .mockRejectedValue(new DOMException('denied', 'NotAllowedError')),
      },
    });
    class AvailableMediaRecorder {
      static isTypeSupported(): boolean {
        return true;
      }
    }
    vi.stubGlobal('MediaRecorder', AvailableMediaRecorder);
    render(<AudioRecorderCard browserRecognizer={browser} />);

    await user.click(
      screen.getByRole('radio', { name: /reconocimiento del navegador/i }),
    );
    await user.click(
      screen.getByRole('checkbox', { name: /entiendo el aviso/i }),
    );
    await user.click(screen.getByRole('button', { name: 'Iniciar prueba' }));

    expect(
      await screen.findByText('No pudimos completar la grabación.'),
    ).toBeInTheDocument();
    await waitFor(() => expect(browser.active.abort).toHaveBeenCalledOnce());
    expect(browser.active.dispose).toHaveBeenCalledOnce();
  });

  it('presenta errores accesibles para texto manual vacío y demo inválida', async () => {
    const user = userEvent.setup();
    const demo = new ControlledRecognizer('demo');
    render(<AudioRecorderCard demoRecognizer={demo} />);

    await user.click(screen.getByRole('button', { name: 'Analizar texto' }));
    expect(screen.getByRole('alert')).toHaveTextContent(
      /escribe el texto del intento/i,
    );

    await user.click(screen.getByRole('radio', { name: /demostración/i }));
    await user.click(screen.getByRole('button', { name: 'Analizar texto' }));
    expect(screen.getByRole('alert')).toHaveTextContent(
      /resultado demo no contiene un texto final válido/i,
    );
  });

  it('descartar elimina texto y métricas y permite comenzar limpio', async () => {
    const user = userEvent.setup();
    render(<AudioRecorderCard />);
    const textBox = screen.getByRole('textbox', {
      name: /escribe lo que intentaste pronunciar/i,
    });
    await user.type(textBox, 'Hoy camino con calma y confianza.');
    await user.click(screen.getByRole('button', { name: 'Analizar texto' }));
    expect(
      screen.getByRole('region', { name: 'Resumen técnico del texto' }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Descartar texto e iniciar de nuevo' }),
    );

    expect(textBox).toHaveValue('');
    expect(
      screen.queryByRole('region', { name: 'Resumen técnico del texto' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Iniciar prueba' })).toBeEnabled();
  });
});

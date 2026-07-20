import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createAudioBufferLike,
  createSegmentedSignal,
} from '../../test/fixtures/audio/syntheticAudio';
import type { AudioAnalysisResult } from '../../domain/audio';
import { AudioRecorderCard } from './AudioRecorderCard';
import { MICROPHONE_REQUEST_TIMEOUT_MS } from './recordingSupport';

class MockMediaRecorder {
  static constructionError: Error | null = null;
  static instances: MockMediaRecorder[] = [];
  static isTypeSupported = vi.fn(
    (mimeType: string) => mimeType === 'audio/mp4;codecs=mp4a.40.2',
  );
  static startCallCount = 0;

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

    if (MockMediaRecorder.constructionError !== null) {
      throw MockMediaRecorder.constructionError;
    }

    MockMediaRecorder.instances.push(this);
  }

  emitData(data: Blob): void {
    this.ondataavailable?.(new BlobEvent('dataavailable', { data }));
  }

  start(): void {
    MockMediaRecorder.startCallCount += 1;
    this.state = 'recording';
  }

  stop(): void {
    this.state = 'inactive';
    this.onstop?.();
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
const originalBlobArrayBuffer = Object.getOwnPropertyDescriptor(
  Blob.prototype,
  'arrayBuffer',
);

let currentTimeMs = 0;
let getUserMedia: ReturnType<typeof vi.fn>;
let mediaStream: MediaStream;
let stopTrack: ReturnType<typeof vi.fn>;
let createObjectUrl: ReturnType<typeof vi.fn>;
let revokeObjectUrl: ReturnType<typeof vi.fn>;

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
}

function createDeferred<T>(): Deferred<T> {
  let resolvePromise: (value: T) => void = () => undefined;
  const promise = new Promise<T>((resolve) => {
    resolvePromise = resolve;
  });

  return { promise, resolve: resolvePromise };
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

describe('AudioRecorderCard', () => {
  beforeEach(() => {
    currentTimeMs = 0;
    MockMediaRecorder.constructionError = null;
    MockMediaRecorder.instances = [];
    MockMediaRecorder.isTypeSupported.mockClear();
    MockMediaRecorder.startCallCount = 0;
    stopTrack = vi.fn();
    mediaStream = {
      getTracks: () => [{ stop: stopTrack }],
    } as unknown as MediaStream;
    getUserMedia = vi.fn().mockResolvedValue(mediaStream);
    createObjectUrl = vi.fn().mockReturnValue('blob:rimay-test');
    revokeObjectUrl = vi.fn();

    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    });
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectUrl,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectUrl,
    });
    vi.stubGlobal('MediaRecorder', MockMediaRecorder);
    vi.spyOn(performance, 'now').mockImplementation(() => currentTimeMs);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    restoreProperty(navigator, 'mediaDevices', originalMediaDevices);
    restoreProperty(URL, 'createObjectURL', originalCreateObjectUrl);
    restoreProperty(URL, 'revokeObjectURL', originalRevokeObjectUrl);
    restoreProperty(Blob.prototype, 'arrayBuffer', originalBlobArrayBuffer);
  });

  it('solicita permiso solo al iniciar, graba, detiene y libera el micrófono', async () => {
    const user = userEvent.setup();
    render(<AudioRecorderCard />);

    expect(getUserMedia).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Iniciar prueba' }));

    expect(getUserMedia).toHaveBeenCalledTimes(1);
    expect(getUserMedia).toHaveBeenCalledWith({ audio: true });
    expect(MockMediaRecorder.isTypeSupported).toHaveBeenCalledWith(
      'audio/mp4;codecs=mp4a.40.2',
    );
    expect(MockMediaRecorder.startCallCount).toBe(1);
    expect(
      screen.getByText(/formato: audio\/mp4;codecs=mp4a\.40\.2/i),
    ).toBeInTheDocument();

    const recorder = MockMediaRecorder.instances[0];
    expect(recorder).toBeDefined();

    act(() => {
      recorder?.emitData(new Blob(['audio-demo'], { type: 'audio/webm' }));
    });
    currentTimeMs = 1_200;
    await user.click(screen.getByRole('button', { name: 'Detener grabación' }));

    expect(await screen.findByLabelText('Reproducir la grabación local')).toHaveAttribute(
      'src',
      'blob:rimay-test',
    );
    expect(createObjectUrl).toHaveBeenCalledTimes(1);
    expect(stopTrack).toHaveBeenCalledTimes(1);
  });

  it('inicia la grabación en StrictMode cuando el permiso ya estaba concedido', async () => {
    const user = userEvent.setup();
    render(
      <StrictMode>
        <AudioRecorderCard />
      </StrictMode>,
    );

    await user.click(screen.getByRole('button', { name: 'Iniciar prueba' }));

    expect(getUserMedia).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Detener grabación' })).toBeEnabled();
    expect(screen.getByRole('status')).toHaveTextContent(/grabando/i);
  });

  it('transiciona idle → requestingPermission → recording', async () => {
    const streamRequest = createDeferred<MediaStream>();
    getUserMedia.mockReturnValueOnce(streamRequest.promise);
    render(<AudioRecorderCard />);

    expect(screen.getByRole('status')).toHaveTextContent(
      'Listo para iniciar la prueba del micrófono.',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Iniciar prueba' }));

    expect(screen.getByRole('status')).toHaveTextContent(
      'Solicitando acceso al micrófono…',
    );
    expect(screen.getByRole('button', { name: 'Iniciar prueba' })).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Detener grabación' }),
    ).toBeDisabled();

    await act(async () => {
      streamRequest.resolve(mediaStream);
      await streamRequest.promise;
    });

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/grabando/i);
    });
    expect(
      screen.getByRole('button', { name: 'Detener grabación' }),
    ).toBeEnabled();
  });

  it('evita solicitudes simultáneas ante un doble clic', async () => {
    const user = userEvent.setup();
    const streamRequest = createDeferred<MediaStream>();
    getUserMedia.mockReturnValueOnce(streamRequest.promise);
    render(<AudioRecorderCard />);

    const startButton = screen.getByRole('button', { name: 'Iniciar prueba' });
    await user.dblClick(startButton);

    expect(startButton).toBeDisabled();
    expect(getUserMedia).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status')).toHaveTextContent(
      'Solicitando acceso al micrófono…',
    );
  });

  it('muestra errores accesibles para permiso denegado y micrófono ausente', async () => {
    const user = userEvent.setup();
    getUserMedia.mockRejectedValueOnce(new DOMException('', 'NotAllowedError'));
    const { unmount } = render(<AudioRecorderCard />);

    await user.click(screen.getByRole('button', { name: 'Iniciar prueba' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/permiso.*rechazado/i);
    expect(screen.getByRole('status')).toHaveTextContent(/no se completó/i);
    expect(
      screen.getByRole('button', { name: 'Intentar de nuevo' }),
    ).toBeEnabled();

    unmount();
    getUserMedia.mockRejectedValueOnce(new DOMException('', 'NotFoundError'));
    render(<AudioRecorderCard />);
    await user.click(screen.getByRole('button', { name: 'Iniciar prueba' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      /no encontramos un micrófono/i,
    );
  });

  it('libera los tracks si falla la creación de MediaRecorder', async () => {
    const user = userEvent.setup();
    MockMediaRecorder.constructionError = new Error('constructor failed');
    render(<AudioRecorderCard />);

    await user.click(screen.getByRole('button', { name: 'Iniciar prueba' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /grabación se interrumpió/i,
    );
    expect(screen.getByRole('status')).toHaveTextContent(/no se completó/i);
    expect(stopTrack).toHaveBeenCalledTimes(1);
    expect(MockMediaRecorder.startCallCount).toBe(0);
  });

  it('sale de requestingPermission al superar el timeout y cierra un stream tardío', async () => {
    vi.useFakeTimers();
    const streamRequest = createDeferred<MediaStream>();
    getUserMedia.mockReturnValueOnce(streamRequest.promise);
    render(<AudioRecorderCard />);

    fireEvent.click(screen.getByRole('button', { name: 'Iniciar prueba' }));
    expect(screen.getByRole('status')).toHaveTextContent(
      'Solicitando acceso al micrófono…',
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(MICROPHONE_REQUEST_TIMEOUT_MS);
    });

    expect(screen.getByRole('alert')).toHaveTextContent(/tardó demasiado/i);
    expect(screen.getByRole('status')).toHaveTextContent(/no se completó/i);
    expect(
      screen.getByRole('button', { name: 'Intentar de nuevo' }),
    ).toBeEnabled();

    await act(async () => {
      streamRequest.resolve(mediaStream);
      await streamRequest.promise;
    });

    expect(stopTrack).toHaveBeenCalledTimes(1);
    expect(MockMediaRecorder.instances).toHaveLength(0);
  });

  it('explica cuando el navegador no soporta la captura', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('MediaRecorder', undefined);
    render(<AudioRecorderCard />);

    await user.click(screen.getByRole('button', { name: 'Iniciar prueba' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /versión actual de Chrome o Edge/i,
    );
    expect(getUserMedia).not.toHaveBeenCalled();
  });

  it('rechaza capturas vacías o demasiado cortas sin crear una URL', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<AudioRecorderCard />);
    await user.click(screen.getByRole('button', { name: 'Iniciar prueba' }));
    currentTimeMs = 1_000;
    await user.click(screen.getByRole('button', { name: 'Detener grabación' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/no se capturó audio/i);

    unmount();
    render(<AudioRecorderCard />);
    currentTimeMs = 0;
    await user.click(screen.getByRole('button', { name: 'Iniciar prueba' }));
    const recorder = MockMediaRecorder.instances.at(-1);
    act(() => {
      recorder?.emitData(new Blob(['breve'], { type: 'audio/webm' }));
    });
    currentTimeMs = 100;
    await user.click(screen.getByRole('button', { name: 'Detener grabación' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/demasiado corta/i);
    expect(createObjectUrl).not.toHaveBeenCalled();
  });

  it('revoca la URL al descartar una grabación válida', async () => {
    const user = userEvent.setup();
    render(<AudioRecorderCard />);
    await user.click(screen.getByRole('button', { name: 'Iniciar prueba' }));
    act(() => {
      MockMediaRecorder.instances[0]?.emitData(
        new Blob(['audio-demo'], { type: 'audio/webm' }),
      );
    });
    currentTimeMs = 900;
    await user.click(screen.getByRole('button', { name: 'Detener grabación' }));
    await user.click(
      await screen.findByRole('button', {
        name: 'Descartar y grabar de nuevo',
      }),
    );

    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:rimay-test');
    expect(
      screen.queryByLabelText('Reproducir la grabación local'),
    ).not.toBeInTheDocument();
  });

  it('descarta una captura que supera 10 MB y detiene sus pistas', async () => {
    const user = userEvent.setup();
    render(<AudioRecorderCard />);
    await user.click(screen.getByRole('button', { name: 'Iniciar prueba' }));
    const oversizedBlob = new Blob(['límite'], { type: 'audio/webm' });
    Object.defineProperty(oversizedBlob, 'size', { value: 10_000_001 });

    act(() => {
      MockMediaRecorder.instances[0]?.emitData(oversizedBlob);
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(/límite de 10 MB/i);
    expect(createObjectUrl).not.toHaveBeenCalled();
    expect(stopTrack).toHaveBeenCalledTimes(1);
  });

  it('detiene las pistas al desmontar durante una grabación', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<AudioRecorderCard />);
    await user.click(screen.getByRole('button', { name: 'Iniciar prueba' }));

    unmount();

    expect(stopTrack).toHaveBeenCalledTimes(1);
  });

  it('integra Blob, decodificación Web Audio simulada y presentación de métricas', async () => {
    const user = userEvent.setup();
    const decodedAudio = createAudioBufferLike(
      [
        createSegmentedSignal(
          [
            { amplitude: 0.2, durationMs: 400 },
            { amplitude: 0, durationMs: 400 },
            { amplitude: 0.2, durationMs: 400 },
            { amplitude: 0, durationMs: 400 },
            { amplitude: 0.2, durationMs: 400 },
          ],
          1_000,
        ),
      ],
      1_000,
    );
    const decodedAudioRequest = createDeferred<typeof decodedAudio>();
    const decodeAudioData = vi
      .fn()
      .mockReturnValue(decodedAudioRequest.promise);
    const close = vi.fn().mockResolvedValue(undefined);

    class MockAudioContext {
      decodeAudioData = decodeAudioData;
      close = close;
    }

    Object.defineProperty(Blob.prototype, 'arrayBuffer', {
      configurable: true,
      value: vi.fn().mockResolvedValue(new ArrayBuffer(16)),
    });
    vi.stubGlobal('AudioContext', MockAudioContext);
    render(<AudioRecorderCard />);

    await user.type(
      screen.getByRole('textbox', {
        name: /escribe lo que intentaste pronunciar/i,
      }),
      'Hoy camino con calma y confianza.',
    );

    await user.click(screen.getByRole('button', { name: 'Iniciar prueba' }));
    act(() => {
      MockMediaRecorder.instances[0]?.emitData(
        new Blob(['audio-ficticio'], { type: 'audio/webm' }),
      );
    });
    currentTimeMs = 1_200;
    await user.click(screen.getByRole('button', { name: 'Detener grabación' }));
    await user.click(
      await screen.findByRole('button', { name: 'Analizar grabación' }),
    );

    expect(screen.getByText('Procesando el audio localmente…')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Analizando grabación…' }),
    ).toBeDisabled();

    await act(async () => {
      decodedAudioRequest.resolve(decodedAudio);
      await decodedAudioRequest.promise;
    });

    const summary = await screen.findByRole('region', {
      name: 'Resumen técnico de la captura',
    });
    expect(within(summary).getByText('2.0 s')).toBeInTheDocument();
    expect(within(summary).getByText(/audio-metrics-v1/i)).toBeInTheDocument();
    expect(
      within(summary).getByText(
        'Estas métricas son técnicas y experimentales. No representan una evaluación clínica.',
      ),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Analizar texto' }));
    const textSummary = screen.getByRole('region', {
      name: 'Resumen técnico del texto',
    });
    expect(within(textSummary).getByText('180.0 palabras/min')).toBeInTheDocument();
    expect(
      within(textSummary).getByText(
        'Estimación calculada con el número de palabras declarado por el usuario y la duración total de la captura.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('Reproducir la grabación local'),
    ).toBeInTheDocument();
    expect(decodeAudioData).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('conserva el reproductor y ofrece reintento cuando la decodificación falla', async () => {
    const user = userEvent.setup();
    const analyzeAudio = vi.fn().mockResolvedValue({
      status: 'error',
      error: {
        code: 'decode_failed',
        message:
          'No pudimos decodificar esta grabación. Puedes escucharla si el reproductor funciona o grabar una nueva.',
      },
    });
    render(<AudioRecorderCard analyzeAudio={analyzeAudio} />);

    await user.click(screen.getByRole('button', { name: 'Iniciar prueba' }));
    act(() => {
      MockMediaRecorder.instances[0]?.emitData(
        new Blob(['audio-incompatible'], { type: 'audio/webm' }),
      );
    });
    currentTimeMs = 1_200;
    await user.click(screen.getByRole('button', { name: 'Detener grabación' }));
    await user.click(
      await screen.findByRole('button', { name: 'Analizar grabación' }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /no pudimos decodificar/i,
    );
    expect(
      screen.getByLabelText('Reproducir la grabación local'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Analizar nuevamente' }),
    ).toBeEnabled();

    const firstBlob = analyzeAudio.mock.calls[0]?.[0];
    await user.click(
      screen.getByRole('button', { name: 'Analizar nuevamente' }),
    );
    expect(analyzeAudio).toHaveBeenCalledTimes(2);
    expect(analyzeAudio.mock.calls[1]?.[0]).toBe(firstBlob);
  });

  it('ignora un resultado tardío y libera la URL al desmontar durante el análisis', async () => {
    const user = userEvent.setup();
    const analysisRequest = createDeferred<AudioAnalysisResult>();
    const analyzeAudio = vi.fn().mockReturnValue(analysisRequest.promise);
    const { unmount } = render(
      <AudioRecorderCard analyzeAudio={analyzeAudio} />,
    );

    await user.click(screen.getByRole('button', { name: 'Iniciar prueba' }));
    act(() => {
      MockMediaRecorder.instances[0]?.emitData(
        new Blob(['audio-ficticio'], { type: 'audio/webm' }),
      );
    });
    currentTimeMs = 1_200;
    await user.click(screen.getByRole('button', { name: 'Detener grabación' }));
    await user.click(
      await screen.findByRole('button', { name: 'Analizar grabación' }),
    );
    expect(analyzeAudio).toHaveBeenCalledTimes(1);

    unmount();
    await act(async () => {
      analysisRequest.resolve({
        status: 'error',
        error: {
          code: 'decode_failed',
          message: 'Resultado tardío ficticio.',
        },
      });
      await analysisRequest.promise;
    });

    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:rimay-test');
  });
});

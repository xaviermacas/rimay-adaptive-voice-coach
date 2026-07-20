import { act, renderHook } from '@testing-library/react';
import { StrictMode, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAudioRecorder } from './useAudioRecorder';

class OrderedMediaRecorder {
  static instances: OrderedMediaRecorder[] = [];
  static isTypeSupported = vi.fn(
    (mimeType: string) => mimeType === 'audio/webm;codecs=opus',
  );

  mimeType: string;
  ondataavailable: ((event: BlobEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  onstop: (() => void) | null = null;
  state: RecordingState = 'inactive';
  readonly requestData = vi.fn();
  readonly stop = vi.fn(() => {
    // El cambio a inactive y el evento stop ocurren en una tarea posterior.
  });
  handlersReadyAtStart = false;

  constructor(
    readonly stream: MediaStream,
    options?: MediaRecorderOptions,
  ) {
    this.mimeType = options?.mimeType ?? '';
    OrderedMediaRecorder.instances.push(this);
  }

  start(): void {
    this.handlersReadyAtStart =
      this.ondataavailable !== null && this.onerror !== null && this.onstop !== null;
    this.state = 'recording';
  }

  emitData(data: Blob): void {
    this.ondataavailable?.(new BlobEvent('dataavailable', { data }));
  }

  emitStop(): void {
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

type RecorderResult = {
  readonly current: ReturnType<typeof useAudioRecorder>;
};

let currentTimeMs = 0;
let stopTrack: ReturnType<typeof vi.fn>;
let createObjectUrl: ReturnType<typeof vi.fn>;
let revokeObjectUrl: ReturnType<typeof vi.fn>;
let createdBlobs: Blob[];

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

async function readBlob(blob: Blob): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () =>
      reject(reader.error ?? new Error('No se pudo leer el Blob'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsText(blob);
  });
}

async function startRecording(
  result: RecorderResult,
): Promise<OrderedMediaRecorder> {
  await act(async () => {
    await result.current.startRecording();
  });
  const recorder = OrderedMediaRecorder.instances.at(-1);
  if (recorder === undefined) {
    throw new Error('MediaRecorder no fue creado');
  }
  return recorder;
}

function requestStop(result: RecorderResult): void {
  currentTimeMs = 1_200;
  act(() => result.current.stopRecording());
}

function finishStop(
  recorder: OrderedMediaRecorder,
  chunks: readonly Blob[],
): void {
  act(() => {
    for (const chunk of chunks) {
      recorder.emitData(chunk);
    }
    recorder.emitStop();
  });
}

describe('useAudioRecorder: finalización ordenada', () => {
  beforeEach(() => {
    currentTimeMs = 0;
    OrderedMediaRecorder.instances = [];
    OrderedMediaRecorder.isTypeSupported.mockClear();
    stopTrack = vi.fn();
    createdBlobs = [];
    createObjectUrl = vi.fn((blob: Blob) => {
      createdBlobs.push(blob);
      return `blob:rimay-${createdBlobs.length}`;
    });
    revokeObjectUrl = vi.fn();

    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: stopTrack }],
        } as unknown as MediaStream),
      },
    });
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectUrl,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectUrl,
    });
    vi.stubGlobal('MediaRecorder', OrderedMediaRecorder);
    vi.spyOn(performance, 'now').mockImplementation(() => currentTimeMs);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    restoreProperty(navigator, 'mediaDevices', originalMediaDevices);
    restoreProperty(URL, 'createObjectURL', originalCreateObjectUrl);
    restoreProperty(URL, 'revokeObjectURL', originalRevokeObjectUrl);
  });

  it('espera dataavailable final después de solicitar stop', async () => {
    const { result } = renderHook(() => useAudioRecorder());
    const recorder = await startRecording(result);

    expect(recorder.handlersReadyAtStart).toBe(true);
    requestStop(result);

    expect(recorder.requestData).toHaveBeenCalledOnce();
    expect(result.current.status).toBe('processing');
    expect(result.current.recordedAudio).toBeNull();
    expect(stopTrack).not.toHaveBeenCalled();

    finishStop(recorder, [new Blob(['final'], { type: 'audio/webm' })]);

    expect(result.current.status).toBe('recorded');
    expect(result.current.recordedAudio?.sizeBytes).toBe(5);
    expect(stopTrack).toHaveBeenCalledOnce();
  });

  it('crea el Blob sólo después de incluir el último chunk', async () => {
    const { result } = renderHook(() => useAudioRecorder());
    const recorder = await startRecording(result);
    recorder.emitData(new Blob(['inicio-'], { type: 'audio/webm' }));
    requestStop(result);

    recorder.emitData(new Blob(['final'], { type: 'audio/webm' }));
    expect(createObjectUrl).not.toHaveBeenCalled();
    act(() => recorder.emitStop());

    expect(await readBlob(createdBlobs[0] as Blob)).toBe('inicio-final');
  });

  it('ignora chunks vacíos', async () => {
    const { result } = renderHook(() => useAudioRecorder());
    const recorder = await startRecording(result);
    requestStop(result);
    finishStop(recorder, [
      new Blob([], { type: 'audio/webm' }),
      new Blob(['audio'], { type: 'audio/webm' }),
    ]);

    expect(result.current.recordedAudio?.sizeBytes).toBe(5);
    expect(await readBlob(result.current.recordedAudio?.blob as Blob)).toBe('audio');
  });

  it('incluye todos los chunks válidos en orden', async () => {
    const { result } = renderHook(() => useAudioRecorder());
    const recorder = await startRecording(result);
    recorder.emitData(new Blob(['uno-'], { type: 'audio/webm' }));
    requestStop(result);
    finishStop(recorder, [
      new Blob(['dos-'], { type: 'audio/webm' }),
      new Blob(['tres'], { type: 'audio/webm' }),
    ]);

    expect(await readBlob(result.current.recordedAudio?.blob as Blob)).toBe(
      'uno-dos-tres',
    );
  });

  it('usa el mimeType real del MediaRecorder y conserva el tamaño real', async () => {
    const { result } = renderHook(() => useAudioRecorder());
    const recorder = await startRecording(result);
    recorder.mimeType = 'audio/mp4';
    requestStop(result);
    finishStop(recorder, [new Blob(['audio-real'], { type: 'audio/mp4' })]);

    expect(result.current.recordedAudio).toMatchObject({
      mimeType: 'audio/mp4',
      sizeBytes: 10,
    });
    expect(result.current.recordedAudio?.blob.type).toBe('audio/mp4');
  });

  it('usa el MIME negociado cuando mediaRecorder.mimeType está vacío', async () => {
    const { result } = renderHook(() => useAudioRecorder());
    const recorder = await startRecording(result);
    recorder.mimeType = '';
    requestStop(result);
    finishStop(recorder, [new Blob(['audio'], { type: '' })]);

    expect(result.current.recordedAudio?.mimeType).toBe(
      'audio/webm;codecs=opus',
    );
    expect(result.current.recordedAudio?.blob.type).toBe(
      'audio/webm;codecs=opus',
    );
  });

  it('ignora un segundo stop y finaliza una sola vez', async () => {
    const { result } = renderHook(() => useAudioRecorder());
    const recorder = await startRecording(result);
    requestStop(result);
    act(() => result.current.stopRecording());
    finishStop(recorder, [new Blob(['audio'], { type: 'audio/webm' })]);
    act(() => recorder.emitStop());

    expect(recorder.stop).toHaveBeenCalledOnce();
    expect(recorder.requestData).toHaveBeenCalledOnce();
    expect(createObjectUrl).toHaveBeenCalledOnce();
  });

  it('pospone cleanup hasta stop aunque se descarte antes del final', async () => {
    const { result } = renderHook(() => useAudioRecorder());
    const recorder = await startRecording(result);
    requestStop(result);
    act(() => result.current.reset());

    expect(stopTrack).not.toHaveBeenCalled();
    expect(recorder.ondataavailable).not.toBeNull();
    expect(recorder.onstop).not.toBeNull();

    finishStop(recorder, [new Blob(['tardío'], { type: 'audio/webm' })]);
    expect(stopTrack).toHaveBeenCalledOnce();
    expect(createObjectUrl).not.toHaveBeenCalled();
    expect(result.current.status).toBe('idle');
  });

  it('ignora el resultado tardío anterior sin contaminar la sesión nueva', async () => {
    const { result } = renderHook(() => useAudioRecorder());
    const oldRecorder = await startRecording(result);
    act(() => result.current.reset());
    const newRecorder = await startRecording(result);

    finishStop(oldRecorder, [new Blob(['viejo'], { type: 'audio/webm' })]);
    expect(result.current.status).toBe('recording');
    expect(createObjectUrl).not.toHaveBeenCalled();

    requestStop(result);
    finishStop(newRecorder, [new Blob(['nuevo'], { type: 'audio/webm' })]);
    expect(await readBlob(result.current.recordedAudio?.blob as Blob)).toBe('nuevo');
  });

  it('ignora el resultado tardío después de desmontar y libera al terminar', async () => {
    const { result, unmount } = renderHook(() => useAudioRecorder());
    const recorder = await startRecording(result);

    unmount();
    expect(stopTrack).not.toHaveBeenCalled();
    finishStop(recorder, [new Blob(['tardío'], { type: 'audio/webm' })]);

    expect(stopTrack).toHaveBeenCalledOnce();
    expect(createObjectUrl).not.toHaveBeenCalled();
  });

  it('una grabación nueva no reutiliza chunks de la anterior', async () => {
    const { result } = renderHook(() => useAudioRecorder());
    const first = await startRecording(result);
    requestStop(result);
    finishStop(first, [new Blob(['primero'], { type: 'audio/webm' })]);
    act(() => result.current.reset());

    currentTimeMs = 0;
    const second = await startRecording(result);
    requestStop(result);
    finishStop(second, [new Blob(['segundo'], { type: 'audio/webm' })]);

    expect(await readBlob(result.current.recordedAudio?.blob as Blob)).toBe(
      'segundo',
    );
  });

  it('Strict Mode no provoca una finalización prematura', async () => {
    const wrapper = ({ children }: { readonly children: ReactNode }) => (
      <StrictMode>{children}</StrictMode>
    );
    const { result } = renderHook(() => useAudioRecorder(), { wrapper });
    const recorder = await startRecording(result);

    expect(result.current.status).toBe('recording');
    expect(recorder.stop).not.toHaveBeenCalled();
    expect(stopTrack).not.toHaveBeenCalled();

    requestStop(result);
    finishStop(recorder, [new Blob(['audio'], { type: 'audio/webm' })]);
    expect(result.current.status).toBe('recorded');
  });

  it('devuelve audio_empty recuperable si no existen chunks válidos', async () => {
    const { result } = renderHook(() => useAudioRecorder());
    const recorder = await startRecording(result);
    requestStop(result);
    finishStop(recorder, [new Blob([], { type: 'audio/webm' })]);

    expect(result.current.error?.code).toBe('audio_empty');
    expect(result.current.recordedAudio).toBeNull();
    act(() => result.current.reset());
    expect(result.current.status).toBe('idle');

    currentTimeMs = 0;
    const retry = await startRecording(result);
    requestStop(result);
    finishStop(retry, [new Blob(['audio'], { type: 'audio/webm' })]);
    expect(result.current.status).toBe('recorded');
  });

  it('mantiene la URL hasta descartar o reemplazar la captura', async () => {
    const { result } = renderHook(() => useAudioRecorder());
    const recorder = await startRecording(result);
    requestStop(result);
    finishStop(recorder, [new Blob(['audio'], { type: 'audio/webm' })]);

    expect(revokeObjectUrl).not.toHaveBeenCalled();
    currentTimeMs = 0;
    await startRecording(result);
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:rimay-1');
  });
});

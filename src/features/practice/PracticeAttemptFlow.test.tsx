import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { DeterministicMetrics } from '../../domain/audio';
import type {
  ActiveRecognition,
  RecognitionCallbacks,
  SpeechRecognizer,
} from '../../domain/contracts';
import { evaluateCoach, type CoachInput, type CoachResult } from '../../domain/coaching';
import {
  createSpeechOutputHarness,
  spanishVoice,
} from '../../test/fixtures/speech-output/browserSpeechOutput';
import { PracticeAttemptFlow } from './PracticeAttemptFlow';

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

class ControlledBrowserRecognizer implements SpeechRecognizer {
  readonly source = 'browser' as const;
  readonly active: ActiveRecognition = {
    stop: vi.fn(),
    abort: vi.fn(),
    dispose: vi.fn(),
  };
  callbacks: RecognitionCallbacks | null = null;
  startCount = 0;

  isSupported(): boolean {
    return true;
  }

  start(input: {
    readonly languageTag: string;
    readonly callbacks: RecognitionCallbacks;
  }): ActiveRecognition {
    this.startCount += 1;
    this.callbacks = input.callbacks;
    return this.active;
  }

  interim(text: string): void {
    this.callbacks?.onInterim(text);
  }

  final(text: string): void {
    this.callbacks?.onFinal(text);
  }

  fail(): void {
    this.callbacks?.onError('network_failed');
    this.callbacks?.onEnd();
  }
}

const SUCCESSFUL_AUDIO_METRICS: DeterministicMetrics = {
  algorithmVersion: 'audio-metrics-v1',
  sampleRateHz: 48_000,
  channelCount: 1,
  totalDurationMs: 1_200,
  analyzedDurationMs: 1_200,
  estimatedSpeechDurationMs: 800,
  silenceDurationMs: 400,
  silenceRatio: 0.3333,
  pauseCount: 0,
  averagePauseDurationMs: null,
  maximumPauseDurationMs: null,
  rms: 0.1,
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

const COMPLETE_RESULT: CoachResult = {
  ok: true,
  decision: {
    rulesVersion: 'coach-rules-v1',
    ruleId: 'complete_fifth_valid_attempt',
    templateId: 'session-complete-v1',
    shortFeedback: 'No debe mostrarse.',
    focus: 'complete',
    action: 'complete_session',
    explanation: 'Resultado controlado.',
    evidenceKeys: ['qualityFlags'],
    selectedExerciseId: null,
  },
};

const REPEAT_RESULT: CoachResult = {
  ok: true,
  decision: {
    rulesVersion: 'coach-rules-v1',
    ruleId: 'capture_quality_blocking',
    templateId: 'capture-clear-v1',
    shortFeedback: 'Prueba otra captura cuando estés listo.',
    focus: 'clear_capture',
    action: 'repeat_current',
    explanation: 'La captura necesita repetirse.',
    evidenceKeys: ['qualityFlags', 'silenceRatio'],
    selectedExerciseId: null,
  },
};

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

let currentTimeMs = 0;
let getUserMedia: ReturnType<typeof vi.fn>;
let stopTrack: ReturnType<typeof vi.fn>;
let revokeObjectUrl: ReturnType<typeof vi.fn>;

interface Deferred<T> {
  readonly promise: Promise<T>;
  readonly resolve: (value: T) => void;
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

async function openModeChoice(): Promise<void> {
  await userEvent.click(screen.getByRole('button', { name: 'Preparar intento' }));
}

async function finishRecording(): Promise<void> {
  await waitFor(() => expect(FunctionalMediaRecorder.instances).toHaveLength(1));
  act(() => {
    FunctionalMediaRecorder.instances[0]?.emitData(
      new Blob(['audio-ficticio'], { type: 'audio/webm' }),
    );
  });
  currentTimeMs = 1_200;
}

async function prepareManualAttemptForAnalysis(): Promise<void> {
  await openModeChoice();
  await userEvent.click(screen.getByRole('button', { name: 'Iniciar grabación' }));
  await finishRecording();
  await userEvent.click(screen.getByRole('button', { name: 'Detener grabación' }));
  const textBox = await screen.findByRole('textbox', {
    name: 'Escribe lo que intentaste pronunciar',
  });
  await userEvent.type(textBox, 'casa');
  await userEvent.click(screen.getByRole('button', { name: 'Confirmar texto manual' }));
}

describe('PracticeAttemptFlow', () => {
  beforeEach(() => {
    currentTimeMs = 0;
    FunctionalMediaRecorder.instances = [];
    stopTrack = vi.fn();
    getUserMedia = vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: stopTrack }],
    } as unknown as MediaStream);
    revokeObjectUrl = vi.fn();
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    });
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn().mockReturnValue('blob:practice-test'),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectUrl,
    });
    vi.stubGlobal('MediaRecorder', FunctionalMediaRecorder);
    vi.spyOn(performance, 'now').mockImplementation(() => currentTimeMs);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    restoreProperty(navigator, 'mediaDevices', originalMediaDevices);
    restoreProperty(URL, 'createObjectURL', originalCreateObjectUrl);
    restoreProperty(URL, 'revokeObjectURL', originalRevokeObjectUrl);
  });

  it('completa demo sin APIs de captura, enfoca feedback y espera continuar', async () => {
    const recognizer = new ControlledBrowserRecognizer();
    const analyzeAudio = vi.fn();
    const coachEvaluator = vi.fn(evaluateCoach);
    render(
      <PracticeAttemptFlow
        analyzeAudio={analyzeAudio}
        browserRecognizer={recognizer}
        evaluateCoach={coachEvaluator}
      />,
    );

    await openModeChoice();
    await userEvent.click(screen.getByRole('radio', { name: /demostración/i }));
    expect(screen.getByText('Este recorrido utiliza datos simulados.')).toBeInTheDocument();
    expect(screen.getByText('No se grabó ni analizó su voz.')).toBeInTheDocument();
    expect(screen.getByText('El texto simulado no procede de audio.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cargar datos simulados' }));
    await userEvent.click(screen.getByRole('button', { name: 'Analizar intento' }));

    const feedback = await screen.findByRole('heading', {
      name: 'Devolución del intento',
    });
    expect(document.activeElement).toContainElement(feedback);
    expect(screen.getByText('La devolución se generó con datos simulados.')).toBeInTheDocument();
    expect(screen.getByText(/fixture acústico simulado/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Siguiente ejercicio' })).not.toBeInTheDocument();
    expect(getUserMedia).not.toHaveBeenCalled();
    expect(FunctionalMediaRecorder.instances).toHaveLength(0);
    expect(recognizer.startCount).toBe(0);
    expect(analyzeAudio).not.toHaveBeenCalled();
    expect(coachEvaluator).toHaveBeenCalledOnce();

    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    const preview = await screen.findByRole('heading', { name: 'Siguiente ejercicio' });
    expect(document.activeElement).toContainElement(preview);
    expect(screen.getByText('Camino con calma.')).toBeInTheDocument();
    expect(coachEvaluator).toHaveBeenCalledOnce();
    expect(getUserMedia).not.toHaveBeenCalled();
  });

  it('reutiliza escuchar tras finalizar o detener sin controles redundantes', async () => {
    const { output, synthesis } = createSpeechOutputHarness();
    render(<PracticeAttemptFlow speechOutput={output} />);

    expect(synthesis.utterances).toHaveLength(0);
    expect(
      screen.queryByRole('button', { name: 'Repetir instrucción' }),
    ).not.toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: 'Escuchar instrucción' }),
    );
    expect(synthesis.utterances.map(({ text }) => text)).toEqual([
      'Pronuncia la palabra visible cuando estés listo.',
    ]);
    expect(synthesis.utterances[0]?.text).not.toContain('casa');
    const stopButton = screen.getByRole('button', { name: 'Detener voz' });
    expect(document.activeElement).toBe(stopButton);
    expect(
      screen.queryByRole('button', { name: 'Escuchar instrucción' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Repetir instrucción' }),
    ).not.toBeInTheDocument();

    act(() => synthesis.utterances[0]?.finish());
    const listenAfterEnd = await screen.findByRole('button', {
      name: 'Escuchar instrucción',
    });
    expect(document.activeElement).toBe(listenAfterEnd);
    await userEvent.click(listenAfterEnd);
    expect(synthesis.utterances.map(({ text }) => text)).toEqual([
      'Pronuncia la palabra visible cuando estés listo.',
      'Pronuncia la palabra visible cuando estés listo.',
    ]);

    await userEvent.click(screen.getByRole('button', { name: 'Detener voz' }));
    const listenAfterStop = await screen.findByRole('button', {
      name: 'Escuchar instrucción',
    });
    expect(document.activeElement).toBe(listenAfterStop);
    await userEvent.click(listenAfterStop);
    await userEvent.click(
      screen.getByRole('button', { name: 'Detener voz' }),
    );
    expect(synthesis.utterances.map(({ text }) => text)).toEqual([
      'Pronuncia la palabra visible cuando estés listo.',
      'Pronuncia la palabra visible cuando estés listo.',
      'Pronuncia la palabra visible cuando estés listo.',
    ]);
  });

  it('cancela la instrucción antes de iniciar micrófono y grabación', async () => {
    const { output, synthesis } = createSpeechOutputHarness();
    render(<PracticeAttemptFlow speechOutput={output} />);

    await userEvent.click(
      screen.getByRole('button', { name: 'Escuchar instrucción' }),
    );
    await openModeChoice();
    const cancelCountBeforeCapture = synthesis.cancel.mock.calls.length;
    await userEvent.click(
      screen.getByRole('button', { name: 'Iniciar grabación' }),
    );

    expect(synthesis.cancel.mock.calls.length).toBeGreaterThan(
      cancelCountBeforeCapture,
    );
    expect(getUserMedia).toHaveBeenCalledOnce();
  });

  it('cancela la voz al descartar antes de volver a la instrucción', async () => {
    const { output, synthesis } = createSpeechOutputHarness();
    render(<PracticeAttemptFlow speechOutput={output} />);
    await userEvent.click(
      screen.getByRole('button', { name: 'Escuchar instrucción' }),
    );
    await openModeChoice();
    const cancelCountBeforeDiscard = synthesis.cancel.mock.calls.length;
    await userEvent.click(
      screen.getByRole('button', { name: 'Volver a la instrucción' }),
    );
    expect(synthesis.cancel.mock.calls.length).toBeGreaterThan(
      cancelCountBeforeDiscard,
    );
  });

  it('vuelve a escuchar feedback sin cambiar intento o coaching y conserva repetir intento', async () => {
    const { output, synthesis } = createSpeechOutputHarness();
    const coachEvaluator = vi.fn((input: unknown) => {
      void input;
      return REPEAT_RESULT;
    });
    render(
      <PracticeAttemptFlow
        evaluateCoach={coachEvaluator}
        speechOutput={output}
      />,
    );
    await openModeChoice();
    await userEvent.click(screen.getByRole('radio', { name: /demostración/i }));
    await userEvent.click(
      screen.getByRole('button', { name: 'Cargar datos simulados' }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Analizar intento' }),
    );

    expect(synthesis.utterances).toHaveLength(0);
    await userEvent.click(
      screen.getByRole('button', { name: 'Escuchar devolución' }),
    );
    expect(synthesis.utterances[0]?.text).toBe(
      'Prueba otra captura cuando estés listo. La captura necesita repetirse.',
    );
    expect(synthesis.utterances[0]?.text).not.toMatch(
      /casa|practice-|audio-metrics|qualityFlags/,
    );
    expect(
      screen.queryByRole('button', { name: 'Escuchar devolución' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Repetir devolución' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Repetir este intento' }),
    ).toBeInTheDocument();

    const initialCoachInput = coachEvaluator.mock.calls[0]?.[0];
    expect(initialCoachInput).toMatchObject({
      attemptId: 'practice-attempt-1',
    });
    act(() => synthesis.utterances[0]?.finish());
    await userEvent.click(
      await screen.findByRole('button', { name: 'Escuchar devolución' }),
    );
    expect(synthesis.utterances).toHaveLength(2);
    expect(coachEvaluator).toHaveBeenCalledOnce();
    expect(coachEvaluator.mock.calls[0]?.[0]).toBe(initialCoachInput);

    const cancelCountBeforeRepeat = synthesis.cancel.mock.calls.length;
    await userEvent.click(
      screen.getByRole('button', { name: 'Repetir este intento' }),
    );
    expect(synthesis.cancel.mock.calls.length).toBeGreaterThan(
      cancelCountBeforeRepeat,
    );
    expect(
      screen.getByRole('button', { name: 'Preparar intento' }),
    ).toBeInTheDocument();
  });

  it('cancela feedback al continuar y muestra progreso 2 de 3 sin otra captura', async () => {
    const { output, synthesis } = createSpeechOutputHarness();
    const coachEvaluator = vi.fn(evaluateCoach);
    render(
      <PracticeAttemptFlow
        evaluateCoach={coachEvaluator}
        speechOutput={output}
      />,
    );
    await openModeChoice();
    await userEvent.click(screen.getByRole('radio', { name: /demostración/i }));
    await userEvent.click(
      screen.getByRole('button', { name: 'Cargar datos simulados' }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Analizar intento' }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Escuchar devolución' }),
    );
    const cancelCountBeforeContinue = synthesis.cancel.mock.calls.length;
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }));

    expect(synthesis.cancel.mock.calls.length).toBeGreaterThan(
      cancelCountBeforeContinue,
    );
    expect(screen.getByText('Ejercicio 2 de 3')).toBeInTheDocument();
    expect(
      screen.getByText('Pronuncia la frase visible cuando estés listo.'),
    ).toBeInTheDocument();
    expect(coachEvaluator).toHaveBeenCalledOnce();
    expect(getUserMedia).not.toHaveBeenCalled();
    expect(FunctionalMediaRecorder.instances).toHaveLength(0);
  });

  it('actualiza voces sin autoplay, foco o nueva evaluación de coaching', async () => {
    const { output, synthesis } = createSpeechOutputHarness();
    const coachEvaluator = vi.fn(evaluateCoach);
    render(
      <PracticeAttemptFlow
        evaluateCoach={coachEvaluator}
        speechOutput={output}
      />,
    );
    await openModeChoice();
    await userEvent.click(screen.getByRole('radio', { name: /demostración/i }));
    await userEvent.click(
      screen.getByRole('button', { name: 'Cargar datos simulados' }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Analizar intento' }),
    );
    const focusedElement = document.activeElement;

    act(() => {
      synthesis.emitVoicesChanged([
        spanishVoice({ name: 'Nueva voz', voiceURI: 'voice:new' }),
      ]);
    });
    expect(synthesis.utterances).toHaveLength(0);
    expect(document.activeElement).toBe(focusedElement);
    expect(coachEvaluator).toHaveBeenCalledOnce();
  });

  it('conserva feedback y acción ante un error real de síntesis', async () => {
    const { output, synthesis } = createSpeechOutputHarness();
    render(
      <PracticeAttemptFlow
        evaluateCoach={() => REPEAT_RESULT}
        speechOutput={output}
      />,
    );
    await openModeChoice();
    await userEvent.click(screen.getByRole('radio', { name: /demostración/i }));
    await userEvent.click(
      screen.getByRole('button', { name: 'Cargar datos simulados' }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Analizar intento' }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Escuchar devolución' }),
    );
    await act(async () => {
      synthesis.utterances[0]?.fail();
      await Promise.resolve();
    });

    expect(
      screen.getByRole('heading', { name: 'Devolución del intento' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Repetir este intento' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/no pudo completar la locución/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Escuchar devolución' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Repetir devolución' }),
    ).not.toBeInTheDocument();
  });

  it('mantiene todas las rutas disponibles cuando no existe voz', async () => {
    const { output, synthesis } = createSpeechOutputHarness([]);
    render(<PracticeAttemptFlow speechOutput={output} />);
    expect(
      screen.getByRole('button', { name: 'Escuchar instrucción' }),
    ).toBeDisabled();
    expect(screen.getByText(/buscando una voz en español/i)).toBeInTheDocument();

    await openModeChoice();
    await userEvent.click(screen.getByRole('radio', { name: /demostración/i }));
    await userEvent.click(
      screen.getByRole('button', { name: 'Cargar datos simulados' }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Analizar intento' }),
    );
    expect(
      await screen.findByRole('heading', { name: 'Devolución del intento' }),
    ).toBeInTheDocument();
    expect(synthesis.utterances).toHaveLength(0);
  });

  it('espera el clic de repeat y vuelve sin iniciar otra captura', async () => {
    render(<PracticeAttemptFlow evaluateCoach={() => REPEAT_RESULT} />);
    await openModeChoice();
    await userEvent.click(screen.getByRole('radio', { name: /demostración/i }));
    await userEvent.click(screen.getByRole('button', { name: 'Cargar datos simulados' }));
    await userEvent.click(screen.getByRole('button', { name: 'Analizar intento' }));

    expect(screen.getByRole('button', { name: 'Repetir este intento' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /continuar de todas formas/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Preparar intento' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Repetir este intento' }));
    expect(screen.getByRole('button', { name: 'Preparar intento' })).toBeInTheDocument();
    expect(getUserMedia).not.toHaveBeenCalled();
  });

  it('muestra complete_session como error enfocado y sin feedback parcial', async () => {
    render(<PracticeAttemptFlow evaluateCoach={() => COMPLETE_RESULT} />);
    await openModeChoice();
    await userEvent.click(screen.getByRole('radio', { name: /demostración/i }));
    await userEvent.click(screen.getByRole('button', { name: 'Cargar datos simulados' }));
    await userEvent.click(screen.getByRole('button', { name: 'Analizar intento' }));

    const errorTitle = await screen.findByRole('heading', {
      name: 'No pudimos completar este paso',
    });
    expect(document.activeElement).toContainElement(errorTitle);
    expect(screen.queryByRole('heading', { name: 'Devolución del intento' })).not.toBeInTheDocument();
    expect(screen.queryByText('No debe mostrarse.')).not.toBeInTheDocument();
  });

  it('recorre manual con audio real, texto confirmado y advertencia de procedencia', async () => {
    const analyzeAudio = vi.fn().mockResolvedValue({
      status: 'success',
      metrics: SUCCESSFUL_AUDIO_METRICS,
    });
    const coachEvaluator = vi.fn((input: unknown) => evaluateCoach(input));
    render(
      <PracticeAttemptFlow
        analyzeAudio={analyzeAudio}
        evaluateCoach={coachEvaluator}
      />,
    );
    await openModeChoice();
    await userEvent.click(screen.getByRole('button', { name: 'Iniciar grabación' }));
    await finishRecording();
    await userEvent.click(screen.getByRole('button', { name: 'Detener grabación' }));

    const textBox = await screen.findByRole('textbox', {
      name: 'Escribe lo que intentaste pronunciar',
    });
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar texto manual' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/escribe el texto/i);
    await userEvent.type(textBox, 'casa');
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar texto manual' }));
    expect(screen.getByText(/procedencia: entrada manual/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Analizar intento' }));

    await screen.findByRole('heading', { name: 'Devolución del intento' });
    expect(analyzeAudio).toHaveBeenCalledOnce();
    expect(coachEvaluator).toHaveBeenCalledOnce();
    const coachInput = coachEvaluator.mock.calls[0]?.[0] as CoachInput;
    expect(coachInput).toMatchObject({
      textSource: 'manual',
      validAttemptCountBeforeCurrent: 0,
      coveredExerciseTypesBeforeCurrent: [],
    });
    expect(coachInput.textMetrics?.targetText).toBe('casa');
    expect(coachInput.textMetrics?.wordsPerMinute).toBe(50);
    expect(screen.getByText(/no se verificó contra la grabación/i)).toBeInTheDocument();
    expect(stopTrack).toHaveBeenCalledOnce();
  });

  it('browser exige consentimiento, ignora provisional y acepta final', async () => {
    const recognizer = new ControlledBrowserRecognizer();
    const analyzeAudio = vi.fn().mockResolvedValue({
      status: 'success',
      metrics: SUCCESSFUL_AUDIO_METRICS,
    });
    const coachEvaluator = vi.fn((input: unknown) => evaluateCoach(input));
    render(
      <PracticeAttemptFlow
        analyzeAudio={analyzeAudio}
        browserRecognizer={recognizer}
        evaluateCoach={coachEvaluator}
      />,
    );
    await openModeChoice();
    await userEvent.click(
      screen.getByRole('radio', { name: /reconocimiento del navegador/i }),
    );
    expect(screen.getByRole('button', { name: 'Iniciar grabación' })).toBeDisabled();
    await userEvent.click(
      screen.getByRole('checkbox', { name: /entiendo el aviso/i }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Iniciar grabación' }));
    await finishRecording();
    act(() => recognizer.interim('ca'));
    expect(screen.getByText('ca')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Analizar intento' })).not.toBeInTheDocument();
    act(() => recognizer.final('casa'));
    await userEvent.click(
      screen.getByRole('button', {
        name: 'Detener grabación y reconocimiento',
      }),
    );
    await screen.findByRole('button', { name: 'Analizar intento' });
    await userEvent.click(screen.getByRole('button', { name: 'Analizar intento' }));

    await screen.findByRole('heading', { name: 'Devolución del intento' });
    const coachInput = coachEvaluator.mock.calls[0]?.[0] as CoachInput;
    expect(coachInput.textSource).toBe('browser');
    expect(coachInput.textMetrics?.transcribedText).toBe('casa');
  });

  it('conserva audio ante fallo browser y permite continuar sin texto', async () => {
    const recognizer = new ControlledBrowserRecognizer();
    const analyzeAudio = vi.fn().mockResolvedValue({
      status: 'success',
      metrics: SUCCESSFUL_AUDIO_METRICS,
    });
    const coachEvaluator = vi.fn((input: unknown) => evaluateCoach(input));
    render(
      <PracticeAttemptFlow
        analyzeAudio={analyzeAudio}
        browserRecognizer={recognizer}
        evaluateCoach={coachEvaluator}
      />,
    );
    await openModeChoice();
    await userEvent.click(
      screen.getByRole('radio', { name: /reconocimiento del navegador/i }),
    );
    await userEvent.click(screen.getByRole('checkbox', { name: /entiendo el aviso/i }));
    await userEvent.click(screen.getByRole('button', { name: 'Iniciar grabación' }));
    await finishRecording();
    act(() => recognizer.fail());
    await userEvent.click(
      screen.getByRole('button', {
        name: 'Detener grabación y reconocimiento',
      }),
    );

    expect(await screen.findByLabelText(/reproducir la grabación local/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Continuar sin texto' }));
    await userEvent.click(screen.getByRole('button', { name: 'Analizar intento' }));
    await screen.findByRole('heading', { name: 'Devolución del intento' });
    const coachInput = coachEvaluator.mock.calls[0]?.[0] as CoachInput;
    expect(coachInput.textSource).toBeNull();
    expect(coachInput.textMetrics).toBeNull();
  });

  it('invalida un análisis tardío al descartar y limpia la URL', async () => {
    const deferred = createDeferred<{
      readonly status: 'success';
      readonly metrics: DeterministicMetrics;
    }>();
    const coachEvaluator = vi.fn((input: unknown) => evaluateCoach(input));
    render(
      <PracticeAttemptFlow
        analyzeAudio={() => deferred.promise}
        evaluateCoach={coachEvaluator}
      />,
    );
    await prepareManualAttemptForAnalysis();
    await userEvent.click(screen.getByRole('button', { name: 'Analizar intento' }));
    expect(screen.getByText(/calculando métricas/i)).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: 'Descartar e iniciar de nuevo' }),
    );
    expect(screen.getByRole('button', { name: 'Preparar intento' })).toBeInTheDocument();
    act(() => deferred.resolve({ status: 'success', metrics: SUCCESSFUL_AUDIO_METRICS }));
    await act(async () => deferred.promise);

    expect(coachEvaluator).not.toHaveBeenCalled();
    expect(screen.queryByRole('heading', { name: 'Devolución del intento' })).not.toBeInTheDocument();
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:practice-test');
  });

  it('no actualiza ni evalúa después de desmontar durante el análisis', async () => {
    const deferred = createDeferred<{
      readonly status: 'success';
      readonly metrics: DeterministicMetrics;
    }>();
    const coachEvaluator = vi.fn((input: unknown) => evaluateCoach(input));
    const { unmount } = render(
      <PracticeAttemptFlow
        analyzeAudio={() => deferred.promise}
        evaluateCoach={coachEvaluator}
      />,
    );
    await prepareManualAttemptForAnalysis();
    await userEvent.click(screen.getByRole('button', { name: 'Analizar intento' }));

    unmount();
    act(() => deferred.resolve({ status: 'success', metrics: SUCCESSFUL_AUDIO_METRICS }));
    await act(async () => deferred.promise);

    expect(coachEvaluator).not.toHaveBeenCalled();
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:practice-test');
  });

  it('presenta el rechazo de permiso como error recuperable enfocado', async () => {
    getUserMedia.mockRejectedValueOnce(
      new DOMException('Permiso rechazado', 'NotAllowedError'),
    );
    render(<PracticeAttemptFlow />);
    await openModeChoice();
    await userEvent.click(screen.getByRole('button', { name: 'Iniciar grabación' }));

    const errorTitle = await screen.findByRole('heading', {
      name: 'No pudimos completar este paso',
    });
    expect(document.activeElement).toContainElement(errorTitle);
    expect(screen.getByText(/permiso del micrófono fue rechazado/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Devolución del intento' })).not.toBeInTheDocument();
  });
});

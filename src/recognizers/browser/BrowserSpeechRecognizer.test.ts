import { describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import type {
  RecognitionCallbacks,
  SpeechRecognitionErrorCode,
} from '../../domain/contracts';
import { BrowserSpeechRecognizer } from './BrowserSpeechRecognizer';
import type {
  WebSpeechRecognition,
  WebSpeechRecognitionAlternative,
  WebSpeechRecognitionBoundary,
  WebSpeechRecognitionErrorEvent,
  WebSpeechRecognitionEvent,
  WebSpeechRecognitionResult,
  WebSpeechRecognitionResultList,
} from './webSpeechTypes';

class FakeWebSpeechRecognition implements WebSpeechRecognition {
  continuous = true;
  interimResults = false;
  lang = '';
  maxAlternatives = 0;
  onstart: ((event: Event) => void) | null = null;
  onspeechstart: ((event: Event) => void) | null = null;
  onresult: ((event: WebSpeechRecognitionEvent) => void) | null = null;
  onnomatch: ((event: Event) => void) | null = null;
  onerror: ((event: WebSpeechRecognitionErrorEvent) => void) | null = null;
  onend: ((event: Event) => void) | null = null;
  readonly start = vi.fn();
  readonly stop = vi.fn();
  readonly abort = vi.fn();

  emitResult(
    resultIndex: number,
    results: WebSpeechRecognitionResultList,
  ): void {
    this.onresult?.(
      Object.assign(new Event('result'), { resultIndex, results }),
    );
  }

  emitError(error: string): void {
    this.onerror?.(Object.assign(new Event('error'), { error }));
  }

  emitEnd(): void {
    this.onend?.(new Event('end'));
  }
}

function alternative(transcript: string): WebSpeechRecognitionAlternative {
  return { transcript, confidence: 0.9 };
}

function result(
  transcript: string,
  isFinal: boolean,
): WebSpeechRecognitionResult {
  return Object.assign([alternative(transcript)], { isFinal });
}

function results(
  ...items: readonly WebSpeechRecognitionResult[]
): WebSpeechRecognitionResultList {
  return items;
}

interface TestCallbacks extends RecognitionCallbacks {
  readonly onInterim: Mock<(text: string) => void>;
  readonly onFinal: Mock<(text: string) => void>;
  readonly onError: Mock<(errorCode: SpeechRecognitionErrorCode) => void>;
  readonly onEnd: Mock<() => void>;
}

function callbacks(): TestCallbacks {
  return {
    onInterim: vi.fn<(text: string) => void>(),
    onFinal: vi.fn<(text: string) => void>(),
    onError: vi.fn<(errorCode: SpeechRecognitionErrorCode) => void>(),
    onEnd: vi.fn<() => void>(),
  };
}

function setup(
  boundaryKey: 'SpeechRecognition' | 'webkitSpeechRecognition' =
    'SpeechRecognition',
): {
  readonly recognizer: BrowserSpeechRecognizer;
  readonly created: FakeWebSpeechRecognition[];
} {
  const created: FakeWebSpeechRecognition[] = [];
  class Recognition extends FakeWebSpeechRecognition {
    constructor() {
      super();
      created.push(this);
    }
  }
  const boundary: WebSpeechRecognitionBoundary = {
    [boundaryKey]: Recognition,
  };

  return {
    recognizer: new BrowserSpeechRecognizer(boundary),
    created,
  };
}

describe('BrowserSpeechRecognizer', () => {
  it.each(['SpeechRecognition', 'webkitSpeechRecognition'] as const)(
    'detecta el constructor %s',
    (boundaryKey) => {
      const { recognizer, created } = setup(boundaryKey);
      const listener = callbacks();

      expect(recognizer.isSupported()).toBe(true);
      recognizer.start({ languageTag: 'es-EC', callbacks: listener });

      expect(created).toHaveLength(1);
    },
  );

  it('prefiere el constructor estándar sobre el prefijado', () => {
    let standardCalls = 0;
    let prefixedCalls = 0;
    class StandardRecognition extends FakeWebSpeechRecognition {
      constructor() {
        super();
        standardCalls += 1;
      }
    }
    class PrefixedRecognition extends FakeWebSpeechRecognition {
      constructor() {
        super();
        prefixedCalls += 1;
      }
    }
    const recognizer = new BrowserSpeechRecognizer({
      SpeechRecognition: StandardRecognition,
      webkitSpeechRecognition: PrefixedRecognition,
    });

    recognizer.start({ languageTag: 'es-EC', callbacks: callbacks() });

    expect(standardCalls).toBe(1);
    expect(prefixedCalls).toBe(0);
  });

  it('devuelve unsupported sin construir ni solicitar reconocimiento', () => {
    const listener = callbacks();
    const recognizer = new BrowserSpeechRecognizer({});

    expect(recognizer.isSupported()).toBe(false);
    recognizer.start({ languageTag: 'es-EC', callbacks: listener });

    expect(listener.onError).toHaveBeenCalledWith('unsupported');
    expect(listener.onEnd).toHaveBeenCalledOnce();
  });

  it('configura idioma, provisionales, alternativa única y sesión finita', () => {
    const { recognizer, created } = setup();

    recognizer.start({ languageTag: 'es-EC', callbacks: callbacks() });

    expect(created[0]).toMatchObject({
      lang: 'es-EC',
      interimResults: true,
      maxAlternatives: 1,
      continuous: false,
    });
    expect(created[0]?.start).toHaveBeenCalledOnce();
    expect(created[0]?.onstart).toBeTypeOf('function');
    expect(created[0]?.onspeechstart).toBeTypeOf('function');
  });

  it('distingue texto provisional y acumula segmentos finales sin duplicarlos', () => {
    const { recognizer, created } = setup();
    const listener = callbacks();
    recognizer.start({ languageTag: 'es-EC', callbacks: listener });
    const instance = created[0];

    instance?.emitResult(0, results(result('hoy camino', false)));
    instance?.emitResult(0, results(result('Hoy camino', true)));
    instance?.emitResult(
      1,
      results(result('Hoy camino', true), result('con calma', true)),
    );

    expect(listener.onInterim).toHaveBeenCalledWith('hoy camino');
    expect(listener.onFinal).toHaveBeenNthCalledWith(1, 'Hoy camino');
    expect(listener.onFinal).toHaveBeenNthCalledWith(
      2,
      'Hoy camino con calma',
    );
  });

  it('conserva un resultado final único de diez palabras sin recortarlo', () => {
    const { recognizer, created } = setup();
    const listener = callbacks();
    const longText = 'uno dos tres cuatro cinco seis siete ocho nueve diez';
    recognizer.start({ languageTag: 'es-EC', callbacks: listener });

    created[0]?.emitResult(0, results(result(longText, true)));

    expect(listener.onFinal).toHaveBeenCalledWith(longText);
  });

  it('concatena dos segmentos finales que suman más de diez palabras', () => {
    const { recognizer, created } = setup();
    const listener = callbacks();
    recognizer.start({ languageTag: 'es-EC', callbacks: listener });

    created[0]?.emitResult(
      0,
      results(
        result('uno dos tres cuatro cinco seis', true),
        result('siete ocho nueve diez once doce', true),
      ),
    );

    expect(listener.onFinal).toHaveBeenCalledWith(
      'uno dos tres cuatro cinco seis siete ocho nueve diez once doce',
    );
  });

  it('reemplaza un provisional por el resultado final completo', () => {
    const { recognizer, created } = setup();
    const listener = callbacks();
    const finalText =
      'esta frase provisional termina como un resultado final completo y largo';
    recognizer.start({ languageTag: 'es-EC', callbacks: listener });

    created[0]?.emitResult(0, results(result('esta frase provisional', false)));
    created[0]?.emitResult(0, results(result(finalText, true)));

    expect(listener.onInterim).toHaveBeenCalledWith('esta frase provisional');
    expect(listener.onFinal).toHaveBeenCalledWith(finalText);
  });

  it('acumula varios eventos finales en orden sin sobrescribir segmentos previos', () => {
    const { recognizer, created } = setup();
    const listener = callbacks();
    recognizer.start({ languageTag: 'es-EC', callbacks: listener });

    created[0]?.emitResult(
      0,
      results(result('uno dos tres cuatro cinco seis', true)),
    );
    created[0]?.emitResult(
      1,
      results(
        result('uno dos tres cuatro cinco seis', true),
        result('siete ocho nueve diez once doce', true),
      ),
    );

    expect(listener.onFinal).toHaveBeenNthCalledWith(
      2,
      'uno dos tres cuatro cinco seis siete ocho nueve diez once doce',
    );
  });

  it('conserva palabras adicionales después de la frase objetivo', () => {
    const { recognizer, created } = setup();
    const listener = callbacks();
    const textWithAdditions =
      'Hoy camino con calma y confianza mañana temprano por el parque';
    recognizer.start({ languageTag: 'es-EC', callbacks: listener });

    created[0]?.emitResult(0, results(result(textWithAdditions, true)));

    expect(listener.onFinal).toHaveBeenCalledWith(textWithAdditions);
  });

  it.each<[string, SpeechRecognitionErrorCode]>([
    ['not-allowed', 'permission_denied'],
    ['audio-capture', 'audio_capture_failed'],
    ['network', 'network_failed'],
    ['no-speech', 'no_speech'],
    ['aborted', 'aborted'],
    ['language-not-supported', 'language_not_supported'],
    ['service-not-allowed', 'service_not_allowed'],
    ['bad-event', 'unknown'],
  ])('traduce %s a %s', (rawError, expectedError) => {
    const { recognizer, created } = setup();
    const listener = callbacks();
    recognizer.start({ languageTag: 'es-EC', callbacks: listener });

    created[0]?.emitError(rawError);

    expect(listener.onError).toHaveBeenCalledWith(expectedError);
  });

  it('no abre una segunda sesión mientras existe una activa', () => {
    const { recognizer, created } = setup();
    const listener = callbacks();

    const first = recognizer.start({
      languageTag: 'es-EC',
      callbacks: listener,
    });
    const second = recognizer.start({
      languageTag: 'es-ES',
      callbacks: callbacks(),
    });

    expect(second).toBe(first);
    expect(created).toHaveLength(1);
    expect(created[0]?.start).toHaveBeenCalledOnce();
  });

  it('stop espera al cierre del navegador y permite conservar un final tardío', () => {
    const { recognizer, created } = setup();
    const listener = callbacks();
    const active = recognizer.start({
      languageTag: 'es-EC',
      callbacks: listener,
    });

    active.stop();
    created[0]?.emitResult(0, results(result('texto final', true)));
    created[0]?.emitEnd();

    expect(created[0]?.stop).toHaveBeenCalledOnce();
    expect(listener.onFinal).toHaveBeenCalledWith('texto final');
    expect(listener.onEnd).toHaveBeenCalledOnce();
  });

  it('dispose aborta y bloquea callbacks tardíos', () => {
    const { recognizer, created } = setup();
    const listener = callbacks();
    const active = recognizer.start({
      languageTag: 'es-EC',
      callbacks: listener,
    });
    const savedResultHandler = created[0]?.onresult;

    active.dispose();
    savedResultHandler?.(
      Object.assign(new Event('result'), {
        resultIndex: 0,
        results: results(result('no debe aparecer', true)),
      }),
    );

    expect(created[0]?.abort).toHaveBeenCalledOnce();
    expect(listener.onFinal).not.toHaveBeenCalled();
    expect(listener.onEnd).not.toHaveBeenCalled();
  });

  it('informa fin sin fabricar texto cuando no hubo resultado', () => {
    const { recognizer, created } = setup();
    const listener = callbacks();
    recognizer.start({ languageTag: 'es-EC', callbacks: listener });

    created[0]?.emitEnd();

    expect(listener.onFinal).not.toHaveBeenCalled();
    expect(listener.onEnd).toHaveBeenCalledOnce();
  });

  it('ignora un resultado recibido después del cierre de la sesión', () => {
    const { recognizer, created } = setup();
    const listener = callbacks();
    recognizer.start({ languageTag: 'es-EC', callbacks: listener });
    const savedResultHandler = created[0]?.onresult;

    created[0]?.emitEnd();
    savedResultHandler?.(
      Object.assign(new Event('result'), {
        resultIndex: 0,
        results: results(result('resultado posterior al cierre', true)),
      }),
    );

    expect(listener.onFinal).not.toHaveBeenCalled();
    expect(listener.onEnd).toHaveBeenCalledOnce();
  });
});

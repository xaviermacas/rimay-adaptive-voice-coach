import { vi } from 'vitest';

import { BrowserSpeechOutput } from '../../../features/speech-output';

export class SpeechSynthesisHarness extends EventTarget
  implements SpeechSynthesis
{
  onvoiceschanged: ((this: SpeechSynthesis, ev: Event) => unknown) | null = null;
  paused = false;
  pending = false;
  speaking = false;
  voices: SpeechSynthesisVoice[];
  readonly utterances: TestSpeechUtterance[] = [];
  readonly cancel = vi.fn(() => {
    this.pending = false;
    this.speaking = false;
  });
  readonly pause = vi.fn(() => {
    this.paused = true;
  });
  readonly resume = vi.fn(() => {
    this.paused = false;
  });

  constructor(voices: SpeechSynthesisVoice[] = [spanishVoice()]) {
    super();
    this.voices = voices;
  }

  getVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  speak(utterance: SpeechSynthesisUtterance): void {
    this.utterances.push(utterance as TestSpeechUtterance);
    this.pending = true;
    this.speaking = true;
  }

  emitVoicesChanged(voices: SpeechSynthesisVoice[]): void {
    this.voices = voices;
    this.dispatchEvent(new Event('voiceschanged'));
  }
}

export class TestSpeechUtterance extends EventTarget
  implements SpeechSynthesisUtterance
{
  lang = '';
  pitch = 1;
  rate = 1;
  text: string;
  voice: SpeechSynthesisVoice | null = null;
  volume = 1;
  onboundary: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => unknown) | null = null;
  onend: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => unknown) | null = null;
  onerror: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisErrorEvent) => unknown) | null = null;
  onmark: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => unknown) | null = null;
  onpause: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => unknown) | null = null;
  onresume: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => unknown) | null = null;
  onstart: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => unknown) | null = null;

  constructor(text: string) {
    super();
    this.text = text;
  }

  finish(): void {
    this.onend?.call(this, new Event('end') as SpeechSynthesisEvent);
  }

  fail(): void {
    this.onerror?.call(this, {
      error: 'synthesis-failed',
    } as SpeechSynthesisErrorEvent);
  }
}

export function spanishVoice(
  overrides: Partial<SpeechSynthesisVoice> = {},
): SpeechSynthesisVoice {
  return {
    name: 'Español Ecuador',
    lang: 'es-EC',
    localService: true,
    default: true,
    voiceURI: 'voice:es-ec',
    ...overrides,
  };
}

export function createSpeechOutputHarness(
  voices: SpeechSynthesisVoice[] = [spanishVoice()],
) {
  const synthesis = new SpeechSynthesisHarness(voices);
  const output = new BrowserSpeechOutput({
    synthesis,
    createUtterance: (text) => new TestSpeechUtterance(text),
  });
  return { output, synthesis };
}

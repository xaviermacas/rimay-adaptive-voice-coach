export interface SpeechOutput {
  speak(text: string, language: string): Promise<void>;
  stop(): void;
  isSupported(): boolean;
}

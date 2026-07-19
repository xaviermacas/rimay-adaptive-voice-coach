export interface SpeechOutput {
  speak(text: string): Promise<void>;
  stop(): void;
  isAvailable(): boolean;
}

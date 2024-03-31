export interface SpeakOptions {
    text: string;
    lang?: string;
    stream?: boolean;
    streamEnd?: boolean;
    streamStart?: boolean;
    save?: boolean;
    options?: object;
    onFinish?: (files: string[]) => void;
}

export type TTSProvider = "WebSpeech" | "EdgeTTS"

export interface SpeakOptions {
    text: string;
    lang?: string;
    stream?: boolean;
    streamEnd?: boolean;
    streamStart?: boolean;
    save?: boolean;
    options?: any;
}

export type TTSProvider = "WebSpeech" | "EdgeTTS"

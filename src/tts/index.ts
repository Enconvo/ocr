import { SpeakOptions } from "@/tts/types.js";
import { speak as edgeSpeak } from "@/tts/edge-tts.js";

export const defaultTTSProvider = "EdgeTTS";

export const langCode2TTSLang: Record<string, string> = {
    "en": "en-US",
    "zh-Hans": "zh-CN",
    "zh-Hant": "zh-TW",
    "yue": "zh-HK",
    "lzh": "zh-CN",
    "ja": "ja-JP",
    "ko": "ko-KR",
    "fr": "fr-FR",
    "de": "de-DE",
    "es": "es-ES",
    "it": "it-IT",
    "ru": "ru-RU",
    "pt": "pt-PT",
    "nl": "nl-NL",
    "pl": "pl-PL",
    "ar": "ar-001",
    "bg": "bg-BG",
    "ca": "ca-ES",
    "cs": "cs-CZ",
    "da": "da-DK",
    "el": "el-GR",
    "fi": "fi-FI",
    "he": "he-IL",
    "hi": "hi-IN",
    "hr": "hr-HR",
    "id": "id-ID",
    "vi": "vi-VN",
    "sv": "sv-SE",
};


export async function speak({ text, lang, stream, streamEnd, streamStart, save, options }: SpeakOptions) {
    const settings = {
        tts: {
            provider: "EdgeTTS",
            voices: [
                {
                    lang: "",
                    voice: ""
                }
            ],
            rate: 10,
            volume: 100,
        }

    };
    const langTag = langCode2TTSLang[lang ?? "en"] ?? "en-US";
    const voiceCfg = settings.tts?.voices?.find((item) => item.lang === lang);
    const rate = (settings.tts?.rate ?? 10) / 10;
    const volume = settings.tts?.volume;


    return edgeSpeak({
        text,
        lang: langTag,
        voice: voiceCfg?.voice,
        rate,
        volume: volume ?? 100,
        stream: stream,
        streamEnd: streamEnd,
        streamStart: streamStart,
        save: save,
        options: options
    });
}

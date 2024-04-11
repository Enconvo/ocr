import { SpeakOptions } from "@/tts/types.js";
import * as fs from "fs";
import { AudioPlayer, MD5Util, ServiceProvider, environment } from "@enconvo/api";
import * as path from "path";
import { writeFile } from 'fs';
import { promisify } from 'util';
import axios from "axios";
import { Buffer } from 'buffer';
import { EdgeTTS } from 'node-edge-tts'
import { TTSProviderBase } from "@/tts_provider.ts";
const trustedClientToken = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";

// https://github.com/microsoft/cognitive-services-speech-sdk-js/blob/e6faf6b7fc1febb45993b940617719e8ed1358b2/src/sdk/SpeechSynthesizer.ts#L216
const languageToDefaultVoice: { [key: string]: string } = {
    ["af-ZA"]: "af-ZA-AdriNeural",
    ["am-ET"]: "am-ET-AmehaNeural",
    ["ar-AE"]: "ar-AE-FatimaNeural",
    ["ar-BH"]: "ar-BH-AliNeural",
    ["ar-DZ"]: "ar-DZ-AminaNeural",
    ["ar-EG"]: "ar-EG-SalmaNeural",
    ["ar-IQ"]: "ar-IQ-BasselNeural",
    ["ar-JO"]: "ar-JO-SanaNeural",
    ["ar-KW"]: "ar-KW-FahedNeural",
    ["ar-LY"]: "ar-LY-ImanNeural",
    ["ar-MA"]: "ar-MA-JamalNeural",
    ["ar-QA"]: "ar-QA-AmalNeural",
    ["ar-SA"]: "ar-SA-HamedNeural",
    ["ar-SY"]: "ar-SY-AmanyNeural",
    ["ar-TN"]: "ar-TN-HediNeural",
    ["ar-YE"]: "ar-YE-MaryamNeural",
    ["bg-BG"]: "bg-BG-BorislavNeural",
    ["bn-BD"]: "bn-BD-NabanitaNeural",
    ["bn-IN"]: "bn-IN-BashkarNeural",
    ["ca-ES"]: "ca-ES-JoanaNeural",
    ["cs-CZ"]: "cs-CZ-AntoninNeural",
    ["cy-GB"]: "cy-GB-AledNeural",
    ["da-DK"]: "da-DK-ChristelNeural",
    ["de-AT"]: "de-AT-IngridNeural",
    ["de-CH"]: "de-CH-JanNeural",
    ["de-DE"]: "de-DE-KatjaNeural",
    ["el-GR"]: "el-GR-AthinaNeural",
    ["en-AU"]: "en-AU-NatashaNeural",
    ["en-CA"]: "en-CA-ClaraNeural",
    ["en-GB"]: "en-GB-LibbyNeural",
    ["en-HK"]: "en-HK-SamNeural",
    ["en-IE"]: "en-IE-ConnorNeural",
    ["en-IN"]: "en-IN-NeerjaNeural",
    ["en-KE"]: "en-KE-AsiliaNeural",
    ["en-NG"]: "en-NG-AbeoNeural",
    ["en-NZ"]: "en-NZ-MitchellNeural",
    ["en-PH"]: "en-PH-JamesNeural",
    ["en-SG"]: "en-SG-LunaNeural",
    ["en-TZ"]: "en-TZ-ElimuNeural",
    ["en-US"]: "en-US-JennyNeural",
    ["en-ZA"]: "en-ZA-LeahNeural",
    ["es-AR"]: "es-AR-ElenaNeural",
    ["es-BO"]: "es-BO-MarceloNeural",
    ["es-CL"]: "es-CL-CatalinaNeural",
    ["es-CO"]: "es-CO-GonzaloNeural",
    ["es-CR"]: "es-CR-JuanNeural",
    ["es-CU"]: "es-CU-BelkysNeural",
    ["es-DO"]: "es-DO-EmilioNeural",
    ["es-EC"]: "es-EC-AndreaNeural",
    ["es-ES"]: "es-ES-AlvaroNeural",
    ["es-GQ"]: "es-GQ-JavierNeural",
    ["es-GT"]: "es-GT-AndresNeural",
    ["es-HN"]: "es-HN-CarlosNeural",
    ["es-MX"]: "es-MX-DaliaNeural",
    ["es-NI"]: "es-NI-FedericoNeural",
    ["es-PA"]: "es-PA-MargaritaNeural",
    ["es-PE"]: "es-PE-AlexNeural",
    ["es-PR"]: "es-PR-KarinaNeural",
    ["es-PY"]: "es-PY-MarioNeural",
    ["es-SV"]: "es-SV-LorenaNeural",
    ["es-US"]: "es-US-AlonsoNeural",
    ["es-UY"]: "es-UY-MateoNeural",
    ["es-VE"]: "es-VE-PaolaNeural",
    ["et-EE"]: "et-EE-AnuNeural",
    ["fa-IR"]: "fa-IR-DilaraNeural",
    ["fi-FI"]: "fi-FI-SelmaNeural",
    ["fil-PH"]: "fil-PH-AngeloNeural",
    ["fr-BE"]: "fr-BE-CharlineNeural",
    ["fr-CA"]: "fr-CA-SylvieNeural",
    ["fr-CH"]: "fr-CH-ArianeNeural",
    ["fr-FR"]: "fr-FR-DeniseNeural",
    ["ga-IE"]: "ga-IE-ColmNeural",
    ["gl-ES"]: "gl-ES-RoiNeural",
    ["gu-IN"]: "gu-IN-DhwaniNeural",
    ["he-IL"]: "he-IL-AvriNeural",
    ["hi-IN"]: "hi-IN-MadhurNeural",
    ["hr-HR"]: "hr-HR-GabrijelaNeural",
    ["hu-HU"]: "hu-HU-NoemiNeural",
    ["id-ID"]: "id-ID-ArdiNeural",
    ["is-IS"]: "is-IS-GudrunNeural",
    ["it-IT"]: "it-IT-IsabellaNeural",
    ["ja-JP"]: "ja-JP-NanamiNeural",
    ["jv-ID"]: "jv-ID-DimasNeural",
    ["kk-KZ"]: "kk-KZ-AigulNeural",
    ["km-KH"]: "km-KH-PisethNeural",
    ["kn-IN"]: "kn-IN-GaganNeural",
    ["ko-KR"]: "ko-KR-SunHiNeural",
    ["lo-LA"]: "lo-LA-ChanthavongNeural",
    ["lt-LT"]: "lt-LT-LeonasNeural",
    ["lv-LV"]: "lv-LV-EveritaNeural",
    ["mk-MK"]: "mk-MK-AleksandarNeural",
    ["ml-IN"]: "ml-IN-MidhunNeural",
    ["mr-IN"]: "mr-IN-AarohiNeural",
    ["ms-MY"]: "ms-MY-OsmanNeural",
    ["mt-MT"]: "mt-MT-GraceNeural",
    ["my-MM"]: "my-MM-NilarNeural",
    ["nb-NO"]: "nb-NO-PernilleNeural",
    ["nl-BE"]: "nl-BE-ArnaudNeural",
    ["nl-NL"]: "nl-NL-ColetteNeural",
    ["pl-PL"]: "pl-PL-AgnieszkaNeural",
    ["ps-AF"]: "ps-AF-GulNawazNeural",
    ["pt-BR"]: "pt-BR-FranciscaNeural",
    ["pt-PT"]: "pt-PT-DuarteNeural",
    ["ro-RO"]: "ro-RO-AlinaNeural",
    ["ru-RU"]: "ru-RU-SvetlanaNeural",
    ["si-LK"]: "si-LK-SameeraNeural",
    ["sk-SK"]: "sk-SK-LukasNeural",
    ["sl-SI"]: "sl-SI-PetraNeural",
    ["so-SO"]: "so-SO-MuuseNeural",
    ["sr-RS"]: "sr-RS-NicholasNeural",
    ["su-ID"]: "su-ID-JajangNeural",
    ["sv-SE"]: "sv-SE-SofieNeural",
    ["sw-KE"]: "sw-KE-RafikiNeural",
    ["sw-TZ"]: "sw-TZ-DaudiNeural",
    ["ta-IN"]: "ta-IN-PallaviNeural",
    ["ta-LK"]: "ta-LK-KumarNeural",
    ["ta-SG"]: "ta-SG-AnbuNeural",
    ["te-IN"]: "te-IN-MohanNeural",
    ["th-TH"]: "th-TH-PremwadeeNeural",
    ["tr-TR"]: "tr-TR-AhmetNeural",
    ["uk-UA"]: "uk-UA-OstapNeural",
    ["ur-IN"]: "ur-IN-GulNeural",
    ["ur-PK"]: "ur-PK-AsadNeural",
    ["uz-UZ"]: "uz-UZ-MadinaNeural",
    ["vi-VN"]: "vi-VN-HoaiMyNeural",
    ["zh-CN"]: "zh-CN-XiaoxiaoNeural",
    ["zh-HK"]: "zh-HK-HiuMaanNeural",
    ["zh-TW"]: "zh-TW-HsiaoChenNeural",
    ["zu-ZA"]: "zu-ZA-ThandoNeural",
};


interface EdgeTTSOptions extends SpeakOptions {
    voice?: string;
    rate?: number;
    volume?: number;
    stream?: boolean;
}




// Create a play pool
// let playPool: string[] = [];
// a sorted map of text to audio path
interface PlayPoolItem {
    text: string
    path?: string
    processed?: boolean
}
let playPool: PlayPoolItem[] = [];

// Function to add to play pool
function addToPlayPool(item: PlayPoolItem): void {
    // console.log("addToPlayPool", item.text)
    const poolItem = playPool.find((p) => p.text === item.text)
    if (poolItem) {
        poolItem.path = item.path
    } else {
        playPool.push(item);
    }
}

let isPlaying = false;
// Function to play from play pool
async function playFromPlayPool(): Promise<void> {
    let unprocessedItems = playPool.filter((item) => { return !item.processed })
    // console.log("play", "pre begin", unprocessedItems.length)
    if (!isPlaying && unprocessedItems.length > 0) {

        let audioPath = playPool.find((p) => !p.processed);
        AudioPlayer.show();
        // console.log("play", "begin", audioPath?.text, audioPath?.path)

        isPlaying = true;
        if (audioPath && audioPath.path && fs.existsSync(audioPath.path)) {
            // console.log("play", "playing", audioPath?.text)
            audioPath.path && await AudioPlayer.play(audioPath.path);

            audioPath.processed = true;
            // console.log("play", "end", audioPath?.text)
            audioPath = playPool.find((p) => !p.processed);
            // console.log("play", "end2", audioPath)
        }
        isPlaying = false;
        audioPath = playPool.find((p) => !p.processed);
        // console.log("play", "end isPlaying", audioPath)
        if (audioPath && audioPath.path && fs.existsSync(audioPath.path)) {
            playFromPlayPool();
        }
    }
    unprocessedItems = playPool.filter((item) => { return !item.processed })
    // console.log("play", "after begin", unprocessedItems.length)
    if (unprocessedItems.length <= 0) {
        AudioPlayer.hide();
    }
}


export function speakSentence(text: string, options: any) {

    return new Promise<PlayPoolItem>(async (resolve) => {
        // const newPath = await edge(text, lang, outputPath, voice, rate, volume)
        try {
            const ttsProvider: TTSProviderBase = ServiceProvider.load(options)
            const newPath = await ttsProvider.speak(text)
            console.log("newPath", newPath)
            resolve(newPath)
        } catch (error) {
            console.log("error", error)
            resolve({
                path: "",
                text: text
            })
        }
    });
}

export async function openaiTTS({ text, options, retry = 0 }: { text: string, options: any, retry?: number }): Promise<PlayPoolItem> {
    try {

        const textMD5 = MD5Util.getMd5(text)

        let outputDir = `${environment.cachePath}/tts/${options.voice}/${options.modelName}`

        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        const outputPath = path.join(outputDir, `${textMD5}.mp3`);

        if (fs.existsSync(outputPath)) {
            // get absolute path
            return {
                path: outputPath,
                text: text
            }
        }

        const writeFileAsync = promisify(writeFile);

        const OPENAI_API_KEY = options.openAIApiKey; // Replace with your actual API key

        const data = {
            model: options.modelName,
            input: text,
            voice: options.voice
        };

        const ttsUrl = `${options.baseUrl}/audio/speech`

        const response = await axios.post(ttsUrl, data, {
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            responseType: 'arraybuffer'
        });

        const buffer = Buffer.from(response.data);

        await writeFileAsync(outputPath, buffer);
        return {
            path: outputPath,
            text: text
        }
    } catch (e) {
        console.log("e", e)
        if (retry < 3) {
            return await openaiTTS({ text, options, retry: retry + 1 })
        }
        return {
            path: "",
            text: text
        }
    }
}


let tmpStreamPlayPool: string[] = [];


// Function to play from play pool


export async function speak({ text, stream = false, streamEnd = true, streamStart = false, options = {} }: EdgeTTSOptions) {

    if (stream) {
        if (streamStart) {
            tmpStreamPlayPool = [];
            isPlaying = false;
            playPool = [];
            return
        }

        const textArr = AudioPlayer.splitSentence(text, AudioPlayer.streamSplitSize, streamEnd)

        for (const text of textArr) {
            if (!tmpStreamPlayPool.includes(text)) {
                console.log("newText", text)
                tmpStreamPlayPool.push(text);
                playPool.push({
                    text,
                    processed: false
                })
                speakSentence(text, options).then(async (item) => {
                    if (item && item.path && item.path.trim() !== "") {

                        addToPlayPool(item);
                        playFromPlayPool().then()
                    } else {
                        let audioPath = playPool.find((p) => p.text === text);
                        if (audioPath) {
                            audioPath.processed = true
                        }
                        playFromPlayPool().then()
                    }
                })
            }
        }

    } else {
        playPool = [];
        isPlaying = false
        const textArr = AudioPlayer.splitSentence(text, 100)
        console.log("textArr", textArr)

        for (const text of textArr) {
            try {
                playPool.push({
                    text,
                    processed: false
                })
                speakSentence(text, options).then((item) => {
                    if (item && item.path && item.path.trim() !== "") {
                        addToPlayPool(item);
                        playFromPlayPool();
                    } else {
                        let audioPath = playPool.find((p) => p.text === text);
                        if (audioPath) {
                            audioPath.processed = true
                        }
                        playFromPlayPool();
                    }
                })
            } catch (e) {
                console.log(e)
            }
        }
    }



    return {
        stopSpeak: () => {
            try {
                // stopped = true;
            } catch (e) {

            }
        },
    };
}

const voiceListURL =
    "https://speech.platform.bing.com/consumer/speech/synthesize/" +
    "readaloud/voices/list?trustedclienttoken=" +
    trustedClientToken;

interface EdgeVoice {
    FriendlyName: string;
    Gender: string;
    Locale: string;
    ShortName: string;
    Name: string;
    SuggestedCodec: string;
}

export async function getEdgeVoices() {
    const response = await fetch(voiceListURL, {
        headers: {
            "Authority": "speech.platform.bing.com",
            "Sec-CH-UA": "\" Not;A Brand\";v=\"99\", \"Microsoft Edge\";v=\"91\", \"Chromium\";v=\"91\"",
            "Sec-CH-UA-Mobile": "?0",
            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.77 Safari/537.36 Edg/91.0.864.41",
            "Accept": "*/*",
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Dest": "empty",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "en-US,en;q=0.9",
        },
    });
    const voices: EdgeVoice[] = await response.json();
    return voices.map((voice) => ({
        name: voice.FriendlyName,
        lang: voice.Locale,
        voiceURI: voice.Name,
    })) as SpeechSynthesisVoice[];
}

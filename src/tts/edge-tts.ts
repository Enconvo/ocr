import { SpeakOptions } from "@/tts/types.js";
import WebSocket from "ws";
import * as fs from "fs";
import { AudioPlayer, MD5Util, environment, uuid } from "@enconvo/api";
import * as path from "path";
import * as os from "os";
import { writeFile } from 'fs';
import { promisify } from 'util';
import axios from "axios";
import { execSync } from "child_process";

function mkssml(text: string, voice: string, rate: number, volume: number) {
    return (
        "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>" +
        `<voice name='${voice}'><prosody pitch='+0Hz' rate='${rate}' volume='${volume}'>` +
        `${text}</prosody></voice></speak>`
    );
}

function ssmlHeadersPlusData(requestId: string, timestamp: string, ssml: string) {
    return (
        `X-RequestId:${requestId}\r\n` +
        "Content-Type:application/ssml+xml\r\n" +
        `X-Timestamp:${timestamp}Z\r\n` + // This is not a mistake, Microsoft Edge bug.
        `Path:ssml\r\n\r\n` +
        `${ssml}`
    );
}

function getHeadersAndData(data: string) {
    const headers: { [key: string]: string } = {};
    data.slice(0, data.indexOf("\r\n\r\n"))
        .split("\r\n")
        .forEach((line) => {
            const [key, value] = line.split(":", 2);
            headers[key] = value;
        });
    return { headers, data: data.slice(data.indexOf("\r\n\r\n") + 4) };
}

const trustedClientToken = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
const wssURL =
    "wss://speech.platform.bing.com/consumer/speech/synthesize/" +
    "readaloud/edge/v1?TrustedClientToken=" +
    trustedClientToken;

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

function dictReplace(s: string, d: Record<string, string>): string {
    for (const [key, value] of Object.entries(d)) {
        s = s.split(key).join(value);
    }
    return s;
}

function escape(data: string, entities: Record<string, string> = {}): string {
    data = data.replace(/&/g, "&amp;");
    data = data.replace(/>/g, "&gt;");
    data = data.replace(/</g, "&lt;");
    if (Object.keys(entities).length > 0) {
        data = dictReplace(data, entities);
    }
    return data;
}

function removeIncompatibleCharacters(str: string): string {
    const chars: string[] = Array.from(str);

    for (let idx = 0; idx < chars.length; idx++) {
        const char = chars[idx];
        const code = char.charCodeAt(0);
        if ((code >= 0 && code <= 8) || (code >= 11 && code <= 12) || (code >= 14 && code <= 31)) {
            chars[idx] = " ";
        }
    }

    return chars.join("");
}

function* splitTextByByteLength(text: string, byteLength: number): Generator<string, void, void> {
    if (byteLength <= 0) {
        throw new Error("byteLength must be greater than 0");
    }

    while (text.length > byteLength) {
        // Find the last space in the string
        let splitAt = text.lastIndexOf(" ", byteLength);

        // If no space found, splitAt is byteLength
        splitAt = splitAt !== -1 ? splitAt : byteLength;

        // Verify all & are terminated with a ;
        while (text.slice(0, splitAt).includes("&")) {
            const ampersandIndex = text.lastIndexOf("&", splitAt);
            if (text.slice(ampersandIndex, splitAt).includes(";")) {
                break;
            }

            splitAt = ampersandIndex - 1;
            if (splitAt < 0) {
                throw new Error("Maximum byte length is too small or invalid text");
            }
            if (splitAt === 0) {
                break;
            }
        }

        // Append the string to the list
        const newText = text.slice(0, splitAt).trim();
        if (newText.length > 0) {
            yield newText;
        }
        if (splitAt === 0) {
            splitAt = 1;
        }
        text = text.slice(splitAt);
    }

    text = text.trim();
    if (text.length > 0) {
        yield text;
    }
}

function calcMaxMesgSize(voice: string, rate: number, volume: number): number {
    const connectId = uuid().replace(/-/g, "");
    const date = new Date().toString();
    const websocketMaxSize: number = 2 ** 16;
    const overheadPerMessage: number = ssmlHeadersPlusData(connectId, date, mkssml("", voice, rate, volume)).length + 50; // margin of error

    return websocketMaxSize - overheadPerMessage;
}

interface EdgeTTSOptions extends SpeakOptions {
    voice?: string;
    rate?: number;
    volume?: number;
    stream?: boolean;
}



const waitForOpenConnection = (ws: WebSocket) => {
    return new Promise<void>((resolve, reject) => {
        ws.addEventListener("open", () => {

            resolve();
        });

    });
}

// Create a play pool
// let playPool: string[] = [];
// a sorted map of text to audio path
let playPool: string[] = [];
let draftPool: string[] = [];
let preDraftPool: string[] = [];

// Function to add to play pool
function addToPlayPool(audioPath: string): void {
    playPool.push(audioPath);
}

let isPlaying = false;
// Function to play from play pool
async function playFromPlayPool(stream: boolean = false): Promise<void> {
    while (!isPlaying && playPool.length > 0) {
        if (stream && preDraftPool.length <= 0) {
            AudioPlayer.show();
        }

        let audioPath = playPool.shift();
        isPlaying = true;
        await AudioPlayer.play(audioPath);
        isPlaying = false;

        if (!stream) {
            draftPool.shift()
            if (draftPool.length <= 0) {
                AudioPlayer.hide()
            }
        } else {
            preDraftPool.push(audioPath ?? "")
            if (preDraftPool.length === draftPool.length) {
                AudioPlayer.hide()
            }
        }
    }
}


export async function speakSentence(text: string, lang: string | undefined, voice: string, rate: number, volume: number, options: any) {

    return new Promise<string>(async (resolve, reject) => {
        const textMD5 = await MD5Util.getMd5(text)

        let outputDir = path.join(os.homedir(), `Library/Caches/com.frostyeve.enconvo/tts/${environment.commandName}/`);

        if (environment.commandName === "read_aloud") {
            outputDir = path.join(os.homedir(), `Library/Caches/com.frostyeve.enconvo/tts/${environment.commandName}/${voice}`)
        } else if (environment.commandName === "openai") {
            outputDir = path.join(os.homedir(), `Library/Caches/com.frostyeve.enconvo/tts/${environment.commandName}/${options.voice}/${options.modelName}`)
        }


        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        const outputPath = path.join(outputDir, `${textMD5}.m4a`);
        if (fs.existsSync(outputPath)) {

            // get absolute path
            resolve(outputPath)
            return;
        }
        const commandName = options.commandName || environment.commandName
        console.log("options-", commandName)
        console.log("options", options)
        // const newPath = await edge(text, lang, outputPath, voice, rate, volume)
        if (commandName === "read_aloud") {
            console.log("tts", text, outputPath)
            const newPath = await edge(text, lang, outputPath, voice, rate, volume)
            resolve(newPath)
            return
        } else if (commandName === "openai") {
            const newPath = await openaiTTS(text, lang, outputPath, voice, rate, volume, options)
            resolve(newPath)
            return
        } else if (commandName === "system") {
            const newPath = await systemTTS(text, lang, outputPath, voice, rate, volume, options)
            resolve(newPath)
            return
        }
    });
}

export async function systemTTS(text: string, lang: string | undefined, outputPath: string, voice: string, rate: number, volume: number, options: any) {

    try {

        // 调用 say “hello world” -o hello.m4a
        execSync(`say '${text}' -o ${outputPath}`, { stdio: 'inherit' });

        return outputPath
    } catch (e) {
        return ""
    }
}

export async function openaiTTS(text: string, lang: string | undefined, outputPath: string, voice: string, rate: number, volume: number, options: any) {

    try {
        const writeFileAsync = promisify(writeFile);

        const OPENAI_API_KEY = options.openAIApiKey; // Replace with your actual API key

        const data = {
            model: options.modelName,
            input: text,
            voice: options.voice
        };

        options.baseUrl = options.baseUrl || "https://api.openai.com/v1";

        if (options.baseUrl === 'https://api.openai.com' || options.baseUrl === 'https://api.openai.com/') {
            options.baseUrl = 'https://api.openai.com/v1';
        }

        // if (options.baseUrl === 'https://api.openai.com/v1') {
        //     options.baseUrl = 'https://ai.openreader.xyz/v1'
        // }

        const ttsUrl = `${options.baseUrl}/audio/speech`
        console.log("ttsUrl", ttsUrl)

        const response = await axios.post(ttsUrl, data, {
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            responseType: 'arraybuffer'
        });

        const buffer = Buffer.from(response.data);

        await writeFileAsync(outputPath, buffer);
        return outputPath
    } catch (e) {
        return ""
    }
}

export async function edge(text: string, lang: string | undefined, outputPath: string, voice: string, rate: number, volume: number) {
    return new Promise<string>(async (resolve, reject) => {
        let stopped = false;

        const connectId = uuidv4().replace(/-/g, "");
        const ws = new WebSocket(`${wssURL}&ConnectionId=${connectId}`);
        ws.binaryType = "arraybuffer";

        await waitForOpenConnection(ws);


        ws.addEventListener("close", () => {

        });

        let audioData = new ArrayBuffer(0);
        let downloadAudio = false;

        const date = new Date().toString();


        ws.addEventListener("error", (err) => {

            reject(err);
        });

        ws.addEventListener("message", async (event) => {
            if (typeof event.data === "string") {
                const { headers } = getHeadersAndData(event.data);
                const pathHeader = headers["Path"];
                switch (pathHeader) {
                    case "turn.start":
                        downloadAudio = true;

                        break;
                    case "turn.end": {

                        downloadAudio = false;
                        if (!audioData.byteLength || stopped) {

                            // get absolute path
                            // remove all listeners,去掉监听，让程序退出
                            ws.removeAllListeners();
                            // close ws
                            ws.close();
                            reject("stopped");
                            return;
                        }
                        // save as mp3

                        let buffer = Buffer.from(audioData);

                        if (!fs.existsSync(path.dirname(outputPath))) {
                            fs.mkdirSync(path.dirname(outputPath), { recursive: true });
                        }

                        if (!fs.existsSync(outputPath)) {
                            fs.writeFileSync(outputPath, buffer);
                        }


                        // get absolute path
                        // remove all listeners,去掉监听，让程序退出
                        ws.removeAllListeners();
                        // close ws
                        ws.close();
                        resolve(outputPath);

                        break;
                    }
                }
            } else if (event.data instanceof ArrayBuffer) {
                if (!downloadAudio) {
                    return;
                }
                // See: https://github.com/microsoft/cognitive-services-speech-sdk-js/blob/d071d11d1e9f34d6f79d0ab6114c90eecb02ba1f/src/common.speech/WebsocketMessageFormatter.ts#L46-L47
                const dataview = new DataView(event.data);
                const headerLength = dataview.getInt16(0);
                if (event.data.byteLength > headerLength + 2) {
                    const newBody = event.data.slice(2 + headerLength);
                    const newAudioData = new ArrayBuffer(audioData.byteLength + newBody.byteLength);
                    const mergedUint8Array = new Uint8Array(newAudioData);
                    mergedUint8Array.set(new Uint8Array(audioData), 0);
                    mergedUint8Array.set(new Uint8Array(newBody), audioData.byteLength);
                    audioData = newAudioData;
                }
            }
        });

        ws.send(
            `X-Timestamp:${date}\r\n` +
            "Content-Type:application/json; charset=utf-8\r\n" +
            "Path:speech.config\r\n\r\n" +
            "{\"context\":{\"synthesis\":{\"audio\":{\"metadataoptions\":{" +
            "\"sentenceBoundaryEnabled\":false,\"wordBoundaryEnabled\":true}," +
            "\"outputFormat\":\"audio-24khz-48kbitrate-mono-mp3\"" +
            "}}}}\r\n"
        );

        ws.send(
            ssmlHeadersPlusData(
                connectId,
                date,
                mkssml(text, voice ?? languageToDefaultVoice[lang ?? "en-US"], rate, volume)
            )
        );

    });
}


let streamPlayPool: string[] = [];
let tmpStreamPlayPool: string[] = [];
// Function to add to play pool
function addToStreamPlayPool(audioPath: string): void {
    streamPlayPool.push(audioPath);
    tmpStreamPlayPool.push(audioPath);
}

let isStreamPlaying = false;
// Function to play from play pool
async function playFromStreamPlayPool(lang?: string, voice?: string, rate: number = 1, volume: number = 100, options: object = {}): Promise<void> {
    while (!isStreamPlaying && streamPlayPool.length > 0) {
        isStreamPlaying = true;

        const tmplayPool = [...streamPlayPool];

        for (const text of tmplayPool) {
            try {
                const path = await speakSentence(escape(removeIncompatibleCharacters(text)), lang, voice, rate, volume, options)
                // const path = "/Users/ysnows/Library/Caches/com.frostyeve.enconvo/tts/read_aloud/0a34771119d032c7b0347156e2b3e2e2.mp3";
                addToPlayPool(path);
                playFromPlayPool(true);
                // remove from streamPlayPool
                streamPlayPool.shift();
            } catch (e) {
                console.log(e)
            }
        }

        isStreamPlaying = false;
    }
}


export async function speak({ text, lang, onFinish, voice, rate = 1, volume = 100, stream = false, streamEnd = true, streamStart = false, save, options = {} }: EdgeTTSOptions) {

    if (streamStart) {
        tmpStreamPlayPool = [];
        streamPlayPool = [];
        isStreamPlaying = false;
        isPlaying = false;
        playPool = [];
        draftPool = [];
        preDraftPool = [];
    }

    const texts = splitTextByByteLength(
        escape(removeIncompatibleCharacters(text)),
        calcMaxMesgSize(voice ?? languageToDefaultVoice[lang ?? "en-US"], rate, volume)
    );

    for (const content of texts) {

        if (save) {
            try {
                const path = await speakSentence(escape(removeIncompatibleCharacters(content)), lang, voice, rate, volume, options)
                console.log("path", path)
            } catch (e) {
                console.log(e)
            }
            return
        }


        if (stream) {
            const textArr = AudioPlayer.splitSentence(content, AudioPlayer.streamSplitSize || 0, streamEnd)
            if (streamEnd) {
                draftPool = [...textArr]
            }

            let needPlay = false
            for (const text of textArr) {
                if (!tmpStreamPlayPool.includes(text)) {
                    addToStreamPlayPool(text);
                    needPlay = true;
                }
            }


            if (needPlay) {
                playFromStreamPlayPool(lang, voice, rate, volume, options);
            }

            if (streamEnd) {
                tmpStreamPlayPool = [];
            }

        } else {
            playPool = [];
            draftPool = [];
            isPlaying = false

            const textArr = AudioPlayer.splitSentence(content, 100)
            draftPool = [...textArr]
            AudioPlayer.show()

            for (const text of textArr) {
                try {
                    const path = await speakSentence(escape(removeIncompatibleCharacters(text)), lang, voice, rate, volume, options)
                    addToPlayPool(path);
                    playFromPlayPool();
                } catch (e) {
                    console.log(e)
                }
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

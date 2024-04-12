import * as fs from "fs";
import { TTSOptions, TTSProviderBase, AudioPlayer, ServiceProvider } from "@enconvo/api";

// Create a play pool
// let playPool: string[] = [];
// a sorted map of text to audio path
interface PlayPoolItem {
    text: string
    path?: string
    processed?: boolean
}
let playPool: PlayPoolItem[] = [];


export interface SpeakOptions {
    text: string;
    stream?: boolean;
    streamEnd?: boolean;
    streamStart?: boolean;
    options?: TTSOptions;
}

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



export function speakSentence(text: string) {

    return new Promise<PlayPoolItem>(async (resolve) => {
        // const newPath = await edge(text, lang, outputPath, voice, rate, volume)
        try {
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


let tmpStreamPlayPool: string[] = [];


let ttsProvider: TTSProviderBase

export async function speak({ text, stream = false, streamEnd = true, streamStart = false, options }: SpeakOptions) {

    if (stream) {
        if (streamStart) {
            ttsProvider = ServiceProvider.load(options)
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
                speakSentence(text).then(async (item) => {
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
        ttsProvider = ServiceProvider.load(options)
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
                speakSentence(text).then((item) => {
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


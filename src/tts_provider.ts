import { MD5Util, environment } from "@enconvo/api";
import path from "path";
import fs from "fs"

export interface TTSItem {
    text: string;
    path?: string;
}

export type TTSOptions = {
    voice: string;
    [key: string]: any;
};


export abstract class TTSProviderBase {
    ttsOptions: TTSOptions;

    constructor(fields: { ttsOptions: TTSOptions }) {
        this.ttsOptions = fields.ttsOptions
    }

    protected abstract _speak({ text, audioFilePath }: { text: string; audioFilePath: string; }): Promise<TTSItem>;

    async speak(text: string): Promise<TTSItem> {

        const textMD5 = MD5Util.getMd5(text)
        // import at the top of the file

        let outputDir = `${environment.cachePath}/tts/${environment.commandName}/${this.ttsOptions.voice}`

        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const audioFilePath = path.join(outputDir, `${textMD5}`);

        if (fs.existsSync(audioFilePath)) {
            // get absolute path
            return {
                path: audioFilePath,
                text: text
            }
        }


        async function executeSpeak(provider: TTSProviderBase, text: string, audioFilePath: string, retry: number) {
            try {
                const result = await provider._speak({ text, audioFilePath });
                return result;
            } catch (error) {
                console.log("error", error)
                if (retry < 3) {
                    return await executeSpeak(provider, text, audioFilePath, retry + 1)
                }
                return {
                    path: "",
                    text: text
                }
            }
        }

        return await executeSpeak(this, text, audioFilePath, 0)

    }
}


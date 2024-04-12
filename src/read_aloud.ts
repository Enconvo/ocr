// Usage
import { Action, ActionProps, ChatHistory, Clipboard, res, uuid } from "@enconvo/api";
import { speak } from "@/tts/tts.ts";

export default async function main(req: Request) {
    try {
        const { options } = await req.json()
        const { text, context, tts_providers, new_tts_providers } = options

        let translateText = text || context || options.stream !== true && await Clipboard.selectedText();

        const requestId = uuid()
        // 如果translateText中有换行符，需要添加> 符号
        if (translateText) {
            const displayText = (translateText).replace(/\n/g, "\n> ");
            await res.context({ id: requestId, role: "human", content: `\n\n> ${displayText}\n\n` })
        }

        if (options.stream !== true) {
            await ChatHistory.saveChatMessages({
                input: translateText,
                output: translateText,
                requestId
            });
        }

        await speak({ text: translateText, stream: options.stream, streamEnd: options.streamEnd, streamStart: options.streamStart, options: new_tts_providers || tts_providers });

        const actions: ActionProps[] = [
            Action.PlayAudio(translateText, "Play Again", false),
            Action.PauseResumeAudio()
        ]

        const output = {
            content: translateText,
            actions: actions
        }

        return output;
    } catch (err) {
        return "error" + err;
    }
}

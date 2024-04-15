// Usage
import { Action, ActionProps, ChatHistory, Clipboard, TTS, res, uuid } from "@enconvo/api";

export default async function main(req: Request) {
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

    await TTS.speak({ text: translateText, stream: options.stream, streamEnd: options.streamEnd, ttsOptions: new_tts_providers || tts_providers });

    const actions: ActionProps[] = [
        Action.PlayAudio({
            content: translateText, title: "Play Again", closeMainWindow: false
        }),
        Action.PauseResumeAudio(),
        Action.SaveAsAudioFile({ content: translateText })
    ]

    const output = {
        content: translateText,
        actions: actions
    }

    return output;
}

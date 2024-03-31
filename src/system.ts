// Usage
import { environment, Action, ActionProps, ChatHistory, Clipboard, res } from "@enconvo/api";
import { speak } from "@/tts/index.js";

export default async function main(req: Request) {
    try {
        const { text, context, options } = await req.json()

        let translateText = text || context || options.stream !== true && await Clipboard.selectedText();
        

        // 如果translateText中有换行符，需要添加> 符号
        if (translateText) {
            const displayText = (translateText).replace(/\n/g, "\n> ");
            await res.context(`\n\n> ${displayText}\n\n`);
        }

        const sourceLang = "en";

        if (options.stream !== true) {
            await ChatHistory.saveChatMessages(translateText, translateText);
        }

        await speak({ text: translateText, lang: sourceLang, stream: options.stream, streamEnd: options.streamEnd, streamStart: options.streamStart, options: options });

        
        const actions: ActionProps[] = [
            Action.PlayAudio(translateText, "Play Again", false, {
                commandName: environment.commandName,
                extensionName: environment.extensionName
            }),
            Action.PauseResumeAudio()
        ]

        const output = {
            content: "",
            actions: actions
        }

        return output;
    } catch (err) {
        return "error" + err;
    }
}

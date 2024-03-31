// Usage
import { environment, Action, ActionProps, Clipboard, language, res } from "@enconvo/api";
import { speak } from "@/tts/index.js";

// {
//     "name": "save_audio",
//     "title": "Save To Audio File",
//     "description": "Convert To Audio File",
//     "icon": "icon.png",
//     "mode": "no-view",
//     "preferences": [
//       {
//         "name": "hotkey",
//         "description": "The hotkey used to trigger the command",
//         "type": "hotkey",
//         "required": false,
//         "default": "Option+T",
//         "title": "Hotkey"
//       },
//       {
//         "name": "tts",
//         "description": "Auto play TTS Engine",
//         "required": false,
//         "title": "Auto play TTS Engine",
//         "default": "default|default",
//         "type": "group"
//       }
//     ]
//   }
export default async function main(req: Request) {
    try {
        const { text, context, options } = await req.json()

        let translateText = text || context || await Clipboard.selectedText();
        const ttsOptions = options.tts


        // 如果translateText中有换行符，需要添加> 符号
        if (translateText) {
            const displayText = (translateText).replace(/\n/g, "\n> ");
            await res.context(`\n\n> ${displayText}\n\n`);
        }
        const sourceLang = translateText ? await language.detect(translateText) : "en";

        console.log("ttsOptions",ttsOptions)

        await speak({ text: translateText, lang: sourceLang, stream: false, streamEnd: options.streamEnd, streamStart: options.streamStart, save: true, options: ttsOptions });


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

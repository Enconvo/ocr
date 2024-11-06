// Usage
import { Action, ActionProps, ChatHistory, Clipboard, FileUtil, PlayPoolItem, ServiceProvider, TTS, res, uuid } from "@enconvo/api";

export default async function main(req: Request) {
    const { options } = await req.json()
    const { input_text, selection_text, context_files, context, tts_providers, new_tts_providers } = options

    let filePaths: string[] = context_files || []

    const textFilePaths = filePaths.filter((filePath) => {
        return FileUtil.isTextFile(filePath)
    }).map((filePath) => {
        return {
            id: uuid(),
            filePath: filePath.replace("file://", ""),
            type: "file"
        }
    })
    let docContent = null
    if (textFilePaths.length > 0) {

        const loader: any = await ServiceProvider.load({
            extensionName: "chat_with_doc",
            commandName: "load_docs"
        })

        const docs: any[] = await loader.load({ docs: textFilePaths })
        console.log("docs", docs)
        docContent = docs.map((doc: any) => {
            return doc.pageContent
        }).join("\n\n")
    }

    let translateText = docContent || input_text || context || selection_text || options.stream !== true && await Clipboard.selectedText();

    const requestId = uuid()

    if (options.stream !== true) {
        await ChatHistory.saveChatMessages({
            input: translateText,
            output: translateText,
            requestId
        });
    }

    let currentContent = ''
    await TTS.speak({
        text: translateText, stream: options.stream, streamEnd: options.streamEnd, ttsOptions: new_tts_providers || tts_providers, playCallBack: async (data: PlayPoolItem) => {
            console.log("playCallBack", data)
            currentContent = data.text
            await res.write({
                content: data.text,
                overwriteText: true,
            })
        }
    });

    const actions: ActionProps[] = [
        Action.PlayAudio({
            content: translateText, title: "Play Again", closeMainWindow: false
        }),
        Action.PauseResumeAudio(),
        Action.SaveAsAudioFile({ content: translateText })
    ]

    const output = {
        content: currentContent,
        actions: actions
    }

    return output;
}

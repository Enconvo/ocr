// Usage
import { Action, ActionProps, ChatHistory, Clipboard, PlayPoolItem, ServiceProvider, TTS, isTextFile, res, uuid } from "@enconvo/api";

export default async function main(req: Request) {
    const { options } = await req.json()
    const { text, context, tts_providers, new_tts_providers } = options
    console.log("options", options)

    let filePaths: string[] = options.draggedContext || []

    const textFilePaths = filePaths.filter((filePath) => {
        return isTextFile(filePath)
    }).map((filePath) => {
        return {
            id: uuid(),
            filePath,
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
        docContent = docs.map((doc: any) => {
            return doc.pageContent
        }).join("\n\n")
    }

    let translateText = docContent || text || context || options.stream !== true && await Clipboard.selectedText();

    const requestId = uuid()
    // 如果translateText中有换行符，需要添加> 符号
    if (translateText) {
        await res.context({ id: requestId, role: "human", content: `${docContent ? 'Read Aloud This Document' : translateText}` })
    }

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

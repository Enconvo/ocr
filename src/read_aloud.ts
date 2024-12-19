import { Action, Clipboard, EnconvoResponse, FileUtil, PlayPoolItem, RequestOptions, ResponseAction, ServiceProvider, TTS, res, uuid } from "@enconvo/api";

export default async function main(req: Request): Promise<EnconvoResponse> {
    const options: RequestOptions = await req.json()
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

    let translateText = docContent || input_text || context || selection_text || (await Clipboard.selectedText())

    let currentContent = ''

    await TTS.speak({
        text: translateText, stream: options.stream, streamEnd: options.streamEnd, ttsOptions: new_tts_providers || tts_providers, playCallBack: async (data: PlayPoolItem) => {
            console.log("playCallBack", data)
            currentContent = data.text
            res.write({
                content: data.text,
                action: res.WriteAction.OverwriteLastMessageLastTextContent
            })
        }
    });

    const actions: ResponseAction[] = [
        Action.PlayAudio({
            content: translateText, title: "Play Again", closeMainWindow: false
        }),
        Action.PauseResumeAudio(),
        Action.SaveAsAudioFile({ content: translateText })
    ]

    return {
        type: "text",
        content: currentContent,
        actions: actions
    }
}

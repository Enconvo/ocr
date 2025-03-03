import { Action, BaseChatMessage, ChatMessageContent, Clipboard, PlayPoolItem, registerRespondActions, RequestOptions, Response, ResponseAction, TTS } from "@enconvo/api";

export default async function main(req: Request): Promise<Response> {
    const options: RequestOptions = await req.json()
    const { input_text, selection_text, user_input_text } = options

    let text = user_input_text || input_text || selection_text || (await Clipboard.selectedText())

    let currentContent = ''
    const abortController = new AbortController()

    const stopPlayingAudioAction: ResponseAction = {
        id: "stop_stream_play",
        title: "Stop Playing Audio",
        icon: "sf:headphones.circle",
        shortcut: { key: "t", modifiers: ["cmd"] },
        onAction: async () => {
            console.log("stopPlayingAudioAction111")
            abortController.abort()
        }
    }

    registerRespondActions([stopPlayingAudioAction])


    const readAloudResult = await TTS.readAloud({
        text: text,
        playCallBack: async (data: PlayPoolItem) => {
            // console.log("playCallBack", data)
            currentContent = data.text
        },
        abortController: abortController
    })

    console.log("readAloudResult", readAloudResult.outputFile)

    const actions: ResponseAction[] = [
        Action.ShowInFinder({
            path: readAloudResult.outputFile || ""
        }),
        Action.SaveAsAudioFile({ audioFilePath: readAloudResult.outputFile }),
        Action.PlayAudio({
            audioFilePath: readAloudResult.outputFile, title: "Play Audio", closeMainWindow: false
        }),
        Action.PauseResumeAudio(),
    ]

    return {
        type: "messages",
        messages: [
            BaseChatMessage.assistant([
                ChatMessageContent.audio({ url: `file://${readAloudResult.outputFile}` })
            ])

        ],
        actions: actions
    }
}

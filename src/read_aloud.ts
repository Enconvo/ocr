import { Action, BaseChatMessage, ChatMessageContent, Clipboard, EnconvoResponse, PlayPoolItem, RequestOptions, ResponseAction, TTS } from "@enconvo/api";

export default async function main(req: Request): Promise<EnconvoResponse> {
    const options: RequestOptions = await req.json()
    const { input_text, selection_text, user_input_text } = options

    let text = user_input_text || input_text || selection_text || (await Clipboard.selectedText())

    let currentContent = ''

    const readAloudResult = await TTS.readAloud({
        text: text,
        playCallBack: async (data: PlayPoolItem) => {
            console.log("playCallBack", data)
            currentContent = data.text
        }
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
                ChatMessageContent.file({ url: `file://${readAloudResult.outputFile}` })
            ])

        ],
        actions: actions
    }
}

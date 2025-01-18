import { Action, BaseChatMessage, ChatMessageContent, Clipboard, EnconvoResponse, RequestOptions, ResponseAction, TTSProvider } from "@enconvo/api";

export default async function main(req: Request): Promise<EnconvoResponse> {
    const options: RequestOptions = await req.json()
    const { input_text, selection_text, user_input_text, output_dir, speed } = options

    let text = user_input_text || input_text || selection_text || (await Clipboard.selectedText())

    const ttsProvider = await TTSProvider.fromEnv()
    const ttsItem = await ttsProvider.toFile({
        text,
        outputDir: output_dir,
        speed: Number(speed)
    })

    const actions: ResponseAction[] = [
        Action.ShowInFinder({
            path: ttsItem.path || ""
        }),
        Action.SaveAsAudioFile({ audioFilePath: ttsItem.path }),
        Action.PlayAudio({
            audioFilePath: ttsItem.path, title: "Play Audio", closeMainWindow: false
        }),
        Action.PauseResumeAudio(),
    ]

    return {
        type: "messages",
        messages: [
            BaseChatMessage.assistant([
                ChatMessageContent.audio({ url: `file://${ttsItem.path}` })
            ])

        ],
        actions: actions
    }
}

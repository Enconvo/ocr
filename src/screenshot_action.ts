import { OCRProvider, ScreenshotHelper, EnconvoResponse, NativeAPI, RequestOptions, Clipboard, showHUD, res, BaseChatMessage, ChatMessageContent, SmartBar, CommandManageUtils } from "@enconvo/api";

interface TranslateRequestParams extends RequestOptions {
    show_result_in_smartbar: boolean
    copy_to_clipboard: boolean
    need_ocr: boolean
    post_command: string
}

export default async function main(req: Request): Promise<EnconvoResponse> {
    const options: TranslateRequestParams = await req.json()

    const { path } = await ScreenshotHelper.selectScreenArea()
    console.log('screenshot path', path)
    if (!path) {
        return EnconvoResponse.none()
    }

    if (options.show_result_in_smartbar) {
        await res.write({
            content: BaseChatMessage.user([
                ChatMessageContent.imageUrl({
                    url: path
                })
            ]),
            action: res.WriteAction.AppendMessage
        })

        await res.write({
            content: BaseChatMessage.assistant([
                ChatMessageContent.text("")
            ]),
            action: res.WriteAction.AppendMessage
        })
        SmartBar.show()
    }

    let callCommandParams: Record<string, any> = {}
    if (options.need_ocr === true) {


        res.writeLoading("Performing OCR...")

        const ocrProvider = await OCRProvider.fromEnv()

        const ocrResult = await ocrProvider.ocr({
            image_url: path,
        })

        console.log('ocrResult', ocrResult, options.post_command)
        callCommandParams.input_text = ocrResult.text
    } else {
        callCommandParams.context_files = [
            path
        ]
    }

    if (options.show_result_in_smartbar) {
        const commandInfo = await CommandManageUtils.getCommandInfo(options.post_command)
        res.writeLoading((commandInfo?.title || options.post_command) + " is running...")
    }

    const translateResult = await NativeAPI.callCommand(options.post_command, { ...callCommandParams })
    console.log('result', JSON.stringify(translateResult, null, 2))

    let text = ''

    if (typeof translateResult?.data?.result === 'string') {
        text = translateResult?.data?.result || ''
    } else if (typeof translateResult?.data?.result === 'object') {
        text = JSON.stringify(translateResult?.data?.result, null, 2)
    } else if (Array.isArray(translateResult.data?.messages) && translateResult.data?.messages?.length > 0) {
        const message: BaseChatMessage = translateResult.data?.messages[0]
        if (Array.isArray(message.content)) {
            for (const content of message.content) {
                if (content.type === 'text') {
                    text += content.text + '\n'
                }
            }
        } else if (typeof message.content === 'string') {
            text = message.content
        }
    }

    console.log('translateResult', text)
    if (options.copy_to_clipboard) {
        await Clipboard.copy(text)
        await showHUD("Results copied to clipboard")
    }

    if (options.show_result_in_smartbar) {
        return text
    }


    return EnconvoResponse.none()
}

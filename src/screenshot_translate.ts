import { OCRProvider, ScreenshotHelper, EnconvoResponse, NativeAPI, RequestOptions, Clipboard, showHUD, res, BaseChatMessage, ChatMessageContent } from "@enconvo/api";

interface TranslateRequestParams extends RequestOptions {
    show_result_in_smartbar: boolean
    copy_to_clipboard: boolean
}

export default async function main(req: Request): Promise<EnconvoResponse> {
    const options: TranslateRequestParams = await req.json()

    const { path } = await ScreenshotHelper.selectScreenArea()
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
    }

    const ocrProvider = await OCRProvider.fromEnv()

    const ocrResult = await ocrProvider.ocr({
        image_url: path,
    })

    console.log('ocrResult', ocrResult)

    const translateResult = await NativeAPI.callCommand("translate|translate", { input_text: ocrResult.text })
    const contents = translateResult?.data?.content || []

    if (Array.isArray(contents) && contents.length > 0) {
        const content = contents[0]
        const text = content?.text || ''

        console.log('translateResult', text)
        if (options.copy_to_clipboard) {
            await Clipboard.copy(text)
            await showHUD("Translated results copied to clipboard")
        }

        if (options.show_result_in_smartbar) {
            return text
        }
    }


    return EnconvoResponse.none()
}

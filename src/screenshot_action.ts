import { PanelCoordinator, OCRProvider, ScreenshotHelper, EnconvoResponse, NativeAPI, RequestOptions, Clipboard, showHUD, res, BaseChatMessage, ChatMessageContent, CommandManageUtils, Action, PanelType, NativeEventUtils, environment, BaseChatMessageLike, uuid, Commander, Router, ContextUtils, ScreenshotContextItem } from "@enconvo/api";

interface TranslateRequestParams extends RequestOptions {
    show_result_in_panel: boolean
    copy_to_clipboard: boolean
    need_ocr: boolean
    path: string
    post_command: string
    window_mode: {
        value: PanelType
    }
}

export default async function main(req: Request): Promise<EnconvoResponse> {
    const options: TranslateRequestParams = await req.json()
    const { context_items } = options
    console.log("context_items ,", context_items)
    const screenshotContext = context_items?.find((item) => { return item.type === 'screenshot' }) as ScreenshotContextItem | undefined
    if (!screenshotContext) {
        throw new Error('there is no image')
    }
    let path = screenshotContext.url

    if (options.show_result_in_panel) {
        await PanelCoordinator.openPanel({
            panel: options.window_mode.value || "smart_bar",
            showWebContainer: true
        })

        res.writeLoading("Processing...")
    }

    let callCommandParams: Record<string, any> = {}
    if (options.need_ocr === true) {
        res.writeLoading("Performing OCR...")

        const ocrProvider = await OCRProvider.fromEnv()

        const ocrResult = await ocrProvider.ocr({
            image_url: path,
        })

        callCommandParams.input_text = ocrResult.text
    } else {
        callCommandParams = { context_items }
    }

    const commandKey = options.post_command
    const translateResult = await NativeAPI.request(commandKey, callCommandParams)


    // const result = await response.json()
    console.log('resp', JSON.stringify(translateResult, null, 2))

    console.log('translateResult', translateResult)

    let text = ''

    if (options.show_result_in_panel) {
        return translateResult
    }

    return EnconvoResponse.none()
}

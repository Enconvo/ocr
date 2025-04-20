import { BaseChatMessage, ChatMessageContent, Response, RequestOptions, ResponseAction, OCRProvider, FileUtil, ScreenshotHelper, Clipboard, Toast, showToast, showHUD } from "@enconvo/api";

interface OCRRequestParams extends RequestOptions {
    context_files: string[]
    image_files: string[]
}

export default async function main(req: Request): Promise<Response> {
    const options: OCRRequestParams = await req.json()
    console.log('ocr options', options)

    const { path } = await ScreenshotHelper.selectScreenArea()

    const ocrProvider = await OCRProvider.fromEnv()

    const ocrResult = await ocrProvider.ocr({
        image_url: path,
    })

    await Clipboard.copy(ocrResult.text)

    await showHUD("OCR results copied to clipboard")

    return Response.none()
}

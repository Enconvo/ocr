import { Response, RequestOptions, OCRProvider, FileUtil, ScreenshotHelper, Clipboard, showHUD, SmartBar } from "@enconvo/api";

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

    await SmartBar.show({ context: ocrResult.text })

    return Response.none()
}

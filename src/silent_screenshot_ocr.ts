import { EnconvoResponse, OCRProvider, ScreenshotHelper, Clipboard, showHUD, Command } from "@enconvo/api";


export default async function main(req: Request): Promise<EnconvoResponse> {
    const options = await req.json()


    const { path } = await ScreenshotHelper.selectScreenArea()
    console.log('path', path)
    const ocrProvider = await OCRProvider.fromEnv()
    console.log('ocrProvider', ocrProvider)

    const ocrResult = await ocrProvider.ocr({
        image_url: path,
    })

    await Clipboard.copy(ocrResult.text)

    await showHUD("OCR results copied to clipboard")

    return EnconvoResponse.none()
}

import { RequestOptions, OCRProvider, ScreenshotHelper, SmartBar, EnconvoResponse, Commander } from "@enconvo/api";

interface OCRRequestParams extends RequestOptions {
    context_files: string[]
    image_files: string[]
}

export default async function main(req: Request): Promise<EnconvoResponse> {
    const options: OCRRequestParams = await req.json()
    // console.log('ocr options', options)

    const { path } = await ScreenshotHelper.selectScreenArea()

    const ocrProvider = await OCRProvider.fromEnv()

    const ocrResult = await ocrProvider.ocr({
        image_url: path,
    })

    await SmartBar.show({})
    const context: SmartBar.SelectionTextContext = {
        content: ocrResult.text,
        title: ocrResult.text,
        type: "selectionText",
    }

    await SmartBar.addContexts({ contexts: [context] })

    return EnconvoResponse.none()
}

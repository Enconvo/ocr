import { Response, OCRProvider, ScreenshotHelper, SmartBar, TranslateProvider, CommandUtil, Command } from "@enconvo/api";


export default async function main(req: Request): Promise<Response> {

    const { path } = await ScreenshotHelper.selectScreenArea()

    const ocrProvider = await OCRProvider.fromEnv()

    const ocrResult = await ocrProvider.ocr({
        image_url: path,
    })


    await SmartBar.show({ hotKey: "translate|translate|execute", context: ocrResult.text })

    return Response.none()
}

import { BaseChatMessage, ChatMessageContent, Response, RequestOptions, ResponseAction, OCRProvider, FileUtil } from "@enconvo/api";

interface OCRRequestParams extends RequestOptions {
    context_files: string[]
    image_files: string[]
}

export default async function main(req: Request): Promise<Response> {
    const options: OCRRequestParams = await req.json()
    console.log('ocr options', options)
    const { context_files, image_files } = options

    const { images } = FileUtil.categorizeFiles(image_files || context_files || [])

    const ocrProvider = await OCRProvider.fromEnv()

    const ocrResult = await ocrProvider.ocr({
        image_url: images[0],
    })

    const actions: ResponseAction[] = [

    ]

    return {
        type: "messages",
        messages: [
            BaseChatMessage.assistant([
                // Create HTML content to display the OCR result
                // This HTML mimics a search results page with dictionary entries
                ChatMessageContent.text(ocrResult.text)
            ])

        ],
        actions: actions
    }
}

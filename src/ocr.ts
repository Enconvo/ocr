import { BaseChatMessage, ChatMessageContent, RequestOptions, ResponseAction, OCRProvider, FileUtil, EnconvoResponse, Runtime, Action } from "@enconvo/api";

interface OCRRequestParams extends RequestOptions {
    context_files: string[]
    image_files: string[]
}

export default async function main(req: Request): Promise<EnconvoResponse> {
    const options: OCRRequestParams = await req.json()
    const { context_files, image_files } = options

    const { images } = FileUtil.categorizeFiles(image_files || context_files || [])

    const ocrProvider = await OCRProvider.fromEnv()

    const ocrResult = await ocrProvider.ocr({
        image_url: images[0],
    })

    if (Runtime.isNeedJSONObject()) {
        return EnconvoResponse.json({
            result: ocrResult.text
        })
    }

    const actions: ResponseAction[] = [
        Action.Paste({ title: "Paste", content: ocrResult.text }),
        Action.Paste({ content: ocrResult.text }),
        Action.InsertBelow({ content: ocrResult.text }),
        Action.Copy({ content: ocrResult.text }),
    ]
    return EnconvoResponse.messages(
        [
            BaseChatMessage.assistant([
                ChatMessageContent.text(ocrResult.text)
            ])
        ],
        actions
    )
}

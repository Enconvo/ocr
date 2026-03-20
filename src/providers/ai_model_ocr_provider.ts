import { BaseChatMessage, ChatMessageContent, LLMProvider, OCRProvider } from "@enconvo/api";
export default function main(options: OCRProvider.OCRParams) {
    return new AIModelOCRProvider(options)
}

export class AIModelOCRProvider extends OCRProvider {
    aiModelProvider: LLMProvider
    constructor(options: OCRProvider.OCRParams) {
        super(options)
    }

    async init() {
        if (!this.aiModelProvider) {
            this.aiModelProvider = await LLMProvider.fromOptions(this.options.llm)
        }
    }

    protected async _ocr({ image_url }: OCRProvider.OCRParams): Promise<OCRProvider.OCRItem> {
        await this.init()

        const instruction = this.options.instruction
        console.log('instruction', instruction)
        const ocrResponse = await this.aiModelProvider.stream({
            messages: [
                BaseChatMessage.system(instruction),
                BaseChatMessage.user([
                    ChatMessageContent.imageUrl({ url: image_url }),
                    ChatMessageContent.text(`Extract the text from the image.`)
                ])
            ],
            handleStreamMessages: false
        })


        console.log('ocrResponse', JSON.stringify(ocrResponse, null, 2))

        return {
            text: ocrResponse.text,
        }
    }

}



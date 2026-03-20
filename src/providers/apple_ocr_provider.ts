import { OCRHelper, OCRProvider } from "@enconvo/api";
export default function main(options: OCRProvider.OCRParams) {
    return new AppleOCRProvider(options)
}

export class AppleOCRProvider extends OCRProvider {
    constructor(options: OCRProvider.OCRParams) {
        super(options)
    }

    protected async _ocr({ image_url }: OCRProvider.OCRParams): Promise<OCRProvider.OCRItem> {

        const ocrResponse = await OCRHelper.appleOCR({ image_url })

        console.log('ocrResponse', JSON.stringify(ocrResponse, null, 2))

        return {
            text: ocrResponse.text,
        }
    }
}
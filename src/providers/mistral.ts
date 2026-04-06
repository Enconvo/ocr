import { OCRProvider } from "@enconvo/api";
import { Mistral } from "@mistralai/mistralai";
import fsSync from 'fs';
export default function main(options: OCRProvider.OCRParams) {
    return new MistralOCRProvider(options)
}
import fs from 'fs/promises';

export class MistralOCRProvider extends OCRProvider {
    client: Mistral
    constructor(options: OCRProvider.OCRParams) {
        super(options)
        const credentials = this.options.credentials
        this.client = new Mistral({ apiKey: credentials.apiKey });
    }

    protected async _ocr({ image_url }: OCRProvider.OCRParams): Promise<OCRProvider.OCRItem> {
        // Check if the image is a file:// URL or a web URL
        if (image_url.startsWith('http')) {
            // For web URLs, don't do anything

        } else {
            // For file:// URLs, read the file and upload it to Mistral
            const filePath = image_url.replace('file://', '');

            if (!fsSync.existsSync(filePath)) {
                throw new Error('File does not exist');
            }
            // Read the file content
            const fileContent = await fs.readFile(filePath);

            // Upload the file to Mistral
            const uploadedFile = await this.client.files.upload({
                file: {
                    fileName: filePath.split('/').pop() || 'uploaded_file',
                    content: fileContent,
                },
                // @ts-ignore
                purpose: "ocr"
            });

            const signedUrl = await this.client.files.getSignedUrl({
                fileId: uploadedFile.id,
            });
            image_url = signedUrl.url
            console.log('image_url', image_url)
        }

        // Process the document with OCR
        const ocrResponse = await this.client.ocr.process({
            model: this.options.modelName.value,
            document: {
                type: "image_url",
                imageUrl: image_url
            }
        });

        console.log('ocrResponse', JSON.stringify(ocrResponse, null, 2))

        return {
            text: ocrResponse.pages[0].markdown,
        }
    }
}
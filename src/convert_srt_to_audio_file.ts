import { EnconvoResponse, RequestOptions, ServiceProvider, TTSProvider } from "@enconvo/api";
import { promises as fs } from 'fs';
import * as path from 'path';

export default async function main(req: Request): Promise<EnconvoResponse> {
    const options: RequestOptions = await req.json()
    const { context_files } = options
    console.log("options", options)

    if (!context_files || context_files.length === 0) {
        throw new Error('No context files provided')
    }

    // Remove 'file://' prefix from file paths if present
    let files = context_files.map((file: string) => file.replace('file://', ''))

    // Load TTS provider
    const ttsProvider = await TTSProvider.fromEnv()

    // Process each SRT file
    for (const file of files) {
        if (!file.toLowerCase().endsWith('.srt')) {
            continue
        }

        // Read SRT file content
        const srtContent = await fs.readFile(file, 'utf-8');

        // Parse SRT content
        const subtitles = parseSRT(srtContent)


        // Create output directory if it doesn't exist
        const fileDir = path.dirname(file);
        const outputDir = path.join(fileDir, path.basename(file, '.srt'));


        await fs.mkdir(outputDir, { recursive: true });

        // Convert each subtitle to audio
        for (const subtitle of subtitles) {
            const text = subtitle.text.replace(/\\N/g, ' ').replace(/<[^>]+>/g, '')
            if (!text.trim()) continue

            const item = await ttsProvider.speak(text)
            const filePath = item.path

            // Get first 10 characters of text, remove invalid filename characters
            const sanitizedText = text.slice(0, 10)
                .replace(/[<>:"/\\|?*\n\r]/g, '') // remove invalid filename characters
                .trim();

            // Generate output filename with index and text
            const outputPath = path.join(
                outputDir,
                `${String(subtitle.index).padStart(3, '0')}_${sanitizedText}.mp3`
            );
            // move file
            if (filePath) {
                await fs.rename(filePath, outputPath)
            }

            console.log(`Generated audio for subtitle ${subtitle.index} at ${outputPath}`)
        }
    }

    return "success"
}

interface Subtitle {
    index: number
    startTime: string
    endTime: string
    text: string
}

function parseSRT(content: string): Subtitle[] {
    const blocks = content.trim().split(/\n\s*\n/)
    return blocks.map(block => {
        const lines = block.split('\n')
        const index = parseInt(lines[0])
        const [startTime, endTime] = lines[1].split(' --> ')
        const text = lines.slice(2).join(' ')

        return {
            index,
            startTime,
            endTime,
            text
        }
    })
}

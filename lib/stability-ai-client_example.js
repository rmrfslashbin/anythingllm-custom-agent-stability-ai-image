// file: stability-ai-image/lib/stability-ai-client_example.js
import { StabilityAIClient } from './stability-ai-client.js';
import { writeFile } from 'node:fs/promises';

async function main() {
    // Initialize client
    const client = new StabilityAIClient('your-api-key', {
        clientId: 'my-app',
        clientVersion: '1.0.0'
    });

    try {
        // Generate an image
        const image = await client.generateImage({
            prompt: "A serene landscape with mountains and a lake at sunset",
            model: 'sd3-large',
            aspectRatio: '16:9',
            outputFormat: 'png'
        });
        await writeFile('generated-image.png', image);

        // Upscale an image
        const upscaledImage = await client.upscaleFast('generated-image.png');
        await writeFile('upscaled-image.png', upscaledImage);

        // Convert image to video
        const generationId = await client.imageToVideo('generated-image.png', {
            cfgScale: 1.8,
            motionBucketId: 127
        });

        // Poll for video completion
        let videoResult;
        do {
            videoResult = await client.checkVideoStatus(generationId);
            if (videoResult.status === 'processing') {
                await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
            }
        } while (videoResult.status === 'processing');

        await writeFile('output-video.mp4', videoResult);

        // Get account balance
        const balance = await client.getBalance();
        console.log('Credits remaining:', balance.credits);

    } catch (error) {
        console.error('Error:', error.message);
    }
}

// Execute if run directly
if (import.meta.url === new URL(import.meta.url).href) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

export { main };
// file: run.js

require('dotenv').config();
const fs = require('node:fs/promises');
const { runtime } = require('./handler');

async function ensureOutputDir() {
    try {
        await fs.mkdir('output', { recursive: true });
    } catch (err) {
        if (err.code !== 'EEXIST') {
            throw new Error(`Failed to create output directory: ${err.message}`);
        }
    }
}

async function validateEnvironment() {
    if (!process.env.STABILITY_API_KEY) {
        console.error('\x1b[31mError: STABILITY_API_KEY environment variable is not set\x1b[0m');
        console.log('Please create a .env file with your Stability AI API key:');
        console.log('STABILITY_API_KEY=your-api-key-here');
        process.exit(1);
    }
}

async function saveImage(imageData, timestamp) {
    const filename = `output/image_${timestamp}.png`;
    await fs.writeFile(filename, Buffer.from(imageData, 'base64'));
    return filename;
}

async function main() {
    try {
        await validateEnvironment();

        const context = {
            config: {
                name: 'Stability AI Image Generator',
                version: '1.0.0'
            },
            runtimeArgs: {
                STABILITY_API_KEY: process.env.STABILITY_API_KEY
            },
            introspect: console.log,
            logger: console.error
        };

        const testCases = [
            {
                prompt: "A beautiful sunset over mountains, photorealistic, high quality",
                model: "sd3-large",
                negative_prompt: "dark, stormy, gloomy, low quality, blurry",
                seed: 42
            }
        ];

        await ensureOutputDir();

        for (const input of testCases) {
            console.log(`\n\x1b[34mTesting with configuration:\x1b[0m`);
            console.log(`- Prompt: "${input.prompt}"`);
            console.log(`- Model: ${input.model}`);
            console.log(`- Negative Prompt: "${input.negative_prompt}"`);
            console.log(`- Seed: ${input.seed}`);

            const result = await runtime.handler.call(context, input);
            const parsed = JSON.parse(result);

            if (parsed.success) {
                console.log('\x1b[32mSuccess!\x1b[0m');
                console.log('Generation Details:');
                console.log('- Model:', parsed.metadata.model);
                console.log('- Seed Used:', parsed.metadata.seed);
                console.log('- Timestamp:', parsed.metadata.timestamp);
                console.log('- Image Data Length:', parsed.imageData?.length || 0);

                const filename = await saveImage(parsed.imageData, Date.now());
                console.log(`- Saved image to: ${filename}`);
            } else {
                console.log('\x1b[31mFailed:\x1b[0m', parsed.error);
                console.log('Error Details:');
                console.log('- Timestamp:', parsed.metadata.timestamp);
                console.log('- Attempted Parameters:', parsed.metadata);
            }
        }
    } catch (error) {
        console.error('\x1b[31mFatal error:\x1b[0m', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(error => {
        console.error('\x1b[31mFatal error:\x1b[0m', error.message);
        process.exit(1);
    });
}

module.exports = { main };
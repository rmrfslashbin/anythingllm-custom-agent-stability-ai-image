// file: stability-ai-image/run.js

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const { runtime } = require('./handler');

function truncateBase64(data, length = 20) {
    if (typeof data === 'string' && data.length > length) {
        return data.substr(0, length) + '...';
    }
    return data;
}

async function ensureOutputDir() {
    const outputDir = path.join(__dirname, 'output');
    await fs.mkdir(outputDir, { recursive: true });
    return outputDir;
}

async function validateEnvironment() {
    if (!process.env.STABILITY_API_KEY) {
        console.error('\x1b[31mError: STABILITY_API_KEY environment variable is not set\x1b[0m');
        console.log('Please create a .env file with your Stability AI API key:');
        console.log('STABILITY_API_KEY=your-api-key-here');
        process.exit(1);
    }
}

async function main() {
    try {
        await validateEnvironment();

        const outputDir = await ensureOutputDir();
        console.log(`\x1b[34mOutput directory: ${outputDir}\x1b[0m`);

        const context = {
            config: {
                name: 'Stability AI Image Generator',
                version: '1.0.2'
            },
            runtimeArgs: {
                STABILITY_API_KEY: process.env.STABILITY_API_KEY,
                IMAGE_SAVE_DIRECTORY: outputDir
            },
            introspect: console.log,
            logger: console.error
        };

        const testCases = [
            {
                prompt: "An octopus in a forest, photorealistic, high quality",
                model: "sd3.5-large",
                negative_prompt: "old, vintage, retro",
                seed: 0 //42
            },
            {
                prompt: "A cartoonish octopus in a forest",
                model: "sd3.5-large-turbo",
                negative_prompt: "old, vintage, retro",
                seed: 0 //123456
            }
        ];

        for (const input of testCases) {
            console.log(`\n\x1b[34mTesting with configuration:\x1b[0m`);
            console.log(`- Prompt: "${input.prompt}"`);
            console.log(`- Model: ${input.model}`);
            console.log(`- Negative Prompt: "${input.negative_prompt}"`);
            console.log(`- Seed: ${input.seed}`);

            const result = await runtime.handler.call(context, input);
            const parsed = JSON.parse(result);

            // Truncate base64 data in the parsed result
            if (parsed.metadata && parsed.metadata.output && parsed.metadata.output.base64) {
                parsed.metadata.output.base64 = truncateBase64(parsed.metadata.output.base64);
            }

            if (parsed.success) {
                console.log('\x1b[32mSuccess!\x1b[0m');
                console.log('Generation Details:');
                console.log('- Model:', parsed.metadata.request.model);
                console.log('- Input Seed:', parsed.metadata.request.seed);
                console.log('- Used Seed:', parsed.metadata.output.seed);
                console.log('- Finish Reason:', parsed.metadata.output.finishReason);
                console.log('- Image Saved To:', parsed.metadata.output.savedTo);
                console.log('- Metadata Saved To:', parsed.metadataFilePath);

                // Verify the files exist
                const imageExists = await fs.access(parsed.metadata.output.savedTo).then(() => true).catch(() => false);
                const metadataExists = await fs.access(parsed.metadataFilePath).then(() => true).catch(() => false);

                if (imageExists && metadataExists) {
                    console.log('\x1b[32mImage and metadata files successfully saved and verified.\x1b[0m');
                // Check image file content
                const imageContent = await fs.readFile(parsed.metadata.output.savedTo);
                console.log('Saved image file starts with:', imageContent.toString('hex').substr(0, 20));
                } else {
                    console.log('\x1b[31mWarning: One or more files not found at the specified paths.\x1b[0m');
                }
            } else {
                console.log('\x1b[31mFailed:\x1b[0m', parsed.error);
                console.log('Error Details:');
                console.log('- Request:', parsed.metadata.request);
                console.log('- Output:', parsed.metadata.output);
            }
        }

        console.log(`\n\x1b[34mImages and metadata saved in: ${outputDir}\x1b[0m`);

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

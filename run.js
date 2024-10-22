// File: stability-ai-image/run.js

require('dotenv').config();
const handler = require('./handler');

async function main() {
    // Validate environment
    if (!process.env.STABILITY_API_KEY) {
        console.error('\x1b[31mError: STABILITY_API_KEY environment variable is not set\x1b[0m');
        console.log('Please create a .env file with your Stability AI API key:');
        console.log('STABILITY_API_KEY=your-api-key-here');
        process.exit(1);
    }

    // Mock context
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
            prompt: "A beautiful sunset over mountains",
            model: "sd3-large",
            negative_prompt: "dark, stormy, gloomy",
            seed: 42
        },
        {
            prompt: "Futuristic city with flying cars",
            model: "sd3-large",
            negative_prompt: "pollution, destruction, ruins, dystopian",
            seed: 12345
        },
        {
            prompt: "A serene zen garden",
            model: "sd3-large",
            negative_prompt: "people, buildings, modern objects",
            seed: 67890
        }
    ];

    for (const input of testCases) {
        console.log(`\n\x1b[34mTesting with configuration:\x1b[0m`);
        console.log(`- Prompt: "${input.prompt}"`);
        console.log(`- Model: ${input.model}`);
        console.log(`- Negative Prompt: "${input.negative_prompt}"`);
        console.log(`- Seed: ${input.seed}`);

        try {
            const result = await handler.runtime.handler.call(context, input);
            const parsed = JSON.parse(result);
            if (parsed.success) {
                console.log('\x1b[32mSuccess!\x1b[0m');
                console.log('Generation Details:');
                console.log('- Model:', parsed.metadata.model);
                console.log('- Seed Used:', parsed.metadata.seed);
                console.log('- Timestamp:', parsed.metadata.timestamp);
                console.log('- Image Data Length:', parsed.imageData?.length || 0);
            } else {
                console.log('\x1b[31mFailed:\x1b[0m', parsed.error);
                console.log('Error Details:');
                console.log('- Timestamp:', parsed.metadata.timestamp);
                console.log('- Attempted Parameters:', parsed.metadata);
            }
        } catch (error) {
            console.error('\x1b[31mError:\x1b[0m', error);
        }
    }
}

if (require.main === module) {
    main().catch(error => {
        console.error('\x1b[31mFatal error:\x1b[0m', error);
        process.exit(1);
    });
}
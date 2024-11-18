// File: stability-ai-image/handler.js

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { StabilityAIClient } = require('./lib/stability-ai-client');

function truncateBase64(data, length = 20) {
    return typeof data === 'string' ? `${data.substr(0, length)}...` : data;
}

async function saveMetadata(filePath, metadata) {
    const jsonFilePath = filePath.replace('.png', '.json');
    await fs.writeFile(jsonFilePath, JSON.stringify(metadata, null, 2));
    return jsonFilePath;
}

const runtime = {
    handler: async function ({ prompt, model = 'sd3.5-large', negative_prompt = '', seed = 0, aspect_ratio = '1:1', cfg_scale }) {
        let result = null;
        let metadata = null;
        let filePath = null;
        let metadataFilePath = null;

        try {
            const apiKey = this.runtimeArgs.STABILITY_API_KEY;
            const imageSaveDirectory = this.runtimeArgs.IMAGE_SAVE_DIRECTORY;

            if (!apiKey) {
                throw new Error('STABILITY_API_KEY is required but not provided');
            }
            if (!imageSaveDirectory) {
                throw new Error('IMAGE_SAVE_DIRECTORY is required but not provided');
            }

            const numericSeed = Number(seed);
            if (isNaN(numericSeed) || numericSeed < 0 || numericSeed > 4294967295) {
                throw new Error('Seed must be a number between 0 and 4294967295');
            }

            const client = new StabilityAIClient(apiKey, {
                clientId: this.config.name,
                clientVersion: this.config.version
            });

            const generateOptions = {
                prompt,
                model,
                negativePrompt: negative_prompt,
                seed: numericSeed,
                aspectRatio: aspect_ratio
            };

            if (cfg_scale !== undefined) {
                generateOptions.cfgScale = cfg_scale;
            }

            result = await client.generateImage(generateOptions);

            const imageBuffer = Buffer.from(result.imageData, 'base64');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `image_${timestamp}.png`;
            filePath = path.join(imageSaveDirectory, filename);

            await fs.writeFile(filePath, imageBuffer);
            const base64Hash = crypto.createHash('sha256').update(result.imageData).digest('hex');
            
            const fileHash = crypto.createHash('sha256').update(imageBuffer).digest('hex');
            metadata = {
                request: {
                    prompt,
                    model,
                    negativePrompt: negative_prompt,
                    seed: numericSeed,
                    aspectRatio: aspect_ratio,
                    cfgScale: cfg_scale
                },
                output: {
                    seed: result.seed,
                    finishReason: result.finishReason,
                    savedTo: filePath,
                    base64: truncateBase64(result.imageData),
                    base64_sha256: base64Hash,
                    file_sha256: fileHash
                }
            };

            metadataFilePath = await saveMetadata(filePath, metadata);

            this.introspect(`Image and metadata generated and saved successfully!
              Parameters used:
- Model: ${model}
- Seed: ${result.seed}
- Finish Reason: ${result.finishReason}
- Image saved to: ${filePath}
- Metadata saved to: ${metadataFilePath}
- Base64 SHA-256: ${base64Hash}
- File SHA-256: ${fileHash}`);
              

            return JSON.stringify({
                success: true,
                filePath,
                metadataFilePath,
                metadata
            });

        } catch (error) {
            this.logger(`Error in Stability AI handler: ${error.message}`);
            this.introspect(`Failed to generate or save image: ${error.message}`);

            const errorMetadata = {
                request: {
                    prompt,
                    model,
                    negativePrompt: negative_prompt,
                    seed,
                    aspectRatio: aspect_ratio,
                    cfgScale: cfg_scale
                },
                output: {
                    seed: Number(seed),
                    finishReason: "error",
                    savedTo: null,
                    error: error.message
                }
            };

            return JSON.stringify({
                success: false,
                error: error.message,
                metadata: errorMetadata
            });

        } finally {
            // Clean up and reset variables
            result = null;
            metadata = null;
            filePath = null;
            metadataFilePath = null;
        }
    }
};

module.exports = { runtime };

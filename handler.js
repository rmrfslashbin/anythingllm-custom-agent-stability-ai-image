// File: stability-ai-image/handler.js

const fs = require('fs').promises;
const path = require('path');
const { StabilityAIClient } = require('./lib/stability-ai-client');

async function saveMetadata(filePath, metadata) {
  const jsonFilePath = filePath.replace('.png', '.json');
  await fs.writeFile(jsonFilePath, JSON.stringify(metadata, null, 2));
  return jsonFilePath;
}

const runtime = {
  handler: async function ({ prompt, model = 'sd3-large', negative_prompt = '', seed = 0 }) {
    try {
      this.introspect(`Initializing Stability AI client...`);

      const apiKey = this.runtimeArgs.STABILITY_API_KEY;
      const imageSaveDirectory = this.runtimeArgs.IMAGE_SAVE_DIRECTORY;

      if (!apiKey) {
        throw new Error('STABILITY_API_KEY is required but not provided');
      }

      if (!imageSaveDirectory) {
        throw new Error('IMAGE_SAVE_DIRECTORY is required but not provided');
      }

      // Validate seed range
      const numericSeed = Number(seed);
      if (isNaN(numericSeed) || numericSeed < 0 || numericSeed > 4294967295) {
        throw new Error('Seed must be a number between 0 and 4294967295');
      }

      const client = new StabilityAIClient(apiKey);

      this.introspect(`Generating image with the following parameters:
- Prompt: "${prompt}"
- Model: ${model}
- Negative Prompt: ${negative_prompt ? `"${negative_prompt}"` : 'None'}
- Seed: ${numericSeed}
`);

      const { imageBuffer, seed: usedSeed, finishReason } = await client.generateImage({
        prompt,
        model,
        negativePrompt: negative_prompt,
        seed: numericSeed,
        outputFormat: 'png'
      });

      if (!imageBuffer) {
        throw new Error(`Failed to generate image. Finish reason: ${finishReason}`);
      }
      
      console.log(`Image generated. Buffer length: ${imageBuffer.length}, Seed: ${usedSeed}, Finish Reason: ${finishReason}`);

      // Generate RFC3339 timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `image_${timestamp}.png`;
      const filePath = path.join(imageSaveDirectory, filename);

      // Save the image to the filesystem
      await fs.writeFile(filePath, imageBuffer);

      // Prepare metadata
      const metadata = {
        request: {
          prompt,
          model,
          negativePrompt: negative_prompt,
          seed: numericSeed
        },
        output: {
          seed: usedSeed,
          finishReason,
          savedTo: filePath
        }
      };

      // Save metadata
      const metadataFilePath = await saveMetadata(filePath, metadata);

      this.introspect(`Image and metadata generated and saved successfully!
Parameters used:
- Model: ${model}
- Seed: ${usedSeed}
- Finish Reason: ${finishReason}
- Image saved to: ${filePath}
- Metadata saved to: ${metadataFilePath}`);

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
          seed
        },
        output: {
          seed: Number(seed),
          finishReason: "error",
          savedTo: null
        }
      };

      return JSON.stringify({
        success: false,
        error: error.message,
        metadata: errorMetadata
      });
    }
  }
};

module.exports = { runtime };

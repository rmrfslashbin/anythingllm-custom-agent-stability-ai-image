// File: stability-ai-image/handler.js

const fs = require('fs').promises;
const path = require('path');
const { StabilityAIClient } = require('./lib/stability-ai-client');

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

      const imageBuffer = await client.generateImage({
        prompt,
        model,
        negativePrompt: negative_prompt,
        seed: numericSeed,
        outputFormat: 'png'
      });

      // Generate RFC3339 timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `image_${timestamp}.png`;
      const filePath = path.join(imageSaveDirectory, filename);

      // Save the image to the filesystem
      await fs.writeFile(filePath, imageBuffer);

      this.introspect(`Image generated and saved successfully!
Parameters used:
- Model: ${model}
- Seed: ${numericSeed}
- Saved to: ${filePath}`);

      return JSON.stringify({
        success: true,
        filePath,
        metadata: {
          model,
          prompt,
          negative_prompt,
          seed: numericSeed,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      this.logger(`Error in Stability AI handler: ${error.message}`);
      this.introspect(`Failed to generate or save image: ${error.message}`);

      return JSON.stringify({
        success: false,
        error: error.message,
        metadata: {
          model,
          prompt,
          negative_prompt,
          seed,
          timestamp: new Date().toISOString()
        }
      });
    }
  }
};

module.exports = { runtime };

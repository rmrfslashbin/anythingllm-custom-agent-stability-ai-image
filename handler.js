// File: handler.js

import { StabilityAIClient } from './lib/stability-ai-client.js';

/**
 * @typedef {Object} RuntimeContext
 * @property {Object} runtimeArgs - Runtime configuration arguments
 * @property {string} runtimeArgs.STABILITY_API_KEY - Stability AI API key
 * @property {Function} introspect - Function for logging internal state
 * @property {Function} logger - Function for logging errors
 */

/**
 * @typedef {Object} GenerationResult
 * @property {boolean} success - Whether the generation was successful
 * @property {string} [imageData] - Base64 encoded image data if successful
 * @property {string} [error] - Error message if generation failed
 * @property {Object} metadata - Generation metadata
 * @property {string} metadata.model - Model used for generation
 * @property {string} metadata.prompt - Input prompt
 * @property {string} metadata.negative_prompt - Negative prompt used
 * @property {number} metadata.seed - Seed used for generation
 * @property {string} metadata.timestamp - Generation timestamp
 */

export const runtime = {
  /**
   * Handles image generation requests.
   * @param {Object} params - Request parameters
   * @param {string} params.prompt - Text description of desired image
   * @param {string} [params.model='sd3-large'] - Model to use
   * @param {string} [params.negative_prompt=''] - Elements to avoid
   * @param {number} [params.seed=0] - Generation seed
   * @this {RuntimeContext}
   * @returns {Promise<string>} JSON string containing generation results
   */
  handler: async function ({ prompt, model = 'sd3-large', negative_prompt = '', seed = 0 }) {
    try {
      this.introspect(`Initializing Stability AI client...`);

      const apiKey = this.runtimeArgs.STABILITY_API_KEY;
      if (!apiKey) {
        throw new Error('STABILITY_API_KEY is required but not provided');
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

      // Convert buffer to base64 for return
      const base64Image = imageBuffer.toString('base64');

      this.introspect(`Image generated successfully! 
Parameters used:
- Model: ${model}
- Seed: ${numericSeed}`);

      return JSON.stringify({
        success: true,
        imageData: base64Image,
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
      this.introspect(`Failed to generate image: ${error.message}`);

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
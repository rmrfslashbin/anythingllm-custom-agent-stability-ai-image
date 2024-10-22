// file: lib/stability-ai-client.js
/**
 * @module stability-ai-client
 * @description Client implementation for interacting with Stability AI's image generation API
 */

import fetch from 'node-fetch';
import { FormData } from 'formdata-node';
import { Buffer } from 'node:buffer';

/**
 * Client options for StabilityAIClient
 * @typedef {Object} ClientOptions
 * @property {string} [baseURL='https://api.stability.ai'] - API endpoint
 * @property {string} [clientId] - Custom client identifier
 * @property {string} [clientVersion] - Client version string
 * @property {string} [organizationId] - Organization identifier
 * @property {Function} [fetch] - Custom fetch implementation
 */

/**
 * Image generation options
 * @typedef {Object} GenerationOptions
 * @property {string} prompt - Main text prompt describing desired image
 * @property {string} [model='sd3-large'] - Model to use (sd3-large, sd3-medium, sd3-large-turbo)
 * @property {string} [negativePrompt] - Text describing elements to avoid in the image
 * @property {number} [seed] - Seed for reproducible generation (0-4294967295)
 * @property {number} [cfgScale=7] - How strictly to follow the prompt
 * @property {string} [style='enhance'] - Style preset to apply
 * @property {number} [samples=1] - Number of images to generate
 */

/**
 * Client for interacting with Stability AI's image generation API.
 * @class
 */
class StabilityAIClient {
    /**
     * Creates a new StabilityAIClient instance.
     * @param {string} apiKey - Stability AI API key
     * @param {ClientOptions} [options={}] - Configuration options
     * @throws {Error} If API key is not provided
     */
    constructor(apiKey, options = {}) {
        if (!apiKey) {
            throw new Error('API key is required');
        }

        this.apiKey = apiKey;
        this.baseURL = options.baseURL || 'https://api.stability.ai';
        this.clientId = options.clientId;
        this.clientVersion = options.clientVersion;
        this.organizationId = options.organizationId;
        this.fetch = options.fetch || fetch;
    }

    /**
     * Retrieves common headers for API requests.
     * @private
     * @returns {Object} Headers object with authentication and client info
     */
    _getCommonHeaders() {
        const headers = {
            Authorization: `Bearer ${this.apiKey}`,
            Accept: 'application/json',
        };

        if (this.clientId) {
            headers['Stability-Client-ID'] = this.clientId;
        }

        if (this.clientVersion) {
            headers['Stability-Client-Version'] = this.clientVersion;
        }

        if (this.organizationId) {
            headers['Organization'] = this.organizationId;
        }

        return headers;
    }

    /**
     * Makes an HTTP request to the Stability AI API.
     * @private
     * @param {string} endpoint - API endpoint path
     * @param {Object} options - Fetch options
     * @returns {Promise<Object>} Parsed response data
     * @throws {Error} If request fails or returns error
     */
    async _makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const headers = {
            ...this._getCommonHeaders(),
            ...options.headers,
        };

        try {
            const response = await this.fetch(url, {
                ...options,
                headers,
            });

            let responseData;
            try {
                responseData = await response.json();
            } catch (e) {
                responseData = null;
            }

            if (!response.ok) {
                throw new Error(responseData?.message || `HTTP error! status: ${response.status}`);
            }

            return responseData;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Generates an image based on text prompts.
     * @async
     * @param {GenerationOptions} options - Generation options
     * @returns {Promise<Buffer>} Generated image as a buffer
     * @throws {Error} If image generation fails or no images are generated
     * @example
     * const client = new StabilityAIClient('your-api-key');
     * try {
     *   const imageBuffer = await client.generateImage({
     *     prompt: "A beautiful sunset over mountains",
     *     model: "sd3-large",
     *     negativePrompt: "dark, gloomy",
     *     seed: 42,
     *     cfgScale: 7
     *   });
     *   await fs.writeFile('output.png', imageBuffer);
     * } catch (error) {
     *   console.error('Generation failed:', error);
     * }
     */
    async generateImage(options) {
        const requestBody = {
            text_prompts: [
                {
                    text: options.prompt,
                    weight: 1.0
                }
            ],
            cfg_scale: options.cfgScale || 7,
            style_preset: options.style || "enhance",
            samples: options.samples || 1,
            steps: 50,
        };

        if (options.negativePrompt) {
            requestBody.text_prompts.push({
                text: options.negativePrompt,
                weight: -1.0
            });
        }

        if (options.seed !== undefined) {
            requestBody.seed = options.seed;
        }

        const engineId = this._getEngineId(options.model);
        const response = await this._makeRequest(`/v1/generation/${engineId}/text-to-image`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response?.artifacts?.[0]?.base64) {
            throw new Error('No images were generated');
        }

        return Buffer.from(response.artifacts[0].base64, 'base64');
    }

    /**
     * Maps model names to engine IDs.
     * @private
     * @param {string} model - User-friendly model name
     * @returns {string} Corresponding engine ID
     */
    _getEngineId(model) {
        const engineMap = {
            'sd3-large': 'stable-diffusion-xl-1024-v1-0',
            'sd3-medium': 'stable-diffusion-v1-6',
            'sd3-large-turbo': 'stable-diffusion-xl-1024-v1-0',
            default: 'stable-diffusion-xl-1024-v1-0'
        };

        return engineMap[model] || engineMap.default;
    }
}

export { StabilityAIClient };
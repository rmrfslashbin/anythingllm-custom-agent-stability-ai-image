// file: stability-ai-image/lib/stability-ai-client.js

/**
 * @module stability-ai-client
 * @description Client implementation for interacting with Stability AI's image generation API
 */

const { fetch, FormData } = require('undici');
const { Buffer } = require('node:buffer');

/**
 * Client options for StabilityAIClient
 * @typedef {Object} ClientOptions
 * @property {string} [baseURL='https://api.stability.ai'] - API endpoint
 * @property {string} [clientId] - Custom client identifier
 * @property {string} [clientVersion] - Client version string
 * @property {string} [organizationId] - Organization identifier
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
        this.baseURL = new URL(options.baseURL || 'https://api.stability.ai');
        this.clientId = options.clientId;
        this.clientVersion = options.clientVersion;
        this.organizationId = options.organizationId;
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
        const url = new URL(endpoint, this.baseURL);
        const headers = {
            ...this._getCommonHeaders(),
            ...options.headers,
        };

        try {
            const response = await fetch(url, {
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
     * @param {Object} options - Generation options
     * @returns {Promise<Buffer>} Generated image as a buffer
     * @throws {Error} If image generation fails or no images are generated
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

module.exports = { StabilityAIClient };
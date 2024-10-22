// File: stability-ai-image/lib/stability-ai-client.js

import fetch from 'node-fetch';
import { FormData } from 'formdata-node';
import { Buffer } from 'node:buffer';

export class StabilityAIClient {
    constructor(apiKey, options = {}) {
        if (!apiKey) {
            throw new Error('API key is required');
        }

        this.apiKey = apiKey;
        this.baseURL = options.baseURL || 'https://api.stability.ai';
        this.clientId = options.clientId;
        this.clientVersion = options.clientVersion;
        this.organizationId = options.organizationId;
    }

    /**
     * Gets common headers used in all requests
     * @private
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
     * Makes an API request
     * @private
     */
    async _makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const headers = {
            ...this._getCommonHeaders(),
            ...options.headers,
        };

        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (!response.ok) {
            let error = { message: `HTTP error! status: ${response.status}` };
            try {
                error = await response.json();
            } catch (e) {
                // Keep original error if json parsing fails
            }
            throw new Error(error.message || `HTTP error! status: ${response.status}`);
        }

        return response;
    }

    /**
     * Generate an image from text
     * @param {Object} options
     * @param {string} options.prompt - The text prompt to generate from
     * @param {string} [options.model='stable-diffusion-xl-1024-v1-0'] - The model to use
     * @param {string} [options.negativePrompt] - Text describing what you don't want in the image
     * @param {number} [options.seed=0] - Seed for reproducible results
     * @param {string} [options.style='enhance'] - Style preset to use
     * @param {number} [options.cfgScale=7] - How strictly to follow the prompt (1-35)
     * @param {string} [options.samples=1] - Number of images to generate
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

        // Add negative prompt if provided
        if (options.negativePrompt) {
            requestBody.text_prompts.push({
                text: options.negativePrompt,
                weight: -1.0
            });
        }

        // Add seed if provided
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

        const result = await response.json();

        if (!result.artifacts || !result.artifacts.length) {
            throw new Error('No images were generated');
        }

        // Return the first image as base64
        return Buffer.from(result.artifacts[0].base64, 'base64');
    }

    /**
     * Maps model names to engine IDs
     * @private
     */
    _getEngineId(model) {
        const engineMap = {
            'sd3-large': 'stable-diffusion-xl-1024-v1-0',
            'sd3-medium': 'stable-diffusion-v1-6',
            'sd3-large-turbo': 'stable-diffusion-xl-1024-v1-0', // Using SDXL as fallback
            default: 'stable-diffusion-xl-1024-v1-0'
        };

        return engineMap[model] || engineMap.default;
    }

    /**
     * List available engines
     * @returns {Promise<Array>} List of available engines
     */
    async listEngines() {
        const response = await this._makeRequest('/v1/engines/list');
        return response.json();
    }
}
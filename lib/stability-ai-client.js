// File: lib/stability-ai-client.js

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
        this.fetch = options.fetch || fetch;
    }

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

            // Parse response as JSON
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
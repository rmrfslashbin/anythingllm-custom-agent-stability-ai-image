// File: stability-ai-image/lib/stability-ai-client.js

const axios = require('axios');
const crypto = require('crypto');
const FormData = require('form-data');
const fs = require('fs').promises;
const path = require('path');

class StabilityAIClient {
    constructor(apiKey, options = {}) {
        if (!apiKey) {
            throw new Error('API key is required');
        }

        this.apiKey = apiKey;
        this.baseURL = options.baseURL || 'https://api.stability.ai';
        this.clientId = options.clientId;
        this.clientVersion = options.clientVersion;
    }

    async generateImage(options) {
        const url = `${this.baseURL}/v2beta/stable-image/generate/sd3`;
        const formData = new FormData();

        // Required parameters
        formData.append('prompt', options.prompt);
        formData.append('model', options.model);

        // Optional parameters
        if (options.negativePrompt) {
            formData.append('negative_prompt', options.negativePrompt);
        }
        if (options.seed !== undefined) {
            formData.append('seed', options.seed.toString());
        }
        if (options.cfgScale !== undefined) {
            formData.append('cfg_scale', options.cfgScale.toString());
        }
        if (options.aspectRatio) {
            formData.append('aspect_ratio', options.aspectRatio);
        }

        try {
            const response = await axios.post(url, formData, {
                headers: {
                    ...formData.getHeaders(),
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Accept': 'application/json',
                    'Stability-Client-ID': this.clientId,
                    'Stability-Client-Version': this.clientVersion
                },
                responseType: 'json'
            });

            if (!response.data.image) {
                throw new Error('No image data received from the API');
            }

            return {
                imageData: response.data.image,
                seed: response.data.seed,
                finishReason: response.data.finish_reason
            };
        } catch (error) {
            console.error('Error generating image:', error.message);
            throw error;
        }
    }

}

module.exports = { StabilityAIClient };


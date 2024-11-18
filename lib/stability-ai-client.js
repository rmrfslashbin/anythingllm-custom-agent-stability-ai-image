// File: stability-ai-image/lib/stability-ai-client.js

const axios = require('axios');
const FormData = require('form-data');

class StabilityAIClient {
    constructor(apiKey, config = {}) {
        this.apiKey = apiKey;
        this.baseURL = 'https://api.stability.ai';
        this.clientId = config.clientId || 'StabilityAIClient';
        this.clientVersion = config.clientVersion || '1.0.0';
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
            console.log('Sending request to Stability AI API...');
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

            console.log('Received response from Stability AI API');
            console.log('Response status:', response.status);

            if (!response.data || !response.data.image) {
                console.error('Unexpected API response:', JSON.stringify(response.data, null, 2));
                throw new Error('No image data received from the API');
            }

            return {
                imageData: response.data.image,
                seed: response.data.seed,
                finishReason: response.data.finish_reason
            };
        } catch (error) {
            console.error('Error generating image:', error.message);
            if (error.response) {
                console.error('API response status:', error.response.status);
                console.error('API response headers:', JSON.stringify(error.response.headers, null, 2));
                console.error('API response data:', JSON.stringify(error.response.data, null, 2));
            }
            throw error;
        }
    }
}

module.exports = { StabilityAIClient };

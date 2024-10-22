// file: stability-ai-client.js

// Stability AI API client
// npm install node-fetch form-data

import FormData from 'form-data';
import fetch from 'node-fetch';
import fs from 'node:fs';

class StabilityAIClient {
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
            const error = await response.json();
            throw new Error(error.message || `HTTP error! status: ${response.status}`);
        }

        return response;
    }

    /**
     * Generate an image from text
     * @param {Object} options
     * @param {string} options.prompt - The text prompt to generate from
     * @param {string} [options.model='sd3-large'] - The model to use (sd3-medium, sd3-large, sd3-large-turbo)
     * @param {string} [options.aspectRatio='1:1'] - The aspect ratio of the output image
     * @param {string} [options.negativePrompt] - Text describing what you don't want in the image
     * @param {number} [options.seed=0] - Seed for reproducible results (0 for random)
     * @param {string} [options.outputFormat='png'] - Output format (png, jpeg, webp)
     */
    async generateImage(options) {
        const formData = new FormData();

        formData.append('prompt', options.prompt);

        if (options.negativePrompt) {
            formData.append('negative_prompt', options.negativePrompt);
        }

        if (options.aspectRatio) {
            formData.append('aspect_ratio', options.aspectRatio);
        }

        if (options.seed) {
            formData.append('seed', options.seed);
        }

        if (options.outputFormat) {
            formData.append('output_format', options.outputFormat);
        }

        const model = options.model || 'sd3-large';
        const response = await this._makeRequest(`/v2beta/stable-image/generate/${model}`, {
            method: 'POST',
            body: formData,
            headers: {
                Accept: 'image/*',
            },
        });

        return response.buffer();
    }

    /**
     * Upscale an image using the Fast upscaler
     * @param {string|Buffer} image - Path to image file or image buffer
     * @param {Object} [options]
     * @param {string} [options.outputFormat='png'] - Output format (png, jpeg, webp) 
     */
    async upscaleFast(image, options = {}) {
        const formData = new FormData();

        if (typeof image === 'string') {
            formData.append('image', fs.createReadStream(image));
        } else {
            formData.append('image', image, 'image');
        }

        if (options.outputFormat) {
            formData.append('output_format', options.outputFormat);
        }

        const response = await this._makeRequest('/v2beta/stable-image/upscale/fast', {
            method: 'POST',
            body: formData,
            headers: {
                Accept: 'image/*',
            },
        });

        return response.buffer();
    }

    /**
     * Convert an image to video
     * @param {string|Buffer} image - Path to image file or image buffer
     * @param {Object} [options]
     * @param {number} [options.cfgScale=1.8] - How closely to follow the source image
     * @param {number} [options.motionBucketId=127] - Controls amount of motion
     * @param {number} [options.seed=0] - Seed for reproducible results
     */
    async imageToVideo(image, options = {}) {
        const formData = new FormData();

        if (typeof image === 'string') {
            formData.append('image', fs.createReadStream(image));
        } else {
            formData.append('image', image, 'image');
        }

        if (options.cfgScale) {
            formData.append('cfg_scale', options.cfgScale);
        }

        if (options.motionBucketId) {
            formData.append('motion_bucket_id', options.motionBucketId);
        }

        if (options.seed) {
            formData.append('seed', options.seed);
        }

        const response = await this._makeRequest('/v2beta/image-to-video', {
            method: 'POST',
            body: formData,
        });

        const result = await response.json();
        return result.id; // Returns generation ID to check status
    }

    /**
     * Check the status of a video generation
     * @param {string} generationId - The generation ID from imageToVideo
     */
    async checkVideoStatus(generationId) {
        const response = await this._makeRequest(`/v2beta/image-to-video/result/${generationId}`, {
            headers: {
                Accept: 'video/*',
            },
        });

        if (response.status === 202) {
            return { status: 'processing' };
        }

        return response.buffer();
    }

    /**
     * Remove the background from an image
     * @param {string|Buffer} image - Path to image file or image buffer
     * @param {Object} [options]
     * @param {string} [options.outputFormat='png'] - Output format (png or webp)
     */
    async removeBackground(image, options = {}) {
        const formData = new FormData();

        if (typeof image === 'string') {
            formData.append('image', fs.createReadStream(image));
        } else {
            formData.append('image', image, 'image');
        }

        if (options.outputFormat) {
            formData.append('output_format', options.outputFormat);
        }

        const response = await this._makeRequest('/v2beta/stable-image/edit/remove-background', {
            method: 'POST',
            body: formData,
            headers: {
                Accept: 'image/*',
            },
        });

        return response.buffer();
    }

    /**
     * Get account balance
     * @returns {Promise<{credits: number}>}
     */
    async getBalance() {
        const response = await this._makeRequest('/v1/user/balance');
        return response.json();
    }

    /**
     * Get account details
     * @returns {Promise<Object>} Account information including email and organizations
     */
    async getAccount() {
        const response = await this._makeRequest('/v1/user/account');
        return response.json();
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

export default StabilityAIClient;
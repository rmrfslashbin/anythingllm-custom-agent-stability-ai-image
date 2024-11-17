// File: stability-ai-image/lib/stability-ai-client.js

const { fetch } = require('undici');
const { Buffer } = require('node:buffer');

class StabilityAIClient {
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

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            return response;
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

        const responseData = await response.json();

  if (!responseData?.artifacts?.[0]?.base64) {
    console.error('API Response:', JSON.stringify(responseData, null, 2));
    throw new Error('No images were generated');
  }

  const imageBuffer = Buffer.from(responseData.artifacts[0].base64, 'base64');
  
  if (!imageBuffer || imageBuffer.length === 0) {
    throw new Error('Generated image buffer is empty or invalid');
  }

  return {
    imageBuffer,
    seed: responseData.artifacts[0].seed,
    finishReason: responseData.artifacts[0].finishReason || 'SUCCESS'
  };

    }

    _getEngineId(model) {
        const engineMap = {
            'sd3.5-large': 'stable-diffusion-xl-1024-v1-0',
            'sd3.5-large-turbo': 'stable-diffusion-xl-1024-v1-0',
            'sd3.5-medium': 'stable-diffusion-v1-6',
            'sd3-large': 'stable-diffusion-xl-1024-v1-0',
            'sd3-medium': 'stable-diffusion-v1-6',
            'sd3-large-turbo': 'stable-diffusion-xl-1024-v1-0',
            default: 'stable-diffusion-xl-1024-v1-0'
        };

        return engineMap[model] || engineMap.default;
    }
}

module.exports = { StabilityAIClient };

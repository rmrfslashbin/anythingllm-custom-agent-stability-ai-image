// file: stability-ai-image/__tests__/stability-ai-client.test.js
import { jest, expect, describe, test, beforeEach, afterEach } from '@jest/globals';
import { StabilityAIClient } from '../lib/stability-ai-client.js';

describe('StabilityAIClient', () => {
    const API_KEY = 'test-api-key';
    let mockFetch;

    beforeEach(() => {
        mockFetch = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('constructor requires API key', () => {
        expect(() => new StabilityAIClient()).toThrow('API key is required');
        expect(() => new StabilityAIClient('')).toThrow('API key is required');
        expect(() => new StabilityAIClient(API_KEY)).not.toThrow();
    });

    test('generates correct headers', () => {
        const client = new StabilityAIClient(API_KEY, {
            clientId: 'test-client',
            clientVersion: '1.0.0',
            organizationId: 'test-org'
        });

        const headers = client._getCommonHeaders();
        expect(headers.Authorization).toBe(`Bearer ${API_KEY}`);
        expect(headers['Stability-Client-ID']).toBe('test-client');
        expect(headers['Stability-Client-Version']).toBe('1.0.0');
        expect(headers.Organization).toBe('test-org');
        expect(headers.Accept).toBe('application/json');
    });

    test('generates image with minimum parameters', async () => {
        const mockResponse = {
            artifacts: [{
                base64: 'dGVzdC1pbWFnZS1kYXRh' // base64 encoded "test-image-data"
            }]
        };

        mockFetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: () => Promise.resolve(mockResponse)
        });

        const client = new StabilityAIClient(API_KEY, { fetch: mockFetch });

        const result = await client.generateImage({
            prompt: 'test prompt'
        });

        expect(Buffer.isBuffer(result)).toBe(true);
        expect(mockFetch).toHaveBeenCalledTimes(1);

        const [url, options] = mockFetch.mock.calls[0];
        expect(url).toContain('/v1/generation/');
        expect(options.method).toBe('POST');

        const body = JSON.parse(options.body);
        expect(body).toMatchObject({
            text_prompts: [{ text: 'test prompt', weight: 1.0 }],
            cfg_scale: 7,
            style_preset: 'enhance',
            samples: 1,
            steps: 50
        });
    });

    test('includes negative prompt when provided', async () => {
        const mockResponse = {
            artifacts: [{
                base64: 'dGVzdC1pbWFnZS1kYXRh'
            }]
        };

        mockFetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: () => Promise.resolve(mockResponse)
        });

        const client = new StabilityAIClient(API_KEY, { fetch: mockFetch });

        await client.generateImage({
            prompt: 'test prompt',
            negativePrompt: 'bad quality'
        });

        const [_, options] = mockFetch.mock.calls[0];
        const body = JSON.parse(options.body);
        expect(body.text_prompts).toEqual([
            { text: 'test prompt', weight: 1.0 },
            { text: 'bad quality', weight: -1.0 }
        ]);
    });

    test('handles API errors properly', async () => {
        const errorMessage = 'Insufficient balance';
        mockFetch.mockResolvedValue({
            ok: false,
            status: 402,
            json: () => Promise.resolve({ message: errorMessage })
        });

        const client = new StabilityAIClient(API_KEY, { fetch: mockFetch });

        await expect(client.generateImage({
            prompt: 'test prompt'
        })).rejects.toThrow(errorMessage);
    });

    test('handles non-JSON API errors', async () => {
        mockFetch.mockResolvedValue({
            ok: false,
            status: 500,
            json: () => Promise.reject('Invalid JSON')
        });

        const client = new StabilityAIClient(API_KEY, { fetch: mockFetch });

        await expect(client.generateImage({
            prompt: 'test prompt'
        })).rejects.toThrow('HTTP error! status: 500');
    });
});
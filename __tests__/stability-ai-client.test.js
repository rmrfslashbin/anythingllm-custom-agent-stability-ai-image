// file: __tests__/stability-ai-client.test.js
const { StabilityAIClient } = require('../lib/stability-ai-client');
const { MockAgent, setGlobalDispatcher } = require('undici');

describe('StabilityAIClient', () => {
    const API_KEY = 'test-api-key';
    let mockAgent;
    let mockClient;

    beforeEach(() => {
        // Setup mock agent
        mockAgent = new MockAgent();
        mockAgent.disableNetConnect();
        setGlobalDispatcher(mockAgent);

        // Setup mock pool for stability.ai requests
        mockClient = mockAgent.get('https://api.stability.ai');
    });

    afterEach(async () => {
        await mockAgent.close();
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

        mockClient.intercept({
            path: '/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
            method: 'POST'
        }).reply(200, mockResponse);

        const client = new StabilityAIClient(API_KEY);
        const result = await client.generateImage({
            prompt: 'test prompt'
        });

        expect(Buffer.isBuffer(result)).toBe(true);
    });

    test('includes negative prompt when provided', async () => {
        const mockResponse = {
            artifacts: [{
                base64: 'dGVzdC1pbWFnZS1kYXRh'
            }]
        };

        // Use reply callback to inspect the request body
        mockClient.intercept({
            path: '/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
            method: 'POST'
        }).reply(200, (opts) => {
            const body = JSON.parse(opts.body);
            expect(body.text_prompts).toEqual([
                { text: 'test prompt', weight: 1.0 },
                { text: 'bad quality', weight: -1.0 }
            ]);
            return mockResponse;
        });

        const client = new StabilityAIClient(API_KEY);
        await client.generateImage({
            prompt: 'test prompt',
            negativePrompt: 'bad quality'
        });
    });

    test('handles API errors properly', async () => {
        const errorMessage = 'Insufficient balance';
        mockClient.intercept({
            path: '/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
            method: 'POST'
        }).reply(402, { message: errorMessage });

        const client = new StabilityAIClient(API_KEY);
        await expect(client.generateImage({
            prompt: 'test prompt'
        })).rejects.toThrow(errorMessage);
    });

    test('handles non-JSON API errors', async () => {
        mockClient.intercept({
            path: '/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
            method: 'POST'
        }).reply(500, 'Internal Server Error');

        const client = new StabilityAIClient(API_KEY);
        await expect(client.generateImage({
            prompt: 'test prompt'
        })).rejects.toThrow('HTTP error! status: 500');
    });
});
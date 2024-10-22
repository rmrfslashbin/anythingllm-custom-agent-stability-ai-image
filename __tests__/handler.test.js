// File: stability-ai-image/__tests__/stability-ai-client.test.js

import { StabilityAIClient } from '../lib/stability-ai-client.js';

describe('StabilityAIClient', () => {
  const API_KEY = 'test-api-key';

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
  });

  test('generates image with minimum parameters', async () => {
    const client = new StabilityAIClient(API_KEY);

    // Mock fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8))
      })
    );

    const result = await client.generateImage({
      prompt: 'test prompt'
    });

    expect(Buffer.isBuffer(result)).toBe(true);
    expect(global.fetch).toHaveBeenCalled();
  });
});
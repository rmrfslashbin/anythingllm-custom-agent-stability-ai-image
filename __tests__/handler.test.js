// File: __tests__/handler.test.js
const { runtime } = require('../handler');

describe('Handler', () => {
  let mockContext;

  beforeEach(() => {
    mockContext = {
      runtimeArgs: {
        STABILITY_API_KEY: 'test-key'
      },
      introspect: jest.fn(),
      logger: jest.fn()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('fails gracefully without API key', async () => {
    const context = {
      ...mockContext,
      runtimeArgs: {}
    };

    const result = await runtime.handler.call(context, {
      prompt: 'test prompt'
    });

    const parsed = JSON.parse(result);
    expect(parsed.success).toBe(false);
    expect(parsed.error).toContain('STABILITY_API_KEY is required');
  });

  test('includes all parameters in error metadata', async () => {
    const testParams = {
      prompt: 'test prompt',
      model: 'test-model',
      negative_prompt: 'test negative',
      seed: 42
    };

    const result = await runtime.handler.call(mockContext, testParams);
    const parsed = JSON.parse(result);

    expect(parsed.metadata).toEqual(expect.objectContaining({
      prompt: testParams.prompt,
      model: testParams.model,
      negative_prompt: testParams.negative_prompt,
      seed: testParams.seed
    }));
  });
});
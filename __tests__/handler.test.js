const { runtime } = require('../handler');

describe('Stability AI Image Generator', () => {
  const mockContext = {
    runtimeArgs: {
      STABILITY_API_KEY: 'test-key',
    },
    introspect: jest.fn(),
    logger: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fail gracefully without API key', async () => {
    const context = {
      ...mockContext,
      runtimeArgs: {},
    };
    
    const result = await runtime.handler.call(context, {
      prompt: 'test prompt',
    });
    
    const parsed = JSON.parse(result);
    expect(parsed.success).toBe(false);
    expect(parsed.error).toContain('STABILITY_API_KEY is required');
  });
});

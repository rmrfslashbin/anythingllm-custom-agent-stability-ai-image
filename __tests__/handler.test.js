// File: stability-ai-image/__tests__/handler.test.js

const fs = require('fs').promises;
const path = require('path');
const { runtime } = require('../handler');

// Mock the entire stability-ai-client module
jest.mock('../lib/stability-ai-client', () => {
  const mockGenerateImage = jest.fn();
  return {
    StabilityAIClient: jest.fn().mockImplementation(() => ({
      generateImage: mockGenerateImage
    })),
    mockGenerateImage // Export the mock function for direct manipulation in tests
  };
});

// Import the mocked module and the mockGenerateImage function
const { StabilityAIClient, mockGenerateImage } = require('../lib/stability-ai-client');

describe('Handler', () => {
  let mockContext;
  let tempDir;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(__dirname, 'test-output-'));
    mockContext = {
      runtimeArgs: {
        STABILITY_API_KEY: 'test-key',
        IMAGE_SAVE_DIRECTORY: tempDir
      },
      introspect: jest.fn(),
      logger: jest.fn(),
      config: {
        name: 'Stability AI Image Generator',
        version: '1.0.2'
      }
    };
    // Clear all instances and calls to constructor and all methods:
    StabilityAIClient.mockClear();
    mockGenerateImage.mockClear();
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  test('fails gracefully without API key', async () => {
    const context = {
      ...mockContext,
      runtimeArgs: { IMAGE_SAVE_DIRECTORY: tempDir }
    };

    const result = await runtime.handler.call(context, {
      prompt: 'test prompt'
    });

    const parsed = JSON.parse(result);
    expect(parsed.success).toBe(false);
    expect(parsed.error).toContain('STABILITY_API_KEY is required');
  });

  test('fails gracefully without IMAGE_SAVE_DIRECTORY', async () => {
    const context = {
      ...mockContext,
      runtimeArgs: { STABILITY_API_KEY: 'test-key' }
    };

    const result = await runtime.handler.call(context, {
      prompt: 'test prompt'
    });

    const parsed = JSON.parse(result);
    expect(parsed.success).toBe(false);
    expect(parsed.error).toContain('IMAGE_SAVE_DIRECTORY is required');
  });

  test('includes all parameters in error metadata', async () => {
    const testParams = {
      prompt: 'test prompt',
      model: 'test-model',
      negative_prompt: 'test negative',
      seed: 42
    };

    mockGenerateImage.mockRejectedValue(new Error('API Error'));

    const result = await runtime.handler.call(mockContext, testParams);
    const parsed = JSON.parse(result);

    expect(parsed.success).toBe(false);
    expect(parsed.metadata).toEqual(expect.objectContaining({
      prompt: testParams.prompt,
      model: testParams.model,
      negative_prompt: testParams.negative_prompt,
      seed: testParams.seed
    }));
  });

  test('successfully generates and saves image', async () => {
    const testParams = {
      prompt: 'test prompt',
      model: 'sd3-large',
      negative_prompt: 'test negative',
      seed: 42
    };

    const mockImageBuffer = Buffer.from('fake image data');
    mockGenerateImage.mockResolvedValue(mockImageBuffer);

    const result = await runtime.handler.call(mockContext, testParams);
    console.log('Handler result:', result); // Debug log

    const parsed = JSON.parse(result);
    console.log('Parsed result:', parsed); // Debug log

    expect(parsed.success).toBe(true);
    if (!parsed.success) {
      console.log('Error message:', parsed.error); // Debug log
    }
    expect(parsed.filePath).toBeTruthy();
    expect(parsed.filePath.startsWith(tempDir)).toBe(true);
    expect(parsed.filePath.endsWith('.png')).toBe(true);

    // Verify file was actually created
    const fileExists = await fs.access(parsed.filePath).then(() => true).catch(() => false);
    expect(fileExists).toBe(true);

    // Verify file content
    const savedImageBuffer = await fs.readFile(parsed.filePath);
    expect(savedImageBuffer.equals(mockImageBuffer)).toBe(true);

    expect(parsed.metadata).toEqual(expect.objectContaining({
      model: testParams.model,
      prompt: testParams.prompt,
      negative_prompt: testParams.negative_prompt,
      seed: testParams.seed
    }));

    expect(mockGenerateImage).toHaveBeenCalledWith(expect.objectContaining({
      prompt: testParams.prompt,
      model: testParams.model,
      negativePrompt: testParams.negative_prompt,
      seed: testParams.seed,
    }));
  });

  test('handles invalid seed value', async () => {
    const testParams = {
      prompt: 'test prompt',
      seed: 'invalid'
    };

    const result = await runtime.handler.call(mockContext, testParams);
    const parsed = JSON.parse(result);

    expect(parsed.success).toBe(false);
    expect(parsed.error).toContain('Seed must be a number between 0 and 4294967295');
  });
});

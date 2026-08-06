import { describe, it, expect } from 'vitest';
import {
  shouldUseImagesGenerationsEndpoint,
  aspectRatioToAgnesRatio,
  aspectRatioToAgnesSize,
  aspectRatioToImageSize,
  extractImageFromApiResponse,
} from '../../services/imageGenerationHelpers';

describe('imageGenerationHelpers - shouldUseImagesGenerationsEndpoint', () => {
  it('should return true for qwen-image models', () => {
    expect(shouldUseImagesGenerationsEndpoint('qwen-image-2.0')).toBe(true);
    expect(shouldUseImagesGenerationsEndpoint('Qwen-Image')).toBe(true);
  });

  it('should return true for dall-e / gpt-image / flux models', () => {
    expect(shouldUseImagesGenerationsEndpoint('dall-e-3')).toBe(true);
    expect(shouldUseImagesGenerationsEndpoint('gpt-image-1')).toBe(true);
    expect(shouldUseImagesGenerationsEndpoint('flux-schnell')).toBe(true);
  });

  it('should return false for chat endpoints', () => {
    expect(shouldUseImagesGenerationsEndpoint('agnes-2.5-flash', 'https://api.example.com/chat/completions')).toBe(false);
    expect(shouldUseImagesGenerationsEndpoint('gemini-pro', 'https://generativelanguage.googleapis.com/generateContent')).toBe(false);
  });

  it('should return true when custom endpoint contains /images/generations', () => {
    expect(shouldUseImagesGenerationsEndpoint('any-model', 'https://api.example.com/v1/images/generations')).toBe(true);
  });

  it('should return false for agnes text model', () => {
    expect(shouldUseImagesGenerationsEndpoint('agnes-2.5-flash')).toBe(false);
  });
});

describe('imageGenerationHelpers - aspectRatioToAgnesRatio', () => {
  it('should map all supported aspect ratios', () => {
    expect(aspectRatioToAgnesRatio('16:9')).toBe('16:9');
    expect(aspectRatioToAgnesRatio('9:16')).toBe('9:16');
    expect(aspectRatioToAgnesRatio('1:1')).toBe('1:1');
  });

  it('should default to 1:1 for unknown ratio', () => {
    expect(aspectRatioToAgnesRatio('4:3' as any)).toBe('1:1');
  });
});

describe('imageGenerationHelpers - aspectRatioToAgnesSize', () => {
  it('should always return 1K for agnes', () => {
    expect(aspectRatioToAgnesSize('16:9')).toBe('1K');
    expect(aspectRatioToAgnesSize('9:16')).toBe('1K');
    expect(aspectRatioToAgnesSize('1:1')).toBe('1K');
  });
});

describe('imageGenerationHelpers - aspectRatioToImageSize', () => {
  it('should map standard aspect ratios to pixel sizes', () => {
    expect(aspectRatioToImageSize('16:9')).toBe('1280x720');
    expect(aspectRatioToImageSize('9:16')).toBe('720x1280');
    expect(aspectRatioToImageSize('1:1')).toBe('1024x1024');
  });

  it('should default to 1024x1024 for unknown ratio', () => {
    expect(aspectRatioToImageSize('4:3' as any)).toBe('1024x1024');
  });
});

describe('imageGenerationHelpers - extractImageFromApiResponse', () => {
  it('should extract URL from data[0].url', () => {
    const response = {
      data: [{ url: 'https://example.com/image.jpg' }],
    };
    expect(extractImageFromApiResponse(response)).toBe('https://example.com/image.jpg');
  });

  it('should extract base64 from data[0].b64_json', () => {
    const b64 = 'a'.repeat(100);
    const response = {
      data: [{ b64_json: b64 }],
    };
    const result = extractImageFromApiResponse(response);
    expect(result).toBeTruthy();
    expect(result!.startsWith('data:image/png;base64,')).toBe(true);
  });

  it('should extract URL from metadata.output.choices with image key', () => {
    const response = {
      metadata: {
        output: {
          choices: [
            { message: { content: [{ type: 'image', image: 'https://example.com/img.png' }] } },
          ],
        },
      },
    };
    expect(extractImageFromApiResponse(response)).toBe('https://example.com/img.png');
  });

  it('should extract base64 from Gemini inline data', () => {
    const response = {
      candidates: [
        { content: { parts: [{ inlineData: { data: 'iVBORw0KGgo' } }] } },
      ],
    };
    const result = extractImageFromApiResponse(response);
    expect(result).toBeTruthy();
    expect(result!.startsWith('data:image/png;base64,')).toBe(true);
  });

  it('should return null for empty response', () => {
    expect(extractImageFromApiResponse(null as any)).toBeNull();
    expect(extractImageFromApiResponse({} as any)).toBeNull();
  });
});

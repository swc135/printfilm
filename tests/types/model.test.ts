import { describe, it, expect } from 'vitest';
import {
  DEFAULT_CHAT_MODEL_ID,
  DEFAULT_IMAGE_MODEL_ID,
  DEFAULT_VIDEO_MODEL_ID,
  migrateDeprecatedVideoModelId,
  BUILTIN_PROVIDERS,
  BUILTIN_CHAT_MODELS,
  BUILTIN_IMAGE_MODELS,
  BUILTIN_VIDEO_MODELS,
  PRIMARY_PROVIDER_BASE_URL,
  DEFAULT_ACTIVE_MODELS,
  ALL_BUILTIN_MODELS,
} from '../../types/model';

describe('types/model - Constants', () => {
  it('should have correct default model IDs', () => {
    expect(DEFAULT_CHAT_MODEL_ID).toBe('agnes-2.5-flash');
    expect(DEFAULT_IMAGE_MODEL_ID).toBe('agnes-image-2.1-flash');
    expect(DEFAULT_VIDEO_MODEL_ID).toBe('agnes-video-v2.0');
  });

  it('should have correct provider base URL', () => {
    expect(PRIMARY_PROVIDER_BASE_URL).toBe('https://api.agnes-ai.cn');
  });

  it('should have correct default active models', () => {
    expect(DEFAULT_ACTIVE_MODELS.chat).toBe(DEFAULT_CHAT_MODEL_ID);
    expect(DEFAULT_ACTIVE_MODELS.image).toBe(DEFAULT_IMAGE_MODEL_ID);
    expect(DEFAULT_ACTIVE_MODELS.video).toBe(DEFAULT_VIDEO_MODEL_ID);
  });
});

describe('types/model - Built-in models', () => {
  it('should have exactly 3 builtin models (chat, image, video)', () => {
    expect(BUILTIN_CHAT_MODELS.length).toBe(1);
    expect(BUILTIN_IMAGE_MODELS.length).toBe(1);
    expect(BUILTIN_VIDEO_MODELS.length).toBe(1);
    expect(ALL_BUILTIN_MODELS.length).toBe(3);
  });

  it('should have exactly 1 builtin provider (agnes)', () => {
    expect(BUILTIN_PROVIDERS.length).toBe(1);
    expect(BUILTIN_PROVIDERS[0].id).toBe('agnes');
    expect(BUILTIN_PROVIDERS[0].baseUrl).toBe(PRIMARY_PROVIDER_BASE_URL);
    expect(BUILTIN_PROVIDERS[0].isDefault).toBe(true);
  });

  it('should have correct builtin model types', () => {
    expect(BUILTIN_CHAT_MODELS[0].type).toBe('chat');
    expect(BUILTIN_IMAGE_MODELS[0].type).toBe('image');
    expect(BUILTIN_VIDEO_MODELS[0].type).toBe('video');
  });
});

describe('types/model - Migration functions', () => {
  it('should return default for empty chat model input', () => {
    expect(migrateDeprecatedVideoModelId('')).toBe(DEFAULT_VIDEO_MODEL_ID);
    expect(migrateDeprecatedVideoModelId(undefined)).toBe(DEFAULT_VIDEO_MODEL_ID);
  });

  it('should preserve non-deprecated chat models', () => {
    expect(migrateDeprecatedVideoModelId('custom-model')).toBe('custom-model');
    expect(migrateDeprecatedVideoModelId('agnes-video-v2.0')).toBe('agnes-video-v2.0');
  });
});

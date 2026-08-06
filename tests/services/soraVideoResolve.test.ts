import { describe, it, expect } from 'vitest';
import {
  isSoraVideoAssetId,
  isTaskPlaceholderVideoId,
  resolveSoraVideoDownloadId,
  extractAnyVideoDownloadUrl,
  downloadAgnesVideo,
  encodeVideoPathId,
} from '../../services/soraVideoResolve';

describe('soraVideoResolve - isSoraVideoAssetId', () => {
  it('should return true for valid video_ IDs', () => {
    expect(isSoraVideoAssetId('video_abc123')).toBe(true);
    expect(isSoraVideoAssetId('video_xyz')).toBe(true);
  });

  it('should return false for null/undefined/empty', () => {
    expect(isSoraVideoAssetId(null)).toBe(false);
    expect(isSoraVideoAssetId(undefined)).toBe(false);
    expect(isSoraVideoAssetId('')).toBe(false);
  });

  it('should return false for task_ and video_task_ prefixes', () => {
    expect(isSoraVideoAssetId('task_abc123')).toBe(false);
    expect(isSoraVideoAssetId('video_task_abc123')).toBe(false);
  });
});

describe('soraVideoResolve - isTaskPlaceholderVideoId', () => {
  it('should detect task_ and video_task_ placeholders', () => {
    expect(isTaskPlaceholderVideoId('task_abc')).toBe(true);
    expect(isTaskPlaceholderVideoId('video_task_xyz')).toBe(true);
  });

  it('should return false for normal video IDs', () => {
    expect(isTaskPlaceholderVideoId('video_abc')).toBe(false);
  });
});

describe('soraVideoResolve - resolveSoraVideoDownloadId', () => {
  it('should extract video_id from result object', () => {
    const statusData = {
      result: { video_id: 'video_abc123' },
    };
    expect(resolveSoraVideoDownloadId(statusData)).toBe('video_abc123');
  });

  it('should ignore task_ and video_task_ placeholders', () => {
    const statusData = {
      result: { video_id: 'task_abc' },
      outputs: ['video_xyz'],
    };
    const result = resolveSoraVideoDownloadId(statusData);
    expect(result).toBe('video_xyz');
  });

  it('should return null when no valid video ID found', () => {
    const statusData = {
      result: { id: 'task_abc' },
    };
    expect(resolveSoraVideoDownloadId(statusData)).toBeNull();
  });
});

describe('soraVideoResolve - extractAnyVideoDownloadUrl', () => {
  it('should extract https URL from nested object', () => {
    const data = {
      result: {
        url: 'https://example.com/video.mp4',
      },
    };
    expect(extractAnyVideoDownloadUrl(data)).toBe('https://example.com/video.mp4');
  });

  it('should ignore http-only URLs', () => {
    const data = {
      result: {
        url: 'http://example.com/image.jpg',
      },
    };
    expect(extractAnyVideoDownloadUrl(data)).toBeNull();
  });

  it('should return null for non-object input', () => {
    expect(extractAnyVideoDownloadUrl('not-an-object')).toBeNull();
    expect(extractAnyVideoDownloadUrl(null)).toBeNull();
  });
});

describe('soraVideoResolve - encodeVideoPathId', () => {
  it('should preserve colon characters (encode then decode)', () => {
    expect(encodeVideoPathId('video:abc')).toBe('video:abc');
  });

  it('should encode other special characters', () => {
    expect(encodeVideoPathId('video abc')).toBe('video%20abc');
  });
});

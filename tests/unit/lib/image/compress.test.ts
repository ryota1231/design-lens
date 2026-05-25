import { describe, expect, it } from 'vitest';
import { blobToDataUrl, calculateResizeDimensions } from '@/lib/image/compress';

describe('calculateResizeDimensions', () => {
  it('should preserve aspect ratio (landscape)', () => {
    const result = calculateResizeDimensions({ width: 2000, height: 1000, maxLongSide: 1024 });
    expect(result).toEqual({ width: 1024, height: 512 });
  });

  it('should preserve aspect ratio (portrait)', () => {
    const result = calculateResizeDimensions({ width: 1000, height: 2000, maxLongSide: 1024 });
    expect(result).toEqual({ width: 512, height: 1024 });
  });

  it('should not upscale smaller images', () => {
    const result = calculateResizeDimensions({ width: 500, height: 300, maxLongSide: 1024 });
    expect(result).toEqual({ width: 500, height: 300 });
  });
});

describe('blobToDataUrl', () => {
  it('should convert a small Blob to a data URL', async () => {
    const blob = new Blob(['hello'], { type: 'text/plain' });
    const dataUrl = await blobToDataUrl(blob);
    expect(dataUrl.startsWith('data:text/plain')).toBe(true);
  });
});

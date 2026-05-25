import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCamera } from '@/components/camera/useCamera';

describe('useCamera', () => {
  let mockGetUserMedia: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockGetUserMedia = vi.fn();
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: { getUserMedia: mockGetUserMedia },
      writable: true,
      configurable: true,
    });
  });

  it('should start with status idle', () => {
    const { result } = renderHook(() => useCamera());
    expect(result.current.status).toBe('idle');
  });

  it('should set status to ready when getUserMedia succeeds', async () => {
    const fakeStream = { getTracks: () => [] } as unknown as MediaStream;
    mockGetUserMedia.mockResolvedValue(fakeStream);
    const { result } = renderHook(() => useCamera());

    await act(async () => {
      await result.current.start();
    });

    await waitFor(() => expect(result.current.status).toBe('ready'));
  });

  it('should set status to denied when getUserMedia rejects', async () => {
    mockGetUserMedia.mockRejectedValue(new Error('permission denied'));
    const { result } = renderHook(() => useCamera());

    await act(async () => {
      await result.current.start();
    });

    await waitFor(() => expect(result.current.status).toBe('denied'));
  });
});

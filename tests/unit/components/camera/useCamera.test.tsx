import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCamera } from '@/components/camera/useCamera';

function createFakeStream(stop = vi.fn()): MediaStream {
  return { getTracks: () => [{ stop }] } as unknown as MediaStream;
}

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
    expect(result.current.facingMode).toBe('environment');
  });

  it('should set status to ready when getUserMedia succeeds', async () => {
    mockGetUserMedia.mockResolvedValue(createFakeStream());
    const { result } = renderHook(() => useCamera());

    await act(async () => {
      await result.current.start();
    });

    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(mockGetUserMedia).toHaveBeenCalledWith({
      video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      audio: false,
    });
  });

  it('should set status to denied when getUserMedia rejects', async () => {
    mockGetUserMedia.mockRejectedValue(new Error('permission denied'));
    const { result } = renderHook(() => useCamera());

    await act(async () => {
      await result.current.start();
    });

    await waitFor(() => expect(result.current.status).toBe('denied'));
  });

  it('should switch facing mode and restart an active stream', async () => {
    const stopFirstStream = vi.fn();
    mockGetUserMedia
      .mockResolvedValueOnce(createFakeStream(stopFirstStream))
      .mockResolvedValueOnce(createFakeStream());
    const { result } = renderHook(() => useCamera());

    await act(async () => {
      await result.current.start();
    });

    await waitFor(() => expect(result.current.status).toBe('ready'));

    await act(async () => {
      await result.current.switchFacingMode();
    });

    await waitFor(() => expect(result.current.facingMode).toBe('user'));
    expect(stopFirstStream).toHaveBeenCalledTimes(1);
    expect(mockGetUserMedia).toHaveBeenLastCalledWith({
      video: { facingMode: 'user', width: { ideal: 1920 }, height: { ideal: 1080 } },
      audio: false,
    });
  });
});

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type CameraStatus = 'idle' | 'starting' | 'ready' | 'denied' | 'error';
export type CameraFacingMode = 'user' | 'environment';

export interface UseCameraResult {
  status: CameraStatus;
  facingMode: CameraFacingMode;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  start: () => Promise<void>;
  stop: () => void;
  switchFacingMode: () => Promise<void>;
  capture: () => Promise<Blob | null>;
  error: string | null;
}

export function useCamera(opts: { facingMode?: CameraFacingMode } = {}): UseCameraResult {
  const initialFacingMode = opts.facingMode ?? 'environment';
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const facingModeRef = useRef<CameraFacingMode>(initialFacingMode);
  const [facingMode, setFacingMode] = useState<CameraFacingMode>(initialFacingMode);
  const [status, setStatus] = useState<CameraStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startStream = useCallback(async (mode: CameraFacingMode) => {
    stopStream();
    setStatus('starting');
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      setStatus('ready');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'unknown';
      if (/permission|denied|NotAllowed/i.test(msg)) {
        setStatus('denied');
      } else {
        setStatus('error');
      }
      setError(msg);
    }
  }, [stopStream]);

  const start = useCallback(async () => {
    await startStream(facingModeRef.current);
  }, [startStream]);

  const stop = useCallback(() => {
    stopStream();
    setStatus('idle');
  }, [stopStream]);

  const switchFacingMode = useCallback(async () => {
    const nextMode = facingModeRef.current === 'environment' ? 'user' : 'environment';
    const shouldRestart = status === 'ready' || status === 'error';

    facingModeRef.current = nextMode;
    setFacingMode(nextMode);

    if (shouldRestart) {
      await startStream(nextMode);
    }
  }, [startStream, status]);

  const capture = useCallback(async (): Promise<Blob | null> => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return null;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0);

    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9);
    });
  }, []);

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  return { status, facingMode, videoRef, start, stop, switchFacingMode, capture, error };
}

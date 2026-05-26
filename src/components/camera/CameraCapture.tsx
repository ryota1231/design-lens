'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { useCamera } from './useCamera';

interface Props {
  onCapture: (blob: Blob) => void;
  onCancel: () => void;
}

export function CameraCapture({ onCapture, onCancel }: Props) {
  const t = useTranslations('camera');
  const { status, videoRef, start, stop, capture, error } = useCamera({
    facingMode: 'environment',
  });

  useEffect(() => {
    void start();
    return () => stop();
  }, [start, stop]);

  const handleShutter = async () => {
    const blob = await capture();
    if (blob) {
      stop();
      onCapture(blob);
    }
  };

  if (status === 'denied') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
        <p className="text-center text-red-600">{t('permissionDenied')}</p>
        <Button variant="secondary" onClick={onCancel}>
          {t('cancel')}
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-black">
      <video ref={videoRef} className="w-full flex-1 object-cover" playsInline muted autoPlay />
      {status === 'starting' && (
        <div className="absolute inset-0 flex items-center justify-center text-white">
          {t('starting')}
        </div>
      )}
      {error && status === 'error' && (
        <div className="absolute top-4 right-4 left-4 rounded bg-red-600 p-3 text-white">
          {error}
        </div>
      )}
      <div className="flex items-center justify-around bg-black/60 p-6">
        <Button variant="ghost" className="text-white hover:bg-white/10" onClick={onCancel}>
          {t('cancel')}
        </Button>
        <button
          aria-label={t('shutter')}
          onClick={handleShutter}
          disabled={status !== 'ready'}
          className="h-16 w-16 rounded-full border-4 border-white bg-white disabled:opacity-50"
        />
        <div className="w-16" />
      </div>
    </div>
  );
}

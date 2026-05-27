'use client';

import { ArrowLeft, Camera, CircleAlert, RefreshCw } from 'lucide-react';
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
  const { status, videoRef, start, stop, switchFacingMode, capture, error } = useCamera({
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
      <div className="flex min-h-[calc(100vh-65px)] flex-col items-center justify-center gap-4 p-6">
        <div className="flex max-w-md flex-col items-center gap-4 rounded-lg border border-red-200 bg-white p-6 text-center shadow-sm">
          <CircleAlert aria-hidden className="h-8 w-8 text-red-600" />
          <p className="text-red-700">{t('permissionDenied')}</p>
          <Button variant="secondary" className="gap-2 bg-white shadow-sm" onClick={onCancel}>
            <ArrowLeft aria-hidden className="h-4 w-4" />
            {t('cancel')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-x-0 top-0 z-50 h-[100dvh] overflow-hidden bg-black">
      <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" playsInline muted autoPlay />
      {status === 'starting' && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30 text-white">
          <div className="rounded-md bg-black/50 px-4 py-3 text-sm font-medium backdrop-blur">
            {t('starting')}
          </div>
        </div>
      )}
      {error && status === 'error' && (
        <div className="absolute top-4 right-4 left-4 z-30 rounded-md bg-red-600 p-3 text-white shadow-lg">
          {error}
        </div>
      )}
      <div className="pointer-events-none absolute inset-x-4 top-4 bottom-[7rem] z-10 rounded-lg border border-white/30 sm:bottom-[8rem]" />
      <div className="absolute inset-x-0 bottom-0 z-20 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 bg-black/80 px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-6 sm:pt-6 sm:pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <Button
          variant="ghost"
          className="justify-self-start gap-2 text-white hover:bg-white/10"
          onClick={onCancel}
        >
          <ArrowLeft aria-hidden className="h-4 w-4" />
          {t('cancel')}
        </Button>
        <button
          aria-label={t('shutter')}
          onClick={handleShutter}
          disabled={status !== 'ready'}
          className="grid h-16 w-16 place-items-center justify-self-center rounded-full border-4 border-white bg-white text-stone-950 shadow-xl transition-transform active:scale-95 disabled:opacity-50 sm:h-[4.5rem] sm:w-[4.5rem]"
        >
          <Camera aria-hidden className="h-7 w-7" />
        </button>
        <Button
          variant="ghost"
          size="icon"
          className="justify-self-end text-white hover:bg-white/10"
          onClick={() => void switchFacingMode()}
          disabled={status === 'starting'}
          aria-label={t('switchCamera')}
          title={t('switchCamera')}
        >
          <RefreshCw aria-hidden className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

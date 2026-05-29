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
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6">
        <div className="flex max-w-md flex-col items-center gap-4 rounded-xl border border-red-200 bg-white p-6 text-center shadow-sm">
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
    <div className="camera-capture-root fixed inset-0 z-50 grid h-[100svh] grid-rows-[minmax(0,1fr)_auto] overflow-hidden bg-black text-white">
      <div className="relative min-h-0 overflow-hidden bg-black [touch-action:none]">
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          playsInline
          muted
          autoPlay
        />
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
        <div className="pointer-events-none absolute inset-x-4 top-4 bottom-4 z-10 rounded-[1.25rem] border border-white/30" />
      </div>

      <div className="camera-control-bar relative z-20 grid min-h-[6.75rem] shrink-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 bg-black/88 px-4 pt-3 pb-[calc(0.9rem+env(safe-area-inset-bottom))] backdrop-blur sm:min-h-[7.5rem] sm:px-6 sm:pt-4 sm:pb-[calc(1.1rem+env(safe-area-inset-bottom))]">
        <Button
          variant="ghost"
          className="h-11 max-w-full justify-self-start rounded-full bg-white/10 px-3 text-white hover:bg-white/15"
          onClick={onCancel}
          aria-label={t('cancel')}
        >
          <ArrowLeft aria-hidden className="h-5 w-5" />
          <span className="camera-control-label ml-2 hidden min-[390px]:inline">{t('cancel')}</span>
        </Button>
        <button
          aria-label={t('shutter')}
          onClick={handleShutter}
          disabled={status !== 'ready'}
          className="camera-shutter grid h-16 w-16 place-items-center justify-self-center rounded-full border-4 border-white bg-white text-stone-950 shadow-xl transition-transform active:scale-95 disabled:opacity-50 sm:h-[4.5rem] sm:w-[4.5rem]"
        >
          <Camera aria-hidden className="h-7 w-7" />
        </button>
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11 justify-self-end rounded-full bg-white/10 text-white hover:bg-white/15"
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

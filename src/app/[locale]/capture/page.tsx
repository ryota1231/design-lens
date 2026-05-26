'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { CameraCapture } from '@/components/camera/CameraCapture';
import { Button } from '@/components/ui/button';
import { savePhotoWithAnalysis } from '@/lib/db/repository';
import { blobToDataUrl, compressImage } from '@/lib/image/compress';
import { useRouter } from '@/lib/i18n/routing';
import { AnalysisResultSchema, type AnalysisResult } from '@/types/analysis';

export default function CapturePage() {
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale() as 'ja' | 'en';
  const [phase, setPhase] = useState<'capturing' | 'analyzing' | 'error'>('capturing');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleCapture(blob: Blob) {
    setPhase('analyzing');
    setErrorMsg(null);

    try {
      const compressed = await compressImage({ source: blob, maxLongSide: 1024, quality: 0.85 });
      const thumb = await compressImage({ source: blob, maxLongSide: 256, quality: 0.8 });
      const dataUrl = await blobToDataUrl(compressed);

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl, language: locale }),
      });

      if (res.status === 429) {
        setErrorMsg(t('errors.rateLimited'));
        setPhase('error');
        return;
      }

      if (!res.ok) {
        setErrorMsg(t('errors.analysisFailed'));
        setPhase('error');
        return;
      }

      const json = (await res.json()) as AnalysisResult;
      const parsed = AnalysisResultSchema.safeParse(json);
      if (!parsed.success) {
        setErrorMsg(t('errors.analysisFailed'));
        setPhase('error');
        return;
      }

      const { analysisId } = await savePhotoWithAnalysis({
        blob: compressed,
        thumbnailBlob: thumb,
        analysis: parsed.data,
        language: locale,
      });

      router.push(`/analyze/${analysisId}`);
    } catch (e) {
      console.error(e);
      setErrorMsg(t('errors.analysisFailed'));
      setPhase('error');
    }
  }

  if (phase === 'analyzing') {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-lg">{t('analyze.analyzing')}</p>
      </main>
    );
  }

  if (phase === 'error') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
        <p className="text-center text-red-600">{errorMsg}</p>
        <Button onClick={() => setPhase('capturing')}>{t('common.retry')}</Button>
      </main>
    );
  }

  return <CameraCapture onCapture={handleCapture} onCancel={() => router.push('/')} />;
}

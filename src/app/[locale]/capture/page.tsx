'use client';

import { AlertTriangle, Loader2 } from 'lucide-react';
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
      <main className="flex min-h-[calc(100vh-65px)] items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4 rounded-lg border border-stone-200 bg-white px-8 py-10 text-center shadow-sm">
          <Loader2 aria-hidden className="h-8 w-8 animate-spin text-emerald-800" />
          <p className="text-lg font-semibold text-stone-950">{t('analyze.analyzing')}</p>
        </div>
      </main>
    );
  }

  if (phase === 'error') {
    return (
      <main className="flex min-h-[calc(100vh-65px)] flex-col items-center justify-center gap-4 p-6">
        <div className="flex max-w-md flex-col items-center gap-4 rounded-lg border border-red-200 bg-white p-6 text-center shadow-sm">
          <AlertTriangle aria-hidden className="h-8 w-8 text-red-600" />
          <p className="text-red-700">{errorMsg}</p>
          <Button
            className="bg-emerald-950 hover:bg-emerald-900"
            onClick={() => setPhase('capturing')}
          >
            {t('common.retry')}
          </Button>
        </div>
      </main>
    );
  }

  return <CameraCapture onCapture={handleCapture} onCancel={() => router.push('/')} />;
}

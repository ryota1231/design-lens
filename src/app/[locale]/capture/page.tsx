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

type AnalyzeErrorResponse = {
  error?: string;
};

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
      const compressed = await compressImage({ source: blob, maxLongSide: 896, quality: 0.82 });
      const thumb = await compressImage({ source: blob, maxLongSide: 256, quality: 0.8 });
      const dataUrl = await blobToDataUrl(compressed);

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl, language: locale }),
      });

      if (res.status === 429) {
        const error = await readAnalyzeError(res);
        setErrorMsg(getAnalyzeErrorMessage(error, t));
        setPhase('error');
        return;
      }

      if (!res.ok) {
        const error = await readAnalyzeError(res);
        setErrorMsg(getAnalyzeErrorMessage(error, t));
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

      let analysisId: string;
      try {
        const saved = await savePhotoWithAnalysis({
          blob: compressed,
          thumbnailBlob: thumb,
          analysis: parsed.data,
          language: locale,
        });
        analysisId = saved.analysisId;
      } catch (e) {
        console.error('[capture] save failed', e);
        setErrorMsg(t('errors.saveFailed'));
        setPhase('error');
        return;
      }

      router.push(`/analyze/${analysisId}`);
    } catch (e) {
      console.error(e);
      setErrorMsg(t('errors.analysisFailed'));
      setPhase('error');
    }
  }

  if (phase === 'analyzing') {
    return (
      <main className="flex min-h-dvh items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4 rounded-xl border border-stone-200 bg-white px-8 py-10 text-center shadow-sm">
          <Loader2 aria-hidden className="h-8 w-8 animate-spin text-emerald-800" />
          <p className="text-lg font-semibold text-stone-950">{t('analyze.analyzing')}</p>
        </div>
      </main>
    );
  }

  if (phase === 'error') {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6">
        <div className="flex max-w-md flex-col items-center gap-4 rounded-xl border border-red-200 bg-white p-6 text-center shadow-sm">
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

async function readAnalyzeError(res: Response): Promise<string | undefined> {
  try {
    const json = (await res.json()) as AnalyzeErrorResponse;
    return json.error;
  } catch {
    return undefined;
  }
}

function getAnalyzeErrorMessage(
  error: string | undefined,
  t: ReturnType<typeof useTranslations>,
): string {
  switch (error) {
    case 'rate_limited':
    case 'anthropic_rate_limited':
      return t('errors.rateLimited');
    case 'anthropic_auth_failed':
      return t('errors.anthropicAuthFailed');
    case 'anthropic_billing':
      return t('errors.anthropicBilling');
    case 'anthropic_unavailable':
      return t('errors.anthropicUnavailable');
    case 'image_too_large':
      return t('errors.imageTooLarge');
    default:
      return t('errors.analysisFailed');
  }
}

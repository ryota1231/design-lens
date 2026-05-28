'use client';

import Image from 'next/image';
import { ArrowLeft, CircleAlert, Copy, Loader2, WandSparkles } from 'lucide-react';
import { use, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AnalysisCard } from '@/components/analysis/AnalysisCard';
import { Button } from '@/components/ui/button';
import { getAnalysisWithPhoto, getPromptByAnalysisId, savePrompt } from '@/lib/db/repository';
import type { AnalysisRecord, PhotoRecord } from '@/lib/db/schema';
import { Link } from '@/lib/i18n/routing';
import { AnalysisResultSchema } from '@/types/analysis';

const TEMP_ANALYSIS_KEY_PREFIX = 'design-lens:temp-analysis:';

export default function AnalyzeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations();
  const [analysis, setAnalysis] = useState<AnalysisRecord | null>(null);
  const [photo, setPhoto] = useState<PhotoRecord | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [promptLoading, setPromptLoading] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loadStatus, setLoadStatus] = useState<'loading' | 'ready' | 'missing'>('loading');

  useEffect(() => {
    let urlForCleanup: string | null = null;

    void (async () => {
      try {
        const result = await getAnalysisWithPhoto(id);
        if (!result) {
          const temporary = getTemporaryAnalysisWithPhoto(id);
          if (!temporary) {
            setLoadStatus('missing');
            return;
          }

          setAnalysis(temporary.analysis);
          setPhoto(temporary.photo);
          setPhotoUrl(temporary.photo.imageDataUrl ?? null);
          setLoadStatus('ready');
          return;
        }

        setAnalysis(result.analysis);
        setPhoto(result.photo ?? null);

        if (result.photo) {
          const src = getPhotoImageSrc(result.photo);
          if (src.kind === 'object-url') urlForCleanup = src.value;
          setPhotoUrl(src.value);
        }

        const existing = await getPromptByAnalysisId(id);
        if (existing) setPrompt(existing.prompt);
        setLoadStatus('ready');
      } catch (e) {
        console.error(e);
        setLoadStatus('missing');
      }
    })();

    return () => {
      if (urlForCleanup) URL.revokeObjectURL(urlForCleanup);
    };
  }, [id]);

  async function handleGeneratePrompt() {
    if (!analysis) return;
    setPromptLoading(true);
    setPromptError(null);

    try {
      const res = await fetch('/api/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis: {
            concept: analysis.concept,
            typography: analysis.typography,
            fontHints: analysis.fontHints,
            colors: analysis.colors,
            composition: analysis.composition,
            target: analysis.target,
            extractedText: analysis.extractedText,
            category: analysis.category,
          },
          language: 'ja',
        }),
      });

      if (!res.ok) {
        throw new Error('prompt failed');
      }

      const json = (await res.json()) as { prompt: string };
      setPrompt(json.prompt);
      await savePrompt({ analysisId: id, prompt: json.prompt });
    } catch (e) {
      console.error(e);
      setPromptError(t('errors.promptFailed'));
    } finally {
      setPromptLoading(false);
    }
  }

  async function handleCopyPrompt() {
    if (!prompt) return;
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loadStatus === 'missing') {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#f2f0eb] px-4">
        <div className="flex max-w-md flex-col items-center gap-4 rounded-xl border border-stone-200 bg-white p-6 text-center shadow-sm">
          <CircleAlert aria-hidden className="h-8 w-8 text-amber-700" />
          <p className="text-sm leading-6 text-stone-700">{t('errors.loadFailed')}</p>
          <Button variant="secondary" className="gap-2 bg-white shadow-sm" asChild>
            <Link href="/">
              <ArrowLeft aria-hidden className="h-4 w-4" />
              {t('common.back')}
            </Link>
          </Button>
        </div>
      </main>
    );
  }

  if (!analysis || loadStatus === 'loading') {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#f2f0eb]">
        <div className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-5 py-4 shadow-sm">
          <Loader2 aria-hidden className="h-5 w-5 animate-spin text-emerald-800" />
          <p className="text-sm text-stone-700">{t('common.loading')}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-[#f2f0eb] px-4 py-4 pb-[calc(2rem+env(safe-area-inset-bottom))] sm:py-6">
      <div className="mx-auto w-full max-w-md lg:max-w-5xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Button variant="secondary" size="icon" asChild>
            <Link href="/" aria-label={t('common.back')}>
              <ArrowLeft aria-hidden className="h-5 w-5" />
            </Link>
          </Button>
          <div className="min-w-0 flex-1 text-center">
            <p className="truncate text-xs font-semibold text-stone-500">{t('analyze.aiLabel')}</p>
            <h1 className="truncate text-lg font-bold text-stone-950">
              {t('analyze.resultTitle')}
            </h1>
          </div>
          <span className="rounded-full bg-[#d4e9e2] px-3 py-2 text-xs font-semibold text-[#006241]">
            {t(`analyze.categories.${analysis.category}`)}
          </span>
        </div>

        <div className="grid gap-4 lg:grid-cols-[0.88fr_1.12fr] lg:items-start">
          <aside className="lg:sticky lg:top-6">
            {photoUrl && photo && (
              <div className="overflow-hidden rounded-[1.5rem] border border-white bg-white p-2 shadow-[0_0_1px_rgba(0,0,0,0.14),0_8px_20px_rgba(0,0,0,0.08)]">
                <Image
                  src={photoUrl}
                  alt="captured"
                  width={1024}
                  height={768}
                  className="aspect-[4/3] max-h-[42vh] w-full rounded-[1.1rem] object-cover lg:max-h-[70vh] lg:object-contain"
                  unoptimized
                />
              </div>
            )}
          </aside>

          <section className="space-y-4">
            <AnalysisCard analysis={analysis} />

            <div className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-[0_0_1px_rgba(0,0,0,0.14),0_4px_12px_rgba(0,0,0,0.08)]">
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d4e9e2] text-[#006241]">
                  <WandSparkles aria-hidden className="h-4 w-4" />
                </span>
                <h2 className="font-semibold text-stone-950">{t('analyze.promptHeading')}</h2>
              </div>
              {!prompt && (
                <div className="space-y-3">
                  <Button
                    onClick={handleGeneratePrompt}
                    disabled={promptLoading}
                    size="lg"
                    className="w-full gap-2"
                  >
                    {promptLoading && <Loader2 aria-hidden className="h-4 w-4 animate-spin" />}
                    {promptLoading ? t('analyze.generatingPrompt') : t('analyze.generatePrompt')}
                  </Button>
                  {promptError && (
                    <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {promptError}
                    </p>
                  )}
                </div>
              )}
              {prompt && (
                <div>
                  <p className="mb-4 max-h-[45vh] overflow-auto rounded-xl bg-[#f2f0eb] p-4 text-sm leading-6 whitespace-pre-wrap text-stone-700">
                    {prompt}
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="gap-2 bg-white shadow-sm"
                      onClick={handleCopyPrompt}
                    >
                      <Copy aria-hidden className="h-4 w-4" />
                      {copied ? t('analyze.promptCopied') : t('analyze.copyPrompt')}
                    </Button>
                    <Button
                      size="sm"
                      className="gap-2"
                      onClick={handleGeneratePrompt}
                      disabled={promptLoading}
                    >
                      {promptLoading && <Loader2 aria-hidden className="h-4 w-4 animate-spin" />}
                      {promptLoading
                        ? t('analyze.generatingPrompt')
                        : t('analyze.regeneratePrompt')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function getPhotoImageSrc(photo: PhotoRecord): { kind: 'object-url' | 'data-url'; value: string } {
  if (photo.blob) {
    return { kind: 'object-url', value: URL.createObjectURL(photo.blob) };
  }

  return { kind: 'data-url', value: photo.imageDataUrl ?? '' };
}

function getTemporaryAnalysisWithPhoto(
  id: string,
): { analysis: AnalysisRecord; photo: PhotoRecord } | null {
  try {
    const raw = sessionStorage.getItem(`${TEMP_ANALYSIS_KEY_PREFIX}${id}`);
    if (!raw) return null;

    const payload = JSON.parse(raw) as {
      imageDataUrl?: unknown;
      thumbnailDataUrl?: unknown;
      analysis?: unknown;
      language?: unknown;
      createdAt?: unknown;
    };
    const analysis = AnalysisResultSchema.safeParse(payload.analysis);
    if (
      !analysis.success ||
      typeof payload.imageDataUrl !== 'string' ||
      typeof payload.thumbnailDataUrl !== 'string' ||
      (payload.language !== 'ja' && payload.language !== 'en')
    ) {
      return null;
    }

    const createdAt = typeof payload.createdAt === 'number' ? payload.createdAt : Date.now();
    const photoId = `photo-${id}`;
    return {
      analysis: {
        id,
        photoId,
        ...analysis.data,
        language: payload.language,
        createdAt,
      },
      photo: {
        id: photoId,
        imageDataUrl: payload.imageDataUrl,
        thumbnailDataUrl: payload.thumbnailDataUrl,
        createdAt,
      },
    };
  } catch (e) {
    console.error('[analyze] temporary load failed', e);
    return null;
  }
}

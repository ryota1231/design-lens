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
            styleGenre: analysis.styleGenre ?? '',
            typography: analysis.typography,
            textStyles: analysis.textStyles ?? [],
            fontHints: analysis.fontHints,
            colors: analysis.colors,
            composition: analysis.composition,
            target: analysis.target,
            extractedText: analysis.extractedText,
            category: analysis.category,
            visualFlow: analysis.visualFlow,
            principles: analysis.principles,
            improvements: analysis.improvements,
            applications: analysis.applications,
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
    <main className="min-h-dvh overflow-x-hidden bg-[#f7f7f4] px-3 py-3 pb-[calc(8rem+env(safe-area-inset-bottom))] sm:px-4 sm:py-6 lg:pb-10">
      <div className="mx-auto w-full max-w-[31rem] min-w-0 lg:max-w-5xl">
        <div className="sticky top-0 z-20 -mx-3 mb-3 grid grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-3 bg-[#f7f7f4]/95 px-3 py-3 backdrop-blur sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:backdrop-blur-none">
          <Button
            variant="secondary"
            size="icon"
            className="h-11 w-11 rounded-full bg-white shadow-[0_4px_12px_rgba(15,23,42,0.10)]"
            asChild
          >
            <Link href="/" aria-label={t('common.back')}>
              <ArrowLeft aria-hidden className="h-5 w-5" />
            </Link>
          </Button>
          <div className="min-w-0 text-left">
            <p className="truncate text-[11px] font-semibold text-stone-500">
              {t('analyze.aiLabel')}
            </p>
            <h1 className="truncate text-xl leading-tight font-bold text-stone-950">
              {t('analyze.resultTitle')}
            </h1>
          </div>
          <span className="max-w-[8.5rem] truncate rounded-full bg-[#dff6f5] px-3 py-2 text-xs font-bold text-[#06727b]">
            {t(`analyze.categories.${analysis.category}`)}
          </span>
        </div>

        <div className="grid min-w-0 gap-4 lg:grid-cols-[0.88fr_1.12fr] lg:items-start">
          <aside className="min-w-0 lg:sticky lg:top-6">
            {photoUrl && photo && (
              <div className="flex w-full max-w-full justify-center overflow-hidden rounded-[1.6rem] border border-white bg-white p-1.5 shadow-[0_0_1px_rgba(0,0,0,0.14),0_10px_24px_rgba(15,23,42,0.10)]">
                <Image
                  src={photoUrl}
                  alt="captured"
                  width={1024}
                  height={768}
                  className="block h-auto max-h-[42vh] w-auto max-w-full rounded-[1.25rem] object-contain lg:max-h-[70vh]"
                  unoptimized
                />
              </div>
            )}
          </aside>

          <section className="min-w-0 space-y-4">
            <AnalysisCard analysis={analysis} />

            <div className="min-w-0 rounded-[1.5rem] border border-white bg-white p-5 shadow-[0_0_1px_rgba(0,0,0,0.14),0_8px_18px_rgba(15,23,42,0.08)]">
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#dff6f5] text-[#06727b]">
                  <WandSparkles aria-hidden className="h-4 w-4" />
                </span>
                <h2 className="min-w-0 text-lg leading-tight font-bold text-stone-950">
                  {t('analyze.promptHeading')}
                </h2>
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
                  <p className="mb-4 max-h-[45vh] overflow-auto rounded-xl bg-[#f2f0eb] p-4 text-[15px] leading-7 whitespace-pre-wrap break-words text-stone-700">
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

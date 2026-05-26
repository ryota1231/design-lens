'use client';

import Image from 'next/image';
import { ArrowLeft, CircleAlert, Copy, Loader2, WandSparkles } from 'lucide-react';
import { use, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { AnalysisCard } from '@/components/analysis/AnalysisCard';
import { Button } from '@/components/ui/button';
import { getAnalysisWithPhoto, getPromptByAnalysisId, savePrompt } from '@/lib/db/repository';
import type { AnalysisRecord, PhotoRecord } from '@/lib/db/schema';
import { Link } from '@/lib/i18n/routing';

export default function AnalyzeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations();
  const locale = useLocale() as 'ja' | 'en';
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
          setLoadStatus('missing');
          return;
        }

        setAnalysis(result.analysis);
        setPhoto(result.photo ?? null);

        if (result.photo) {
          urlForCleanup = URL.createObjectURL(result.photo.blob);
          setPhotoUrl(urlForCleanup);
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
          language: locale,
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
      <main className="flex min-h-[calc(100vh-65px)] items-center justify-center px-4">
        <div className="flex max-w-md flex-col items-center gap-4 rounded-lg border border-stone-200 bg-white p-6 text-center shadow-sm">
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
      <main className="flex min-h-[calc(100vh-65px)] items-center justify-center">
        <div className="flex items-center gap-3 rounded-lg border border-stone-200 bg-white px-5 py-4 shadow-sm">
          <Loader2 aria-hidden className="h-5 w-5 animate-spin text-emerald-800" />
          <p className="text-sm text-stone-700">{t('common.loading')}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-[calc(100vh-65px)] w-full max-w-5xl px-4 py-6 sm:py-8">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-950"
        >
          <ArrowLeft aria-hidden className="h-4 w-4" />
          {t('common.back')}
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
        <aside className="lg:sticky lg:top-24">
          {photoUrl && photo && (
            <div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
              <Image
                src={photoUrl}
                alt="captured"
                width={1024}
                height={768}
                className="max-h-[70vh] w-full object-contain"
                unoptimized
              />
            </div>
          )}
        </aside>

        <section className="space-y-6">
          <AnalysisCard analysis={analysis} />

          <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-50 text-emerald-900">
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
                  className="gap-2 bg-emerald-950 hover:bg-emerald-900"
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
                <p className="mb-4 rounded-md bg-stone-50 p-4 text-sm leading-6 whitespace-pre-wrap text-stone-700">
                  {prompt}
                </p>
                <Button
                  size="sm"
                  variant="secondary"
                  className="gap-2 bg-white shadow-sm"
                  onClick={handleCopyPrompt}
                >
                  <Copy aria-hidden className="h-4 w-4" />
                  {copied ? t('analyze.promptCopied') : t('analyze.copyPrompt')}
                </Button>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

'use client';

import Image from 'next/image';
import { use, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { AnalysisCard } from '@/components/analysis/AnalysisCard';
import { Button } from '@/components/ui/button';
import {
  getAnalysisWithPhoto,
  getPromptByAnalysisId,
  savePrompt,
} from '@/lib/db/repository';
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
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let urlForCleanup: string | null = null;

    void (async () => {
      const result = await getAnalysisWithPhoto(id);
      if (!result) return;

      setAnalysis(result.analysis);
      setPhoto(result.photo ?? null);

      if (result.photo) {
        urlForCleanup = URL.createObjectURL(result.photo.blob);
        setPhotoUrl(urlForCleanup);
      }

      const existing = await getPromptByAnalysisId(id);
      if (existing) setPrompt(existing.prompt);
    })();

    return () => {
      if (urlForCleanup) URL.revokeObjectURL(urlForCleanup);
    };
  }, [id]);

  async function handleGeneratePrompt() {
    if (!analysis) return;
    setPromptLoading(true);

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

  if (!analysis) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p>{t('common.loading')}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl p-4">
      <div className="mb-4">
        <Link href="/" className="text-sm text-gray-600">
          ← {t('common.back')}
        </Link>
      </div>

      {photoUrl && photo && (
        <Image
          src={photoUrl}
          alt="captured"
          width={1024}
          height={768}
          className="mb-6 w-full rounded-lg object-contain"
          unoptimized
        />
      )}

      <AnalysisCard analysis={analysis} />

      <div className="mt-8">
        {!prompt && (
          <Button onClick={handleGeneratePrompt} disabled={promptLoading} size="lg">
            {promptLoading ? t('analyze.generatingPrompt') : t('analyze.generatePrompt')}
          </Button>
        )}
        {prompt && (
          <div className="rounded-lg border bg-gray-50 p-4">
            <h3 className="mb-2 font-semibold">{t('analyze.promptHeading')}</h3>
            <p className="mb-3 whitespace-pre-wrap text-sm">{prompt}</p>
            <Button size="sm" variant="secondary" onClick={handleCopyPrompt}>
              {copied ? t('analyze.promptCopied') : t('analyze.copyPrompt')}
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}

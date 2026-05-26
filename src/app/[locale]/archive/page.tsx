'use client';

import { ArrowLeft, Camera } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PhotoGrid } from '@/components/archive/PhotoGrid';
import { Button } from '@/components/ui/button';
import { Link } from '@/lib/i18n/routing';

export default function ArchivePage() {
  const t = useTranslations();

  return (
    <main className="mx-auto min-h-[calc(100vh-65px)] w-full max-w-5xl px-4 py-6 sm:py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-950"
          >
            <ArrowLeft aria-hidden className="h-4 w-4" />
            {t('common.back')}
          </Link>
          <h1 className="text-3xl font-bold text-stone-950">{t('archive.title')}</h1>
        </div>
        <Button className="gap-2 bg-emerald-950 hover:bg-emerald-900" asChild>
          <Link href="/capture">
            <Camera aria-hidden className="h-4 w-4" />
            {t('home.capture')}
          </Link>
        </Button>
      </div>
      <PhotoGrid />
    </main>
  );
}

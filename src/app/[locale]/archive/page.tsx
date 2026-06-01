'use client';

import { ArrowLeft, Camera } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PhotoGrid } from '@/components/archive/PhotoGrid';
import { Button } from '@/components/ui/button';
import { Link } from '@/lib/i18n/routing';

export default function ArchivePage() {
  const t = useTranslations();

  return (
    <main className="min-h-dvh bg-[#f4fbf8] px-4 py-5 pb-[calc(2rem+env(safe-area-inset-bottom))] text-stone-950 sm:py-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-7 flex items-center justify-between gap-4 sm:mb-9">
          <Link
            href="/"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-stone-800 shadow-[0_10px_26px_rgba(15,23,42,0.08)] transition hover:-translate-x-0.5 hover:text-stone-950"
            aria-label={t('common.back')}
          >
            <ArrowLeft aria-hidden className="h-5 w-5" />
          </Link>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black tracking-[0.15em] text-stone-500 uppercase">
              {t('archive.kicker')}
            </p>
            <h1 className="mt-1 truncate text-[1.75rem] leading-none font-black text-stone-950 sm:text-4xl">
              {t('archive.title')}
            </h1>
          </div>

          <Button
            className="h-11 shrink-0 gap-2 rounded-full bg-[#00c875] px-4 font-black text-white shadow-[0_12px_28px_rgba(0,200,117,0.22)] hover:bg-[#00b86b]"
            asChild
          >
            <Link href="/capture">
              <Camera aria-hidden className="h-4 w-4" />
              <span className="hidden sm:inline">{t('home.capture')}</span>
            </Link>
          </Button>
        </div>

        <PhotoGrid />
      </div>
    </main>
  );
}

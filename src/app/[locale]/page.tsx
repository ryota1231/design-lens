import { ArrowRight, Camera, Library, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Link } from '@/lib/i18n/routing';

export default function Home() {
  const t = useTranslations('home');

  return (
    <main className="min-h-[calc(100vh-65px)] px-4 py-8 sm:py-12">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
        <section className="flex flex-col gap-6">
          <div className="inline-flex w-fit items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            <Sparkles aria-hidden className="h-4 w-4" />
            {t('vision')}
          </div>
          <div className="space-y-4">
            <h1 className="max-w-2xl text-3xl leading-tight font-bold text-stone-950 sm:text-5xl">
              {t('title')}
            </h1>
            <p className="max-w-xl text-base leading-7 text-stone-600 sm:text-lg">
              {t('subtitle')}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" className="gap-2 bg-emerald-950 hover:bg-emerald-900" asChild>
              <Link href="/capture">
                <Camera aria-hidden className="h-5 w-5" />
                {t('capture')}
              </Link>
            </Button>
            <Button size="lg" variant="secondary" className="gap-2 bg-white shadow-sm" asChild>
              <Link href="/archive">
                <Library aria-hidden className="h-5 w-5" />
                {t('viewArchive')}
              </Link>
            </Button>
          </div>
        </section>

        <section
          aria-label="Design Lens preview"
          className="relative min-h-80 overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm"
        >
          <div className="absolute inset-x-0 top-0 flex items-center justify-between border-b border-stone-200 bg-stone-50 px-4 py-3">
            <span className="text-xs font-medium text-stone-500">Design Lens</span>
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
          </div>
          <div className="grid min-h-80 place-items-center px-6 pt-12">
            <div className="relative h-56 w-full max-w-sm overflow-hidden rounded-md bg-stone-950">
              <div className="absolute inset-4 rounded-md border border-white/30" />
              <div className="absolute inset-x-10 top-10 h-16 rounded bg-amber-300" />
              <div className="absolute inset-x-14 top-16 h-4 rounded bg-stone-950/80" />
              <div className="absolute bottom-10 left-10 h-16 w-16 rounded bg-rose-500" />
              <div className="absolute right-10 bottom-10 space-y-2">
                <div className="h-3 w-28 rounded bg-white" />
                <div className="h-3 w-20 rounded bg-white/70" />
                <div className="h-3 w-24 rounded bg-emerald-300" />
              </div>
              <div className="absolute right-4 bottom-4 left-4 flex items-center justify-between rounded-md bg-white/95 px-4 py-3">
                <span className="text-xs font-semibold text-stone-950">{t('capture')}</span>
                <ArrowRight aria-hidden className="h-4 w-4 text-stone-950" />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

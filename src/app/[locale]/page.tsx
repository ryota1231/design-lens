import { ArrowRight, Camera, Library, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Link } from '@/lib/i18n/routing';

export default function Home() {
  const t = useTranslations('home');

  return (
    <main className="min-h-dvh px-4 py-5 pb-[calc(2rem+env(safe-area-inset-bottom))] sm:py-10">
      <div className="mx-auto grid w-full max-w-md gap-5 lg:max-w-5xl lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <section className="flex flex-col gap-5 rounded-[1.5rem] bg-[#1E3932] p-6 text-white shadow-[0_8px_24px_rgba(0,0,0,0.12)] sm:p-8">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-white text-[#006241]">
              <Sparkles aria-hidden className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-white">Design Lens</p>
              <p className="text-xs text-white/70">{t('vision')}</p>
            </div>
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl leading-tight font-bold sm:text-5xl">{t('title')}</h1>
            <p className="text-base leading-7 text-white/80 sm:text-lg">{t('subtitle')}</p>
          </div>
          <div className="flex flex-col gap-3">
            <Button size="lg" className="gap-2 bg-white text-[#00754A] hover:bg-[#edebe9]" asChild>
              <Link href="/capture">
                <Camera aria-hidden className="h-5 w-5" />
                {t('capture')}
              </Link>
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="gap-2 border border-white/70 text-white hover:bg-white/10"
              asChild
            >
              <Link href="/archive">
                <Library aria-hidden className="h-5 w-5" />
                {t('viewArchive')}
              </Link>
            </Button>
          </div>
        </section>

        <section
          aria-label="Design Lens preview"
          className="relative min-h-[26rem] overflow-hidden rounded-[1.5rem] border border-white bg-white shadow-[0_0_1px_rgba(0,0,0,0.14),0_8px_20px_rgba(0,0,0,0.08)]"
        >
          <div className="absolute inset-x-0 top-0 flex items-center justify-between border-b border-stone-100 bg-[#edebe9] px-4 py-3">
            <span className="text-xs font-semibold text-stone-600">Observation preview</span>
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
          </div>
          <div className="grid min-h-[26rem] place-items-center px-5 pt-14">
            <div className="relative h-64 w-full max-w-sm overflow-hidden rounded-[1.25rem] bg-stone-950 shadow-inner">
              <div className="absolute inset-4 rounded-xl border border-white/30" />
              <div className="absolute inset-x-10 top-10 h-16 rounded-xl bg-amber-300" />
              <div className="absolute inset-x-14 top-16 h-4 rounded-full bg-stone-950/80" />
              <div className="absolute bottom-10 left-10 h-16 w-16 rounded-xl bg-rose-500" />
              <div className="absolute right-10 bottom-10 space-y-2">
                <div className="h-3 w-28 rounded bg-white" />
                <div className="h-3 w-20 rounded bg-white/70" />
                <div className="h-3 w-24 rounded bg-emerald-300" />
              </div>
              <div className="absolute right-4 bottom-4 left-4 flex items-center justify-between rounded-full bg-white/95 px-4 py-3">
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

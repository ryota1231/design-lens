import { ArrowRight, Camera, Eye, Library, Palette, ScanLine, Sparkles, Type } from 'lucide-react';
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
          className="relative min-h-[28rem] overflow-hidden rounded-[1.75rem] border border-white bg-white shadow-[0_0_1px_rgba(0,0,0,0.14),0_16px_32px_rgba(0,0,0,0.08)]"
        >
          <div className="absolute inset-x-0 top-0 flex items-center justify-between border-b border-stone-100 bg-[#f7f7f4] px-5 py-4">
            <span className="text-xs font-semibold tracking-normal text-stone-600">
              Observation preview
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#008f9c]">
              <span className="h-2 w-2 rounded-full bg-[#10c8d2]" />
              Live
            </span>
          </div>
          <div className="flex min-h-[28rem] items-center justify-center px-5 pt-16 pb-6">
            <div className="relative w-full max-w-sm overflow-hidden rounded-[2rem] border border-stone-100 bg-[#f7fbfb] p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.7)]">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-stone-400">Today&apos;s lens</p>
                  <p className="text-lg leading-tight font-bold text-stone-950">Intent board</p>
                </div>
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[#10c8d2] text-white shadow-[0_8px_18px_rgba(16,200,210,0.22)]">
                  <Eye aria-hidden className="h-5 w-5" />
                </span>
              </div>

              <div className="rounded-[1.4rem] bg-white p-3 shadow-[0_8px_20px_rgba(15,23,42,0.08)]">
                <div className="relative mb-3 aspect-[16/10] overflow-hidden rounded-[1rem] bg-[#0e1f2b]">
                  <div className="absolute inset-x-5 top-5 h-12 rounded-[1rem] bg-[#aeecef]" />
                  <div className="absolute inset-x-8 top-11 h-2 rounded-full bg-[#0b3d46]" />
                  <div className="absolute bottom-5 left-5 h-16 w-14 rounded-[1rem] bg-[#ff6f45]" />
                  <div className="absolute right-5 bottom-7 space-y-2">
                    <div className="h-2.5 w-24 rounded-full bg-white" />
                    <div className="h-2.5 w-16 rounded-full bg-white/65" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { icon: ScanLine, label: 'Shape' },
                    { icon: Palette, label: 'Color' },
                    { icon: Type, label: 'Type' },
                  ].map(({ icon: Icon, label }) => (
                    <div
                      key={label}
                      className="flex flex-col items-center gap-1 rounded-2xl bg-[#f2f7f7] px-2 py-3 text-[#0d6f78]"
                    >
                      <Icon aria-hidden className="h-4 w-4" />
                      <span className="text-[11px] font-semibold">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                href="/capture"
                className="mt-4 flex items-center justify-between rounded-full bg-[#10c8d2] px-5 py-4 text-sm font-bold text-white shadow-[0_10px_20px_rgba(16,200,210,0.24)] transition-transform active:scale-[0.98]"
              >
                <span className="inline-flex items-center gap-2">
                  <Camera aria-hidden className="h-4 w-4" />
                  {t('capture')}
                </span>
                <ArrowRight aria-hidden className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

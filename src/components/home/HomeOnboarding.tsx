'use client';

import { ArrowRight, Camera, Eye, Library, Palette, ScanText, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { Link } from '@/lib/i18n/routing';

const SLIDE_DURATION_MS = 4600;

export function HomeOnboarding() {
  const t = useTranslations('home');
  const [slideIndex, setSlideIndex] = useState(0);

  const slides = useMemo(
    () => [
      {
        label: t('onboarding.slide1.label'),
        title: t('onboarding.slide1.title'),
        body: t('onboarding.slide1.body'),
        visual: 'city',
      },
      {
        label: t('onboarding.slide2.label'),
        title: t('onboarding.slide2.title'),
        body: t('onboarding.slide2.body'),
        visual: 'archive',
      },
      {
        label: t('onboarding.slide3.label'),
        title: t('onboarding.slide3.title'),
        body: t('onboarding.slide3.body'),
        visual: 'prompt',
      },
    ],
    [t],
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSlideIndex((current) => (current + 1) % slides.length);
    }, SLIDE_DURATION_MS);

    return () => window.clearInterval(timer);
  }, [slides.length]);

  const currentSlide = slides[slideIndex];

  return (
    <main className="min-h-dvh overflow-x-hidden bg-[#f4fbf8] text-stone-950">
      <section
        data-home-splash
        aria-hidden="true"
        className="home-splash-screen fixed inset-0 z-30 grid place-items-center bg-white"
      >
        <div className="animate-[lens-splash-in_900ms_cubic-bezier(0.16,1,0.3,1)_both] px-8 text-center">
          <div className="mx-auto mb-5 grid h-28 w-28 place-items-center rounded-[2.35rem] bg-[#006241] text-white shadow-[0_24px_60px_rgba(0,98,65,0.2)]">
            <div className="animate-[lens-logo-float_2400ms_ease-in-out_infinite]">
              <Eye aria-hidden className="h-16 w-16" strokeWidth={2.4} />
            </div>
          </div>
          <p className="text-[13px] font-bold text-[#00a979]">{t('splashKicker')}</p>
          <h1 className="mt-1 text-[2.75rem] leading-none font-black tracking-normal text-[#006241]">
            Design Lens
          </h1>
          <p className="mx-auto mt-4 max-w-[16rem] text-[15px] leading-7 font-semibold text-stone-500">
            {t('splashCaption')}
          </p>
        </div>
      </section>

      <div className="home-onboarding-shell mx-auto flex min-h-dvh w-full max-w-md flex-col pb-[calc(1.25rem+env(safe-area-inset-bottom))] lg:max-w-6xl lg:grid lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-10 lg:px-10 lg:py-10">
        <section className="relative flex min-h-[55dvh] overflow-hidden rounded-b-[2.4rem] bg-[#0d3028] lg:min-h-[42rem] lg:rounded-[2.4rem]">
          <SlideVisual visual={currentSlide.visual} />
        </section>

        <section className="flex flex-1 flex-col justify-between px-6 pt-7 lg:px-0 lg:pt-0">
          <div className="animate-[lens-slide-up_620ms_cubic-bezier(0.16,1,0.3,1)_both]">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[13px] font-bold text-[#006241] shadow-[0_8px_24px_rgba(0,98,65,0.08)]">
              <Sparkles aria-hidden className="h-4 w-4" />
              {currentSlide.label}
            </div>

            <h2 className="text-[2.35rem] leading-[1.12] font-black tracking-normal text-stone-950 sm:text-5xl">
              {currentSlide.title}
            </h2>
            <p className="mt-4 text-[17px] leading-8 font-semibold text-stone-600">
              {currentSlide.body}
            </p>

            <div className="mt-8 flex items-center justify-center gap-3 lg:justify-start">
              {slides.map((slide, index) => (
                <button
                  key={slide.label}
                  type="button"
                  aria-label={t('onboarding.goToSlide', { number: index + 1 })}
                  aria-pressed={slideIndex === index}
                  className={`h-3 rounded-full transition-all ${
                    slideIndex === index ? 'w-9 bg-[#00c875]' : 'w-3 bg-[#9ce7c8]'
                  }`}
                  onClick={() => setSlideIndex(index)}
                />
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-3 lg:max-w-sm">
            <Link
              href="/capture"
              className="inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-[#00c875] px-6 text-[17px] font-black text-white shadow-[0_14px_30px_rgba(0,200,117,0.24)] transition-transform active:scale-[0.98]"
            >
              <Camera aria-hidden className="h-5 w-5" />
              {t('capture')}
            </Link>
            <Link
              href="/archive"
              className="inline-flex min-h-14 items-center justify-center gap-3 rounded-full border border-[#d8e9e2] bg-white px-6 text-[17px] font-black text-[#123f36] shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition-transform active:scale-[0.98]"
            >
              <Library aria-hidden className="h-5 w-5" />
              {t('viewArchive')}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function SlideVisual({ visual }: { visual: string }) {
  if (visual === 'archive') return <ArchiveVisual />;
  if (visual === 'prompt') return <PromptVisual />;
  return <CityVisual />;
}

function CityVisual() {
  return (
    <div className="relative flex min-h-full w-full items-end justify-center overflow-hidden bg-[linear-gradient(180deg,#f8b08c_0%,#f7d7bb_32%,#d7eef1_72%,#f6fffb_100%)] px-7 pb-8">
      <div className="absolute inset-x-0 bottom-[30%] h-28 bg-[linear-gradient(180deg,transparent,rgba(10,41,51,0.18))]" />
      <div className="absolute inset-x-0 bottom-[28%] flex items-end justify-center gap-2 px-5 opacity-90">
        {[88, 132, 104, 164, 118, 148, 96].map((height, index) => (
          <span
            key={`${height}-${index}`}
            className="w-10 rounded-t-lg bg-[#213b4c]/80 shadow-[inset_0_10px_0_rgba(255,255,255,0.16)]"
            style={{ height }}
          />
        ))}
      </div>
      <div className="absolute right-7 top-11 rounded-full bg-white/75 px-3 py-2 text-xs font-black text-[#0d3028] shadow-lg">
        Live Lens
      </div>
      <div className="relative z-10 w-full max-w-[19rem] rotate-[-4deg] rounded-[2rem] bg-white p-4 shadow-[0_26px_60px_rgba(31,41,55,0.22)]">
        <div className="overflow-hidden rounded-[1.45rem] bg-[#123f36] p-4">
          <div className="rounded-2xl bg-[#ffd64f] p-4">
            <div className="h-3 rounded-full bg-[#4b3f18]" />
          </div>
          <div className="mt-10 flex items-end justify-between">
            <div className="h-20 w-16 rounded-2xl bg-[#ff4f8b]" />
            <div className="space-y-3">
              <div className="h-3 w-28 rounded-full bg-white" />
              <div className="h-3 w-20 rounded-full bg-white/70" />
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between rounded-full bg-[#f3fbf7] px-4 py-3 text-sm font-black text-[#0d3028]">
          <span>Intent</span>
          <ArrowRight aria-hidden className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

function ArchiveVisual() {
  return (
    <div className="relative flex min-h-full w-full items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#dff8ff_0%,#f7fffb_100%)] px-6 py-10">
      <div className="absolute left-7 top-12 rounded-full bg-[#00c875] px-4 py-2 text-sm font-black text-white shadow-lg">
        Collection
      </div>
      <div className="grid w-full max-w-[20rem] grid-cols-2 gap-4">
        {[
          ['#2f66d0', '#ffffff', 'Sign'],
          ['#ff6f45', '#ffe5d7', 'POP'],
          ['#123f36', '#d9f6e8', 'Logo'],
          ['#ffd64f', '#fff4c1', 'Type'],
        ].map(([color, background, label], index) => (
          <div
            key={label}
            className={`rounded-[1.6rem] bg-white p-3 shadow-[0_18px_36px_rgba(15,23,42,0.11)] ${
              index % 2 === 0 ? 'translate-y-6' : ''
            }`}
          >
            <div
              className="mb-3 aspect-square rounded-[1.15rem]"
              style={{
                background: `linear-gradient(135deg, ${color}, ${background})`,
              }}
            />
            <div className="flex items-center justify-between text-xs font-black text-stone-700">
              <span>{label}</span>
              <Palette aria-hidden className="h-4 w-4 text-[#00a979]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PromptVisual() {
  return (
    <div className="relative flex min-h-full w-full items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#fff5d8_0%,#f7fffb_100%)] px-7 py-10">
      <div className="w-full max-w-[20rem] rounded-[2rem] bg-white p-5 shadow-[0_26px_60px_rgba(15,23,42,0.14)]">
        <div className="mb-5 flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#123f36] text-white">
            <ScanText aria-hidden className="h-6 w-6" />
          </span>
          <div>
            <p className="text-xs font-bold text-stone-400">Prompt</p>
            <p className="text-base font-black text-stone-950">Japanese output</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-4 w-full rounded-full bg-[#e7f4ef]" />
          <div className="h-4 w-10/12 rounded-full bg-[#e7f4ef]" />
          <div className="h-4 w-11/12 rounded-full bg-[#e7f4ef]" />
          <div className="h-4 w-8/12 rounded-full bg-[#e7f4ef]" />
        </div>
        <div className="mt-6 rounded-[1.3rem] bg-[#fff4c1] p-4">
          <p className="text-sm leading-6 font-black text-[#523d00]">「配色」「文字」「構図」をまとめて保存</p>
        </div>
      </div>
    </div>
  );
}

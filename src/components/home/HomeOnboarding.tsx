'use client';

import { ArrowRight, Camera, Library, Palette, ScanText, Sparkles } from 'lucide-react';
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
          <div className="lens-soft-mark mx-auto mb-5 grid h-28 w-28 place-items-center rounded-[2.35rem] bg-[#e9fbf3] text-[#006241] shadow-[0_24px_60px_rgba(0,98,65,0.16)]">
            <Sparkles
              aria-hidden
              className="lens-soft-mark-sparkle absolute right-5 top-5 h-5 w-5 text-[#00c875]"
            />
            <Camera aria-hidden className="h-14 w-14" strokeWidth={2.15} />
            <span className="absolute bottom-7 h-2 w-10 rounded-full bg-[#00c875]/25" />
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

      <div className="home-onboarding-shell mx-auto flex min-h-dvh w-full max-w-md flex-col pb-[calc(9.25rem+env(safe-area-inset-bottom))] lg:max-w-6xl lg:grid lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-10 lg:px-10 lg:py-10 lg:pb-10">
        <section className="home-visual-panel relative flex h-[38dvh] min-h-[250px] max-h-[320px] overflow-hidden rounded-b-[2rem] bg-[#0d3028] lg:h-auto lg:min-h-[42rem] lg:max-h-none lg:rounded-[2.4rem]">
          <SlideVisual key={currentSlide.visual} visual={currentSlide.visual} />
        </section>

        <section className="flex flex-1 flex-col justify-between px-5 pt-5 lg:px-0 lg:pt-0">
          <div
            key={currentSlide.label}
            className="animate-[lens-slide-up_620ms_cubic-bezier(0.16,1,0.3,1)_both]"
          >
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-[12px] font-bold text-[#006241] shadow-[0_8px_24px_rgba(0,98,65,0.08)]">
              <Sparkles aria-hidden className="h-3.5 w-3.5" />
              {currentSlide.label}
            </div>

            <h2 className="home-copy-title text-[1.82rem] leading-[1.12] font-black tracking-normal text-stone-950 sm:text-5xl">
              {currentSlide.title}
            </h2>
            <p className="home-copy-body mt-3 text-[15px] leading-7 font-semibold text-stone-600">
              {currentSlide.body}
            </p>

            <div className="home-slide-dots mt-5 flex items-center justify-center gap-3 lg:justify-start">
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

          <div className="home-action-bar fixed inset-x-0 bottom-0 z-20 mx-auto grid w-full max-w-md gap-2 bg-[#f4fbf8]/95 px-5 pt-3 pb-[calc(0.95rem+env(safe-area-inset-bottom))] shadow-[0_-14px_30px_rgba(15,23,42,0.08)] backdrop-blur lg:static lg:max-w-sm lg:bg-transparent lg:p-0 lg:pt-0 lg:shadow-none lg:backdrop-blur-none">
            <Link
              href="/capture"
              className="inline-flex min-h-[3.25rem] items-center justify-center gap-3 rounded-full bg-[#00c875] px-6 text-[16px] font-black text-white shadow-[0_14px_30px_rgba(0,200,117,0.24)] transition-transform active:scale-[0.98] lg:min-h-14 lg:text-[17px]"
            >
              <Camera aria-hidden className="h-5 w-5" />
              {t('capture')}
            </Link>
            <Link
              href="/archive"
              className="inline-flex min-h-[3.25rem] items-center justify-center gap-3 rounded-full border border-[#d8e9e2] bg-white px-6 text-[16px] font-black text-[#123f36] shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition-transform active:scale-[0.98] lg:min-h-14 lg:text-[17px]"
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
    <div className="relative flex min-h-full w-full items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#f8b08c_0%,#f7d7bb_32%,#d7eef1_72%,#f6fffb_100%)] px-7 pt-8 pb-4 lg:items-end lg:pb-8">
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
      <div className="absolute right-7 top-11 hidden rounded-full bg-white/75 px-3 py-2 text-xs font-black text-[#0d3028] shadow-lg lg:block">
        Live Lens
      </div>
      <div className="home-feature-card relative z-10 w-full max-w-[14.45rem] rotate-[-4deg] rounded-[1.55rem] bg-white p-2.5 shadow-[0_20px_46px_rgba(31,41,55,0.18)] lg:max-w-[19rem] lg:rounded-[2rem] lg:p-4">
        <div className="overflow-hidden rounded-[1.15rem] bg-[#123f36] p-2.5 lg:rounded-[1.45rem] lg:p-4">
          <div className="rounded-[1rem] bg-[#ffd64f] p-2.5 lg:rounded-2xl lg:p-4">
            <div className="h-2.5 rounded-full bg-[#4b3f18] lg:h-3" />
          </div>
          <div className="mt-5 flex items-end justify-between lg:mt-10">
            <div className="h-14 w-11 rounded-[1rem] bg-[#ff4f8b] lg:h-20 lg:w-16 lg:rounded-2xl" />
            <div className="space-y-2.5 lg:space-y-3">
              <div className="h-2.5 w-20 rounded-full bg-white lg:h-3 lg:w-28" />
              <div className="h-2.5 w-14 rounded-full bg-white/70 lg:h-3 lg:w-20" />
            </div>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between rounded-full bg-[#f3fbf7] px-3.5 py-2 text-xs font-black text-[#0d3028] lg:mt-3 lg:px-4 lg:py-3 lg:text-sm">
          <span>Intent</span>
          <ArrowRight aria-hidden className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

function ArchiveVisual() {
  return (
    <div className="relative flex min-h-full w-full items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#dff8ff_0%,#f7fffb_100%)] px-6 py-8 lg:py-10">
      <div className="absolute left-6 top-9 rounded-full bg-[#00c875] px-3.5 py-1.5 text-xs font-black text-white shadow-lg lg:left-7 lg:top-12 lg:px-4 lg:py-2 lg:text-sm">
        Collection
      </div>
      <div className="home-feature-card grid w-full max-w-[17rem] grid-cols-2 gap-3 lg:max-w-[20rem] lg:gap-4">
        {[
          ['#2f66d0', '#ffffff', 'Sign'],
          ['#ff6f45', '#ffe5d7', 'POP'],
          ['#123f36', '#d9f6e8', 'Logo'],
          ['#ffd64f', '#fff4c1', 'Type'],
        ].map(([color, background, label], index) => (
          <div
            key={label}
            className={`rounded-[1.35rem] bg-white p-2.5 shadow-[0_18px_36px_rgba(15,23,42,0.11)] lg:rounded-[1.6rem] lg:p-3 ${
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
    <div className="relative flex min-h-full w-full items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#fff5d8_0%,#f7fffb_100%)] px-7 py-8 lg:py-10">
      <div className="home-feature-card w-full max-w-[17.5rem] rounded-[1.75rem] bg-white p-4 shadow-[0_26px_60px_rgba(15,23,42,0.14)] lg:max-w-[20rem] lg:rounded-[2rem] lg:p-5">
        <div className="mb-4 flex items-center gap-3 lg:mb-5">
          <span className="grid h-11 w-11 place-items-center rounded-[1.1rem] bg-[#123f36] text-white lg:h-12 lg:w-12 lg:rounded-2xl">
            <ScanText aria-hidden className="h-5 w-5 lg:h-6 lg:w-6" />
          </span>
          <div>
            <p className="text-xs font-bold text-stone-400">Prompt</p>
            <p className="text-base font-black text-stone-950">Japanese output</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-3.5 w-full rounded-full bg-[#e7f4ef] lg:h-4" />
          <div className="h-3.5 w-10/12 rounded-full bg-[#e7f4ef] lg:h-4" />
          <div className="h-3.5 w-11/12 rounded-full bg-[#e7f4ef] lg:h-4" />
          <div className="h-3.5 w-8/12 rounded-full bg-[#e7f4ef] lg:h-4" />
        </div>
        <div className="mt-5 rounded-[1.2rem] bg-[#fff4c1] p-3.5 lg:mt-6 lg:rounded-[1.3rem] lg:p-4">
          <p className="text-[13px] leading-6 font-black text-[#523d00] lg:text-sm">
            「配色」「文字」「構図」をまとめて保存
          </p>
        </div>
      </div>
    </div>
  );
}

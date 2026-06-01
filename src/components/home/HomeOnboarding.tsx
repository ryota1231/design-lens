'use client';

import { Camera, Library, Palette, ScanText, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useRef, useState, type TouchEvent } from 'react';
import { Link } from '@/lib/i18n/routing';

const SWIPE_THRESHOLD_PX = 44;

export function HomeOnboarding({ skipSplash = false }: { skipSplash?: boolean }) {
  const t = useTranslations('home');
  const [slideIndex, setSlideIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

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

  const currentSlide = slides[slideIndex];

  function goToSlide(nextIndex: number) {
    setSlideIndex((nextIndex + slides.length) % slides.length);
  }

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    if (touchStartX.current === null) return;

    const endX = event.changedTouches[0]?.clientX;
    if (endX === undefined) return;

    const deltaX = endX - touchStartX.current;
    touchStartX.current = null;

    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return;
    goToSlide(slideIndex + (deltaX < 0 ? 1 : -1));
  }

  return (
    <main className="min-h-dvh overflow-x-hidden bg-[#f4fbf8] text-stone-950">
      {!skipSplash && (
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
      )}

      <div
        className={`home-onboarding-shell ${skipSplash ? 'home-onboarding-shell--ready' : ''} mx-auto flex min-h-dvh w-full max-w-md flex-col pb-0 lg:max-w-6xl lg:grid lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-10 lg:px-10 lg:py-10 lg:pb-10`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <section className="home-visual-panel relative flex h-[54dvh] min-h-[370px] max-h-[485px] overflow-hidden rounded-b-[2rem] bg-[#0d3028] lg:h-auto lg:min-h-[42rem] lg:max-h-none lg:rounded-[2.4rem]">
          <SlideVisual key={currentSlide.visual} visual={currentSlide.visual} />
        </section>

        <section className="home-copy-panel flex flex-1 flex-col justify-between px-5 pt-5 lg:px-0 lg:pt-0">
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
                  onClick={() => goToSlide(index)}
                />
              ))}
            </div>
          </div>

          <div className="home-action-bar sticky inset-x-0 bottom-0 z-20 -mx-5 mt-auto grid w-[calc(100%+2.5rem)] max-w-md gap-2 bg-[#f4fbf8]/95 px-5 pt-3 pb-[calc(0.45rem+env(safe-area-inset-bottom))] shadow-[0_-14px_30px_rgba(15,23,42,0.08)] backdrop-blur lg:static lg:mx-auto lg:w-full lg:max-w-sm lg:bg-transparent lg:p-0 lg:pt-0 lg:shadow-none lg:backdrop-blur-none">
            <Link
              href="/capture"
              className="home-primary-action inline-flex min-h-[3.25rem] items-center justify-center gap-3 rounded-full bg-[#00c875] px-6 text-[16px] font-black text-white shadow-[0_14px_30px_rgba(0,200,117,0.24)] transition-transform active:scale-[0.98] lg:min-h-14 lg:text-[17px]"
            >
              <Camera aria-hidden className="h-5 w-5" />
              {t('capture')}
            </Link>
            <Link
              href="/archive"
              className="home-secondary-action inline-flex min-h-[3.25rem] items-center justify-center gap-3 rounded-full border border-[#d8e9e2] bg-white px-6 text-[16px] font-black text-[#123f36] shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition-transform active:scale-[0.98] lg:min-h-14 lg:text-[17px]"
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
    <div className="relative flex min-h-full w-full items-end justify-center overflow-hidden bg-[linear-gradient(180deg,#f8bd95_0%,#ffe2c6_38%,#dff5f4_100%)] px-6 pb-5 lg:pb-8">
      <div className="absolute inset-x-0 bottom-0 h-[46%] rounded-t-[2.5rem] bg-[#ecfbf6]" />
      <div className="absolute inset-x-0 top-10 flex items-end justify-center gap-2 px-6 opacity-80">
        {[92, 126, 104, 152, 116, 132].map((height, index) => (
          <span
            key={`${height}-${index}`}
            className="w-9 rounded-t-xl bg-[#536875]/75 shadow-[inset_0_10px_0_rgba(255,255,255,0.16)]"
            style={{ height }}
          />
        ))}
      </div>
      <div className="home-feature-card relative z-10 flex w-full max-w-[22.5rem] items-end justify-center">
        <div className="relative mb-9 w-[16rem] rotate-[-2deg] rounded-[1.7rem] bg-white p-3.5 shadow-[0_20px_46px_rgba(31,41,55,0.16)]">
          <div className="overflow-hidden rounded-[1.15rem] bg-[#143f35] p-3">
            <div className="rounded-[1rem] bg-[#ffd757] p-3">
              <div className="h-2.5 rounded-full bg-[#4b3f18]" />
            </div>
            <div className="mt-5 flex items-end justify-between">
              <div className="h-14 w-11 rounded-[1rem] bg-[#ff4f8b]" />
              <div className="space-y-2.5">
                <div className="h-2.5 w-20 rounded-full bg-white" />
                <div className="h-2.5 w-14 rounded-full bg-white/70" />
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-4 flex items-end">
          <div className="relative">
            <div className="mx-auto h-12 w-12 rounded-full bg-[#f5c09b]" />
            <div className="mx-auto -mt-1 h-20 w-16 rounded-t-[1.7rem] bg-[#006241]" />
            <div className="absolute top-11 left-10 h-6 w-16 -rotate-12 rounded-full bg-[#006241]" />
            <div className="absolute top-10 left-[4.7rem] grid h-11 w-[3.25rem] place-items-center rounded-[0.85rem] bg-[#102c2b] text-white shadow-lg">
              <Camera aria-hidden className="h-5 w-5" strokeWidth={2.4} />
            </div>
            <div className="absolute top-[3.25rem] left-[6.8rem] h-5 w-5 rounded-full border-4 border-[#00c875] bg-white" />
          </div>
        </div>

        <div className="absolute right-1 bottom-7 rounded-[1.1rem] bg-white/92 px-4 py-3 text-xs font-black text-[#0d3028] shadow-[0_12px_28px_rgba(15,23,42,0.14)]">
          Design spotting
        </div>
      </div>
    </div>
  );
}

function ArchiveVisual() {
  return (
    <div className="relative flex min-h-full w-full items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#dff8ff_0%,#f7fffb_100%)] px-6 py-8 lg:py-10">
      <div className="absolute left-6 top-7 z-10 rounded-full bg-[#00c875] px-3.5 py-1.5 text-xs font-black text-white shadow-lg lg:left-7 lg:top-12 lg:px-4 lg:py-2 lg:text-sm">
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
              index % 2 === 0 ? 'translate-y-1' : ''
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
    <div className="relative flex min-h-full w-full items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#fff5d8_0%,#f7fffb_100%)] px-7 py-9 lg:py-10">
      <div className="home-feature-card w-full max-w-[18.5rem] rounded-[1.75rem] bg-white p-4 shadow-[0_26px_60px_rgba(15,23,42,0.14)] lg:max-w-[20rem] lg:rounded-[2rem] lg:p-5">
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

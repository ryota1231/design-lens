'use client';

import Image from 'next/image';
import { ArrowUpRight, Camera, Palette } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { listRecentAnalyses } from '@/lib/db/repository';
import { db, type AnalysisRecord, type PhotoRecord } from '@/lib/db/schema';
import { Link } from '@/lib/i18n/routing';

interface Item {
  analysis: AnalysisRecord;
  thumbUrl: string | null;
}

export function PhotoGrid() {
  const t = useTranslations();
  const locale = useLocale();
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    let cancelled = false;
    const urls: string[] = [];

    void (async () => {
      try {
        const analyses = await listRecentAnalyses({ limit: 50 });
        const enriched = await Promise.all(
          analyses.map(async (analysis) => {
            const photo = await db.photos.get(analysis.photoId);
            const src = photo ? getPhotoThumbnailSrc(photo) : null;
            if (src?.kind === 'object-url') urls.push(src.value);

            return { analysis, thumbUrl: src?.value ?? null };
          }),
        );

        if (!cancelled) setItems(enriched);
      } catch {
        if (!cancelled) setItems([]);
      }
    })();

    return () => {
      cancelled = true;
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  if (items.length === 0) {
    return (
      <div className="grid min-h-72 place-items-center rounded-lg border border-dashed border-stone-300 bg-white/70 px-6 py-12 text-center">
        <div className="flex max-w-sm flex-col items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-md bg-emerald-50 text-emerald-900">
            <Camera aria-hidden className="h-6 w-6" />
          </span>
          <p className="text-sm leading-6 text-stone-600">{t('archive.empty')}</p>
          <Button size="sm" className="gap-2 bg-emerald-950 hover:bg-emerald-900" asChild>
            <Link href="/capture">
              <Camera aria-hidden className="h-4 w-4" />
              {t('home.capture')}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
      {items.map(({ analysis, thumbUrl }, index) => (
        <CollectionPoster
          key={analysis.id}
          analysis={analysis}
          index={index}
          locale={locale}
          thumbUrl={thumbUrl}
        />
      ))}
    </ul>
  );
}

function CollectionPoster({
  analysis,
  index,
  locale,
  thumbUrl,
}: {
  analysis: AnalysisRecord;
  index: number;
  locale: string;
  thumbUrl: string | null;
}) {
  const t = useTranslations();
  const category = t(`analyze.categories.${analysis.category}`);
  const colors = analysis.colors.length > 0 ? analysis.colors : [{ hex: fallbackAccent(index), role: '' }];
  const accent = colors[0]?.hex ?? fallbackAccent(index);
  const tone = getPosterTone(accent, index);
  const date = new Intl.DateTimeFormat(locale === 'ja' ? 'ja-JP' : 'en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(analysis.createdAt));

  return (
    <li>
      <Link
        href={`/analyze/${analysis.id}`}
        className="group relative grid min-h-[15.75rem] grid-cols-[0.9fr_1.1fr] overflow-hidden rounded-[1.65rem] border border-white/65 p-5 shadow-[0_20px_48px_rgba(15,23,42,0.11)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_26px_62px_rgba(15,23,42,0.14)] focus-visible:ring-2 focus-visible:ring-[#00c875] focus-visible:outline-none sm:min-h-[17.5rem] sm:p-6"
        style={{
          background: `linear-gradient(135deg, ${tone.surface} 0%, ${tone.soft} 52%, ${tone.deep} 100%)`,
        }}
      >
        <span
          aria-hidden
          className="absolute -left-10 top-8 h-36 w-36 rounded-full bg-white/30 blur-2xl"
        />
        <span
          aria-hidden
          className="absolute -right-12 bottom-0 h-44 w-44 rounded-full bg-white/40 blur-2xl"
        />

        <div className="relative z-10 flex min-w-0 flex-col justify-between pr-2">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] font-black tracking-[0.16em] text-stone-500/75 uppercase">
                  {date}
                </p>
                <p className="mt-1 text-[2.7rem] leading-none font-light font-serif text-stone-500/45 italic">
                  {String(index + 1).padStart(2, '0')}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-1 text-[10px] font-black text-stone-700 shadow-sm backdrop-blur">
                <Palette aria-hidden className="h-3 w-3 text-[#00a979]" />
                {category}
              </span>
            </div>

            <h2 className="mt-4 text-[12px] font-black tracking-[0.12em] text-stone-700 uppercase">
              {t('analyze.concept')}
            </h2>
            <p className="mt-2 line-clamp-5 text-[12px] leading-5 font-semibold text-stone-700 sm:text-[13px] sm:leading-[1.65]">
              {analysis.concept}
            </p>
          </div>

          <div className="mt-4">
            <div className="mb-2 flex items-center gap-2">
              {colors.slice(0, 4).map((color, colorIndex) => (
                <span
                  key={`${analysis.id}-${color.hex}-${colorIndex}`}
                  className="h-4 w-4 rounded-[0.32rem] border border-white/80 shadow-sm"
                  style={{ backgroundColor: color.hex }}
                  title={`${color.hex} ${color.role}`}
                />
              ))}
            </div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-stone-600/80">
              {t('archive.openItem')}
              <ArrowUpRight
                aria-hidden
                className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </span>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-end">
          <div className="relative aspect-[9/18.5] w-[7.4rem] rotate-[3deg] rounded-[1.45rem] border-[5px] border-white bg-stone-950 p-1.5 shadow-[0_20px_38px_rgba(15,23,42,0.24)] transition-transform duration-300 group-hover:rotate-[1deg] group-hover:scale-[1.02] sm:w-[8.2rem]">
            <span
              aria-hidden
              className="absolute left-1/2 top-1.5 z-20 h-2 w-10 -translate-x-1/2 rounded-full bg-stone-950"
            />
            <div className="relative h-full overflow-hidden rounded-[1.05rem] bg-stone-100">
              {thumbUrl ? (
                <Image
                  src={thumbUrl}
                  alt=""
                  fill
                  sizes="160px"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="grid h-full place-items-center bg-[#ecfbf6] text-[#006241]">
                  <Camera aria-hidden className="h-9 w-9" />
                </div>
              )}
              <div className="absolute inset-x-2 bottom-2 rounded-full bg-white/88 px-3 py-2 text-[10px] font-black text-stone-800 shadow-sm backdrop-blur">
                Design Lens
              </div>
            </div>
          </div>
        </div>
      </Link>
    </li>
  );
}

function fallbackAccent(index: number): string {
  return ['#C8D5E3', '#E8A520', '#C8499D', '#4A5F7F', '#9FD8C3'][index % 5] ?? '#C8D5E3';
}

function getPosterTone(accent: string, index: number) {
  const base = isHexColor(accent) ? accent : fallbackAccent(index);
  return {
    surface: mixHex(base, '#ffffff', 0.78),
    soft: mixHex(base, '#f4fbf8', 0.88),
    deep: mixHex(base, '#f2f0eb', 0.72),
  };
}

function isHexColor(value: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(value);
}

function mixHex(hex: string, target: string, amount: number): string {
  const from = hexToRgb(hex);
  const to = hexToRgb(target);
  if (!from || !to) return target;

  const channel = (start: number, end: number) => Math.round(start + (end - start) * amount);
  return `#${[channel(from.r, to.r), channel(from.g, to.g), channel(from.b, to.b)]
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')}`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const match = /^#([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})$/.exec(hex);
  if (!match) return null;

  return {
    r: Number.parseInt(match[1] ?? '00', 16),
    g: Number.parseInt(match[2] ?? '00', 16),
    b: Number.parseInt(match[3] ?? '00', 16),
  };
}

function getPhotoThumbnailSrc(photo: PhotoRecord): { kind: 'object-url' | 'data-url'; value: string } | null {
  if (photo.thumbnailBlob) {
    return { kind: 'object-url', value: URL.createObjectURL(photo.thumbnailBlob) };
  }

  if (photo.thumbnailDataUrl) {
    return { kind: 'data-url', value: photo.thumbnailDataUrl };
  }

  return null;
}

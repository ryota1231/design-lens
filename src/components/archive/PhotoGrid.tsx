'use client';

import Image from 'next/image';
import { ArrowUpRight, Camera, Palette } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { listRecentAnalyses } from '@/lib/db/repository';
import { db, type AnalysisRecord, type PhotoRecord } from '@/lib/db/schema';
import { Link } from '@/lib/i18n/routing';

interface Item {
  analysis: AnalysisRecord;
  thumbUrl: string | null;
}

const ALL_GENRES = '__all__';

export function PhotoGrid() {
  const t = useTranslations();
  const locale = useLocale();
  const [items, setItems] = useState<Item[]>([]);
  const [activeGenre, setActiveGenre] = useState(ALL_GENRES);

  const posters = useMemo(
    () =>
      items.map((item, index) => ({
        ...item,
        styleGenre: getStyleGenre(item.analysis),
        sourceIndex: index,
      })),
    [items],
  );
  const genreOptions = useMemo(
    () =>
      Array.from(new Set(posters.flatMap((item) => (item.styleGenre ? [item.styleGenre] : [])))),
    [posters],
  );
  const selectedGenre =
    activeGenre === ALL_GENRES || genreOptions.includes(activeGenre) ? activeGenre : ALL_GENRES;
  const visiblePosters =
    selectedGenre === ALL_GENRES
      ? posters
      : posters.filter((item) => item.styleGenre === selectedGenre);

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
    <div className="space-y-4">
      <div aria-label={t('archive.filterLabel')} className="-mx-4 overflow-x-auto px-4 pb-1">
        <div className="flex min-w-max gap-2">
          {[ALL_GENRES, ...genreOptions].map((genre) => (
            <button
              key={genre}
              type="button"
              aria-pressed={selectedGenre === genre}
              className={`rounded-full px-4 py-2 text-[12px] font-black shadow-sm transition ${
                selectedGenre === genre
                  ? 'bg-[#123f36] text-white'
                  : 'bg-white text-stone-600 hover:bg-[#ecfbf6] hover:text-[#006241]'
              }`}
              onClick={() => setActiveGenre(genre)}
            >
              {genre === ALL_GENRES ? t('archive.allGenres') : genre}
            </button>
          ))}
        </div>
      </div>

      {visiblePosters.length === 0 ? (
        <div className="grid min-h-48 place-items-center rounded-[1.5rem] border border-dashed border-stone-300 bg-white/70 px-6 py-10 text-center">
          <p className="text-sm leading-6 font-semibold text-stone-600">
            {t('archive.noFilterResults')}
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
          {visiblePosters.map(({ analysis, sourceIndex, styleGenre, thumbUrl }) => (
            <CollectionPoster
              key={analysis.id}
              analysis={analysis}
              index={sourceIndex}
              locale={locale}
              styleGenre={styleGenre}
              thumbUrl={thumbUrl}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function CollectionPoster({
  analysis,
  index,
  locale,
  styleGenre,
  thumbUrl,
}: {
  analysis: AnalysisRecord;
  index: number;
  locale: string;
  styleGenre: string | null;
  thumbUrl: string | null;
}) {
  const t = useTranslations();
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
        className="group relative flex min-h-[20.5rem] flex-col overflow-hidden rounded-[1.35rem] border border-white/65 p-3 shadow-[0_18px_42px_rgba(15,23,42,0.11)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_56px_rgba(15,23,42,0.14)] focus-visible:ring-2 focus-visible:ring-[#00c875] focus-visible:outline-none sm:min-h-[22rem] sm:rounded-[1.65rem] sm:p-4"
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

        <div className="relative z-10 flex items-center justify-between gap-2">
          <p className="shrink-0 whitespace-nowrap text-[17px] leading-none font-black tracking-normal text-stone-800 sm:text-lg">
            {date}
          </p>
          {styleGenre && (
            <span className="inline-flex max-w-[5.75rem] min-w-0 shrink items-center gap-1 rounded-full bg-white/72 px-2.5 py-1 text-[10px] font-black text-stone-700 shadow-sm backdrop-blur">
              <Palette aria-hidden className="h-3 w-3 shrink-0 text-[#00a979]" />
              <span className="truncate">{styleGenre}</span>
            </span>
          )}
        </div>

        <div className="relative z-10 mt-4 flex justify-center">
          <div className="relative aspect-[16/10] w-full rotate-[1.5deg] rounded-[1rem] border-[4px] border-white bg-stone-950 p-1.5 shadow-[0_18px_34px_rgba(15,23,42,0.22)] transition-transform duration-300 group-hover:rotate-[0.5deg] group-hover:scale-[1.02]">
            <span
              aria-hidden
              className="absolute left-3 top-2 z-20 h-1.5 w-7 rounded-full bg-stone-950"
            />
            <div className="relative h-full overflow-hidden rounded-[0.75rem] bg-stone-100">
              {thumbUrl ? (
                <Image
                  src={thumbUrl}
                  alt=""
                  fill
                  sizes="220px"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="grid h-full place-items-center bg-[#ecfbf6] text-[#006241]">
                  <Camera aria-hidden className="h-9 w-9" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-4 flex min-w-0 flex-1 flex-col justify-between">
          <div>
            <h2 className="text-[11px] font-black tracking-[0.08em] text-stone-700 uppercase">
              {t('analyze.concept')}
            </h2>
            <p className="mt-1.5 line-clamp-4 text-[11px] leading-[1.65] font-semibold text-stone-700 sm:text-[12px]">
              {analysis.concept}
            </p>
          </div>

          <div className="mt-3">
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              {colors.slice(0, 4).map((color, colorIndex) => (
                <span
                  key={`${analysis.id}-${color.hex}-${colorIndex}`}
                  className="h-4 w-4 rounded-[0.32rem] border border-white/80 shadow-sm sm:h-5 sm:w-5"
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
      </Link>
    </li>
  );
}

function getStyleGenre(analysis: AnalysisRecord): string | null {
  const genre = analysis.styleGenre?.trim() || inferFallbackStyleGenre(analysis);
  return compactStyleGenre(genre) || null;
}

function compactStyleGenre(value: string): string {
  const text = value.trim();
  const normalized = text.toLowerCase();

  if (/テック|tech|digital|デジタル|ミニマル|minimal|シンプル|simple|clean|すっきり/.test(normalized)) {
    return 'ミニマル';
  }
  if (/高級|上質|洗練|luxury|premium|elegant|ラグジュアリー|エレガント/.test(normalized)) {
    return '高級感';
  }
  if (/可愛い|かわいい|cute|親し|丸み|やわらか|柔らか|ピンク|パステル|friendly/.test(normalized)) {
    return '親しみ';
  }
  if (/レトロ|retro|vintage|ヴィンテージ|クラシック|classic|懐か|ノスタル|昭和|手書き/.test(normalized)) {
    return 'レトロ';
  }
  if (/ポップ|pop|鮮やか|楽しい|元気|カラフル|ビビッド/.test(normalized)) {
    return 'ポップ';
  }
  if (/クール|cool|シャープ|知的|落ち着|信頼|ネイビー|青|ブルー|黒|black|グレー/.test(normalized)) {
    return 'クール';
  }
  if (/モダン|modern|現代|都会|先進/.test(normalized)) {
    return 'モダン';
  }

  return Array.from(text.replace(/\s+/g, '')).slice(0, 5).join('');
}

function inferFallbackStyleGenre(analysis: AnalysisRecord): string {
  const text = [
    analysis.concept,
    analysis.typography,
    analysis.visualFlow,
    analysis.target,
    ...analysis.fontHints,
    ...analysis.principles.map((principle) => `${principle.name} ${principle.description}`),
    ...analysis.improvements,
    ...analysis.applications,
    ...analysis.colors.map((color) => `${color.hex} ${color.role}`),
  ]
    .join(' ')
    .toLowerCase();

  if (/高級|上質|洗練|luxury|premium|elegant|ラグジュアリー/.test(text)) return '高級感';
  if (/可愛い|かわいい|cute|親し|丸み|やわらか|柔らか|ピンク|パステル/.test(text)) return '親しみ';
  if (/レトロ|retro|vintage|ヴィンテージ|クラシック|classic|懐か|ノスタル|昭和|手書き/.test(text)) return 'レトロ';
  if (/ポップ|pop|鮮やか|楽しい|元気|カラフル|ビビッド/.test(text)) return 'ポップ';
  if (/クール|cool|シャープ|知的|落ち着|信頼|ネイビー|青|ブルー|黒|black|グレー/.test(text)) return 'クール';
  if (/ミニマル|minimal|シンプル|余白|clean|すっきり/.test(text)) return 'ミニマル';
  if (/モダン|modern|現代|都会|先進/.test(text)) return 'モダン';

  const firstColor = analysis.colors.find((color) => isHexColor(color.hex))?.hex;
  if (firstColor) return inferGenreFromColor(firstColor);

  return 'モダン';
}

function inferGenreFromColor(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return 'モダン';

  const { h, s, l } = rgbToHsl(rgb);
  if ((h >= 300 || h <= 24) && s > 0.28 && l > 0.42) return '親しみ';
  if (h >= 24 && h <= 58 && l < 0.72) return 'レトロ';
  if ((h >= 180 && h <= 250) || l < 0.28) return 'クール';
  return 'モダン';
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

function rgbToHsl({ r, g, b }: { r: number; g: number; b: number }): {
  h: number;
  s: number;
  l: number;
} {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const l = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l };

  const delta = max - min;
  const s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  let h = 0;

  if (max === red) h = (green - blue) / delta + (green < blue ? 6 : 0);
  if (max === green) h = (blue - red) / delta + 2;
  if (max === blue) h = (red - green) / delta + 4;

  return { h: h * 60, s, l };
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

'use client';

import Image from 'next/image';
import { Camera } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { listRecentAnalyses } from '@/lib/db/repository';
import { db, type AnalysisRecord } from '@/lib/db/schema';
import { Link } from '@/lib/i18n/routing';

interface Item {
  analysis: AnalysisRecord;
  thumbUrl: string | null;
}

export function PhotoGrid() {
  const t = useTranslations();
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
            const url = photo ? URL.createObjectURL(photo.thumbnailBlob) : null;
            if (url) urls.push(url);

            return { analysis, thumbUrl: url };
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
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {items.map(({ analysis, thumbUrl }) => (
        <li
          key={analysis.id}
          className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm"
        >
          <Link
            href={`/analyze/${analysis.id}`}
            className="block transition-opacity hover:opacity-90"
          >
            {thumbUrl && (
              <Image
                src={thumbUrl}
                alt=""
                width={256}
                height={256}
                className="aspect-square w-full object-cover"
                unoptimized
              />
            )}
            <div className="p-3">
              <p className="line-clamp-2 text-sm leading-5 text-stone-700">{analysis.concept}</p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

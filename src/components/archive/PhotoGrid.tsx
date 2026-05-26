'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { listRecentAnalyses } from '@/lib/db/repository';
import { db, type AnalysisRecord } from '@/lib/db/schema';
import { Link } from '@/lib/i18n/routing';

interface Item {
  analysis: AnalysisRecord;
  thumbUrl: string | null;
}

export function PhotoGrid() {
  const t = useTranslations('archive');
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
    return <p className="mt-12 text-center text-gray-500">{t('empty')}</p>;
  }

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map(({ analysis, thumbUrl }) => (
        <li key={analysis.id} className="overflow-hidden rounded-md border">
          <Link href={`/analyze/${analysis.id}`} className="block">
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
            <div className="p-2">
              <p className="line-clamp-2 text-xs">{analysis.concept}</p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

'use client';

import { useTranslations } from 'next-intl';
import { PhotoGrid } from '@/components/archive/PhotoGrid';
import { Link } from '@/lib/i18n/routing';

export default function ArchivePage() {
  const t = useTranslations();

  return (
    <main className="mx-auto min-h-screen max-w-3xl p-4">
      <div className="mb-4">
        <Link href="/" className="text-sm text-gray-600">
          ← {t('common.back')}
        </Link>
      </div>
      <h1 className="mb-6 text-2xl font-bold">{t('archive.title')}</h1>
      <PhotoGrid />
    </main>
  );
}

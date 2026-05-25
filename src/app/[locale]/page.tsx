import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Link } from '@/lib/i18n/routing';

export default function Home() {
  const t = useTranslations('home');

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-center text-3xl font-bold">{t('title')}</h1>
      <p className="max-w-md text-center text-gray-600">{t('subtitle')}</p>
      <p className="text-center text-sm text-gray-500">{t('vision')}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button size="lg" asChild>
          <Link href="/capture">{t('capture')}</Link>
        </Button>
        <Button size="lg" variant="secondary" asChild>
          <Link href="/archive">{t('viewArchive')}</Link>
        </Button>
      </div>
    </main>
  );
}

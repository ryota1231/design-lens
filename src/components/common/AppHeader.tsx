import { Eye } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/routing';
import { LanguageSwitcher } from './LanguageSwitcher';

export function AppHeader() {
  const t = useTranslations('common');

  return (
    <header className="sticky top-0 z-20 border-b border-stone-200/80 bg-white/90 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
        <Link href="/?ready=1" aria-label={t('appName')} className="flex min-w-0 items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-emerald-950 text-white">
            <Eye aria-hidden className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-stone-950">
              {t('appName')}
            </span>
            <span className="hidden truncate text-xs text-stone-500 sm:block">{t('tagline')}</span>
          </span>
        </Link>
        <LanguageSwitcher />
      </div>
    </header>
  );
}

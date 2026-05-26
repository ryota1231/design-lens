'use client';

import { useLocale } from 'next-intl';
import { routing, usePathname, useRouter } from '@/lib/i18n/routing';
import { cn } from '@/lib/utils';

type Locale = (typeof routing.locales)[number];

const localeLabels: Record<Locale, string> = {
  ja: '日本語',
  en: 'EN',
};

export function LanguageSwitcher() {
  const currentLocale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div
      aria-label="Language"
      className="inline-flex overflow-hidden rounded-md border border-gray-200 bg-white text-xs"
      role="group"
    >
      {routing.locales.map((locale) => {
        const isActive = locale === currentLocale;

        return (
          <button
            aria-pressed={isActive}
            className={cn(
              'h-8 min-w-12 px-3 font-medium transition-colors',
              isActive ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100',
            )}
            key={locale}
            onClick={() => router.replace(pathname, { locale })}
            type="button"
          >
            {localeLabels[locale]}
          </button>
        );
      })}
    </div>
  );
}

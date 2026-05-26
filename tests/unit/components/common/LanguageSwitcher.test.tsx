import { render, screen } from '@testing-library/react';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';

const mocks = vi.hoisted(() => ({
  locale: 'ja',
  pathname: '/capture',
}));

vi.mock('next-intl', () => ({
  useLocale: () => mocks.locale,
}));

vi.mock('@/lib/i18n/routing', () => ({
  Link: ({
    children,
    href,
    locale,
    prefetch: _prefetch,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & {
    children: ReactNode;
    href: string;
    locale: string;
    prefetch?: boolean;
  }) => {
    void _prefetch;
    return (
      <a href={`/${locale}${href === '/' ? '' : href}`} {...props}>
        {children}
      </a>
    );
  },
  routing: {
    locales: ['ja', 'en'],
  },
  usePathname: () => mocks.pathname,
}));

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    mocks.locale = 'ja';
    mocks.pathname = '/capture';
  });

  it('marks current locale', () => {
    render(<LanguageSwitcher />);

    expect(screen.getByRole('link', { name: '日本語' })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('link', { name: 'EN' })).not.toHaveAttribute('aria-current');
  });

  it('links to the current pathname with selected locale', () => {
    render(<LanguageSwitcher />);

    expect(screen.getByRole('link', { name: 'EN' })).toHaveAttribute('href', '/en/capture');
  });
});

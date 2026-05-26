import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';

const mocks = vi.hoisted(() => ({
  locale: 'ja',
  pathname: '/capture',
  replace: vi.fn(),
}));

vi.mock('next-intl', () => ({
  useLocale: () => mocks.locale,
}));

vi.mock('@/lib/i18n/routing', () => ({
  routing: {
    locales: ['ja', 'en'],
  },
  usePathname: () => mocks.pathname,
  useRouter: () => ({
    replace: mocks.replace,
  }),
}));

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    mocks.locale = 'ja';
    mocks.pathname = '/capture';
    mocks.replace.mockClear();
  });

  it('marks current locale as pressed', () => {
    render(<LanguageSwitcher />);

    expect(screen.getByRole('button', { name: '日本語' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'EN' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('replaces the current pathname with selected locale', () => {
    render(<LanguageSwitcher />);

    fireEvent.click(screen.getByRole('button', { name: 'EN' }));

    expect(mocks.replace).toHaveBeenCalledWith('/capture', { locale: 'en' });
  });
});

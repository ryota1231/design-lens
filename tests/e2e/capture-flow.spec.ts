import { expect, test } from '@playwright/test';

test('shows Japanese home and switches to English', async ({ page }) => {
  await page.goto('/ja');

  await expect(page).toHaveURL(/\/ja$/);
  await expect(page.getByRole('heading', { name: 'デザインを観察しよう' })).toBeVisible();
  await expect(page.getByRole('link', { name: '撮影する' })).toBeVisible();
  await expect(page.getByRole('link', { name: '日本語' })).toHaveAttribute('aria-current', 'true');

  await page.getByRole('link', { name: 'EN' }).click();

  await expect(page).toHaveURL(/\/en$/);
  await expect(page.getByRole('heading', { name: 'Observe design in the wild' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Capture' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'EN' })).toHaveAttribute('aria-current', 'true');
});

test('opens archive and shows empty state', async ({ page }) => {
  await page.goto('/ja');

  await page.getByRole('link', { name: '図鑑を見る' }).click();

  await expect(page).toHaveURL(/\/ja\/archive$/);
  await expect(page.getByRole('heading', { name: '観察した図鑑' })).toBeVisible();
  await expect(page.getByText('まだ何も観察していません。撮影から始めましょう。')).toBeVisible();
});

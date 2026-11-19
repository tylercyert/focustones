import { expect, test } from '@playwright/test';

test('the placeholder desktop renders and makes no outside requests', async ({ page }) => {
  const outside: string[] = [];
  page.on('request', (r) => { if (new URL(r.url()).hostname !== 'localhost') outside.push(r.url()); });
  await page.goto('/');
  await expect(page.getByRole('banner')).toHaveText('FocusTones');
  await expect(page.getByRole('main')).toBeVisible();
  expect(outside).toEqual([]);
});

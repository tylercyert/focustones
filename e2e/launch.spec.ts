import { expect, test } from '@playwright/test';
import vercel from '../vercel.json' with { type: 'json' };

// Launch polish (#8): the head a crawler, a link preview and Safari read; the files beside the page; old deep links.
test.use({ reducedMotion: 'reduce' });

test('the head carries the title, description, canonical, link-preview card, Smart App Banner and icons', async ({ page, request }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('FocusTones: binaural beats, free in your browser');
  const meta = (sel: string) => page.locator(`head ${sel}`).getAttribute('content');
  expect(await meta('meta[name="description"]')).toMatch(/^Press play and a binaural or isochronic beat fades in/);
  expect(await page.locator('head link[rel="canonical"]').getAttribute('href')).toBe('https://focustones.co/');
  expect(await meta('meta[name="apple-itunes-app"]')).toBe('app-id=6834913847');
  expect(await meta('meta[name="theme-color"]')).toMatch(/^#[0-9a-f]{6}$/i);
  expect(await meta('meta[property="og:image"]')).toBe('https://focustones.co/og.png');
  expect(await meta('meta[property="og:image:width"]')).toBe('1200');
  expect(await meta('meta[property="og:image:height"]')).toBe('630');
  expect(await meta('meta[name="twitter:card"]')).toBe('summary_large_image');
  for (const sel of ['meta[property="og:title"]', 'meta[property="og:description"]', 'meta[property="og:image:alt"]', 'meta[name="twitter:image"]']) {
    expect((await meta(sel))?.length, sel).toBeGreaterThan(10);
  }
  expect(await page.content()).not.toContain('%FT_'); // every placeholder filled
  // Every icon and the preview image the head names is served, as the type it claims.
  const icons = await page.locator('head link[rel~="icon"], head link[rel="apple-touch-icon"]').evaluateAll((ls) => ls.map((l) => (l as HTMLLinkElement).getAttribute('href')!));
  for (const href of [...icons, '/og.png']) {
    const r = await request.get(href);
    expect(r.status(), href).toBe(200);
    expect(r.headers()['content-type'], href).toMatch(/^image\//);
  }
});

test('robots.txt allows everything and names the sitemap; the sitemap lists the one page', async ({ request }) => {
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain('Allow: /');
  expect(robots).toContain('Sitemap: https://focustones.co/sitemap.xml');
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).toContain('<loc>https://focustones.co/</loc>');
});

// The old site had paths like /blog and /settings; links to them should land on the desktop, never a 404.
for (const path of ['/blog', '/articles/binaural-beats', '/settings?x=1', '/index.html', '/no/such/page/']) {
  test(`an old deep link (${path}) lands on the desktop`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const res = await page.goto(path);
    expect(res!.status()).toBe(200);
    await expect(page.getByRole('dialog', { name: 'Listen', exact: true })).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test('vercel.json sends every path that is not a file to the desktop', () => {
  // Vercel serves real files (robots.txt, og.png, assets) before it applies rewrites.
  expect(vercel.rewrites).toContainEqual({ source: '/(.*)', destination: '/index.html' });
});

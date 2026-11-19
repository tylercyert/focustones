import { expect, test, type Page } from '@playwright/test';

// Journeys for the Listen, Get FocusTones, feature and About windows, at 1280×800 and 375×812 (two projects).
// They run against the dev harness; when the shell registers the windows, point HARNESS at '/' and open windows by icon.
const HARNESS = '/harness.html';
const TOKEN = /[?&]pt=[^&]+/;
const shot = (page: Page, name: string) => page.screenshot({ path: `docs/evidence/${name}-${page.viewportSize()!.width}.png` });

test.beforeEach(async ({ page }) => {
  const outside: string[] = [];
  page.on('request', (r) => { if (!/^(http:\/\/localhost|data:|blob:)/.test(r.url())) outside.push(r.url()); });
  page.on('pageerror', (e) => { throw e; });
  (page as Page & { outside: string[] }).outside = outside;
});
test.afterEach(({ page }) => { expect((page as Page & { outside: string[] }).outside).toEqual([]); });

test('land → Play → hear and see the state → bands, timer, mode', async ({ page }) => {
  await page.goto(`${HARNESS}?bar=${page.viewportSize()!.width < 700 ? 1 : 0}`);
  const listen = page.locator('[data-window="listen"]');
  await expect(listen.getByTestId('preset-name')).toHaveText('Deep Work');
  await expect(listen.getByTestId('preset-line')).toHaveText('Focus · β 16 Hz');
  await expect(listen.getByTestId('status')).toHaveText('Ready when you are');
  await shot(page, 'landing');

  const t0 = Date.now();
  await listen.getByTestId('play').click();
  await expect(listen.getByTestId('status')).toHaveText(/Fading in|Playing/);
  await expect(listen.getByTestId('status')).toHaveText('Playing');
  expect(Date.now() - t0).toBeLessThan(5000); // click to sound, far inside the 20 s budget
  await expect(listen.getByTestId('orb')).toHaveAttribute('data-playing', 'true');
  await expect(listen.getByTestId('play')).toHaveAccessibleName('Pause');

  await listen.getByTestId('band-delta').click();
  await expect(listen.getByTestId('preset-name')).toHaveText('Deep Sleep');
  await expect(listen.getByTestId('preset-line')).toHaveText('Sleep · δ 2 Hz');
  await expect(listen.getByTestId('orb')).toHaveAttribute('data-band', 'delta');

  await listen.getByTestId('timer-25').click();
  await expect(listen.getByTestId('timer-25')).toHaveAttribute('aria-checked', 'true');
  await expect(listen.getByTestId('status')).toHaveText(/^2[45]:\d\d left$/);

  await listen.getByTestId('output-speaker').click();
  await expect(listen.getByTestId('output-note')).toContainText('Speaker mode pulses the tone');
  await page.waitForTimeout(900); // let the 0.6 s colour morph settle
  await shot(page, 'playing');

  await listen.getByTestId('play').click();
  await expect(listen.getByTestId('status')).toHaveText('Paused');
  await listen.getByTestId('play').click();
  await expect(listen.getByTestId('status')).toHaveText(/Fading in|Playing|\d+:\d\d left/);
});

test('the free set is every band preset, any timer, no nag', async ({ page }) => {
  await page.goto(HARNESS);
  const listen = page.locator('[data-window="listen"]');
  const names: string[] = [];
  for (const b of ['delta', 'theta', 'alpha', 'beta', 'gamma']) {
    await listen.getByTestId(`band-${b}`).click();
    names.push((await listen.getByTestId('preset-name').textContent())!);
  }
  expect(names).toEqual(['Deep Sleep', 'Daydream', 'Calm Focus', 'Deep Work', 'Peak']);
  for (const t of ['off', '15', '25', '45', '60', '90']) {
    await listen.getByTestId(`timer-${t}`).click();
    await expect(listen.getByTestId(`timer-${t}`)).toHaveAttribute('aria-checked', 'true');
  }
});

test('Get FocusTones: badge and QR carry the campaign token, prices as approved', async ({ page }) => {
  await page.goto(HARNESS);
  const get = page.locator('[data-window="get"]');
  await expect(get.getByText('FocusTones: Binaural Beats')).toBeVisible();
  await expect(get.getByText('Focus, Study & Sleep Sounds')).toBeVisible();
  const badge = get.locator('.ft-badge');
  await expect(badge.locator('img')).toHaveAttribute('alt', 'Download on the App Store');
  const href = (await badge.getAttribute('href'))!;
  expect(href).toMatch(/^https:\/\/apps\.apple\.com\/app\/apple-store\/id6834913847\?/);
  expect(href).toMatch(TOKEN);
  expect(href).toContain('ct=focustones-co-get-window');
  expect(href).toContain('mt=8');
  const qr = get.getByTestId('qr');
  await expect(qr.locator('svg path')).toHaveCount(1);
  expect(await qr.getAttribute('href')).toContain('ct=focustones-co-qr');
  for (const price of ['Monthly: $6.99 a month.', 'Annual: a 7-day trial, then $39.99 a year.', 'Lifetime: $79.99, one purchase with no renewal.']) {
    await expect(get.getByText(price)).toBeVisible();
  }
  await expect(get.getByText('No account and no ads.')).toBeVisible();
  await expect(get.getByText('Five band presets, any timer and Speaker mode are free, with no time limit.')).toBeVisible();
  await get.scrollIntoViewIfNeeded();
  await shot(page, 'get');
});

test('locked controls open the matching window, with a campaign link', async ({ page }) => {
  await page.goto(HARNESS);
  for (const [id, heading, ct] of [
    ['tune', 'An instrument you can tune', 'tune'],
    ['layers', 'Lay something underneath', 'layers'],
    ['programs', 'Save the sound that works', 'programs'],
  ] as const) {
    await page.getByTestId(`locked-${id}`).click();
    const win = page.locator(`[data-window="feature-${id}"]`);
    await expect(win.getByRole('heading', { name: heading })).toBeVisible();
    await expect(win.locator('img[src^="/frames/"]')).toBeVisible();
    expect(await win.locator('.ft-badge').getAttribute('href')).toContain(`ct=focustones-co-${ct}`);
  }
});

for (const [id, heading] of [
  ['feature-tune', 'An instrument you can tune'],
  ['feature-layers', 'Lay something underneath'],
  ['feature-programs', 'Save the sound that works'],
  ['feature-progress', 'See your focus time'],
  ['feature-iphone', 'Runs the whole work block'],
] as const) {
  test(`${id}: real app frame, approved line, App Store link`, async ({ page }) => {
    await page.goto(`${HARNESS}?w=${id}`);
    const win = page.locator(`[data-window="${id}"]`);
    await expect(win.getByRole('heading', { name: heading })).toBeVisible();
    const img = win.locator('img[src^="/frames/"]');
    await expect(img).toBeVisible();
    expect(await img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
    expect(await win.locator('.ft-badge').getAttribute('href')).toMatch(TOKEN);
    await shot(page, id);
  });
}

test('About the sound and About FocusTones', async ({ page }) => {
  await page.goto(`${HARNESS}?w=about-sound`);
  await expect(page.getByRole('heading', { name: 'Binaural beats' })).toBeVisible();
  await expect(page.getByText('It promises no particular effect.')).toBeVisible();
  await shot(page, 'about-sound');
  await page.goto(`${HARNESS}?w=about-app`);
  await expect(page.getByTestId('privacy-line')).toHaveText('This site sets no cookies and sends nothing anywhere.');
  const links = await page.locator('.ft-links a').evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).href));
  expect(links).toEqual(['https://tyl.sh/focustones/privacy', 'https://tyl.sh/focustones/support', 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/']);
  expect(await page.evaluate(() => document.cookie)).toBe('');
  await shot(page, 'about-app');
});

test.describe('the orb', () => {
  const frame = (page: Page) => page.getByTestId('orb').locator('canvas').evaluate((c: HTMLCanvasElement) => c.toDataURL());

  test('breathes while playing', async ({ page }) => {
    await page.goto(HARNESS);
    await page.getByTestId('play').click();
    await expect(page.getByTestId('status')).toHaveText('Playing');
    const a = await frame(page);
    await page.waitForTimeout(1500);
    expect(await frame(page)).not.toBe(a);
  });

  test.describe('with Reduce Motion', () => {
    test.use({ reducedMotion: 'reduce' });
    test('holds still, playing or not', async ({ page }) => {
      await page.goto(HARNESS);
      await page.waitForTimeout(500);
      const idle = await frame(page);
      await page.waitForTimeout(1200);
      expect(await frame(page)).toBe(idle);
      await page.getByTestId('play').click();
      await expect(page.getByTestId('status')).toHaveText('Playing');
      await page.waitForTimeout(3500); // past the fade-in swell
      const playing = await frame(page);
      await page.waitForTimeout(1500);
      expect(await frame(page)).toBe(playing);
    });
  });
});

import { expect, test, type Page } from '@playwright/test';

// Journeys for Listen, Get FocusTones, the feature windows and the About windows, inside the real desktop, at 1280×800
// and 375×812 (two Playwright projects). They also write the evidence screenshots under docs/evidence/6-windows/.
const TOKEN = /[?&]pt=129512140(&|$)/;
const phone = (page: Page) => page.viewportSize()!.width < 700;
/** Waits for window-open animations and every image, so no screenshot catches a half-drawn window. */
async function settle(page: Page) {
  await page.evaluate(async () => {
    await Promise.all(document.getAnimations().filter((a) => a.effect?.getComputedTiming().iterations !== Infinity).map((a) => a.finished.catch(() => undefined)));
    await Promise.all(Array.from(document.images).map((i) => (i.complete ? undefined : new Promise((r) => { i.onload = i.onerror = r; }))));
  });
  await page.waitForTimeout(150);
}
const shot = async (page: Page, name: string) => { await settle(page); await page.screenshot({ path: `docs/evidence/6-windows/${name}-${page.viewportSize()!.width}x${page.viewportSize()!.height}.png` }); };
const win = (page: Page, name: string) => page.getByRole('dialog', { name, exact: true });

// Skip the first-visit startup moment (it has its own test in desktop.spec.ts).
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('focustones.startup.seen', '1'));
  const outside: string[] = [];
  page.on('request', (r) => { if (new URL(r.url()).hostname !== 'localhost' && !/^(data|blob):/.test(r.url())) outside.push(r.url()); });
  page.on('pageerror', (e) => { throw e; });
  page.on('console', (m) => { if (m.type() === 'error') throw new Error(`console error: ${m.text()}`); });
  (page as Page & { outside: string[] }).outside = outside;
});
test.afterEach(({ page }) => { expect((page as Page & { outside: string[] }).outside).toEqual([]); });

const icon = (page: Page, label: string) => page.locator('nav .dicon').filter({ hasText: label });

/** Opens a window from its desktop icon (on a phone icons show only with no window open, so close them all first). */
async function openByIcon(page: Page, label: string) {
  if (phone(page)) {
    await page.getByRole('menuitem', { name: 'File', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Close All Windows' }).click();
    await icon(page, label).click();
  } else {
    await icon(page, label).dblclick();
  }
  await expect(win(page, label)).toBeVisible();
}

test('land → Play → hear and see the state → bands, timer, mode', async ({ page }) => {
  await page.goto('/');
  const listen = win(page, 'Listen');
  await expect(listen).toBeVisible();
  await expect(listen.getByTestId('preset-name')).toHaveText('Deep Work');
  await expect(listen.getByTestId('preset-line')).toHaveText('Focus · β 16 Hz');
  await expect(listen.getByTestId('status')).toHaveText('Ready when you are');
  await shot(page, 'landing');

  const t0 = Date.now();
  await listen.getByTestId('play').click();
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

test('the menu bar volume drives the engine, and the free set has no limits', async ({ page }) => {
  await page.goto('/');
  const listen = win(page, 'Listen');
  await page.getByRole('button', { name: /^Volume, \d+%/ }).click();
  await page.getByRole('slider', { name: 'Volume' }).fill('30');
  await expect(page.getByRole('button', { name: 'Volume, 30%' })).toBeVisible();
  await page.keyboard.press('Escape');
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
  await page.goto('/');
  if (phone(page)) await page.getByRole('button', { name: 'Get FocusTones', exact: true }).click(); // the switcher strip
  const get = win(page, 'Get FocusTones');
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
  // The QR code is for computers: shown on a wide screen with a fine pointer, hidden on a phone-sized one.
  if (phone(page)) await expect(qr).toBeHidden();
  else await expect(qr).toBeVisible();
  for (const price of ['Monthly: $6.99 a month.', 'Annual: a 7-day trial, then $39.99 a year.', 'Lifetime: $79.99, one purchase with no renewal.']) {
    await expect(get.getByText(price)).toBeVisible();
  }
  await expect(get.getByText('No account and no ads.')).toBeVisible();
  await expect(get.getByText('Five band presets, any timer and Speaker mode are free, with no time limit.')).toBeVisible();
  await shot(page, 'get');
});

test('on a phone the Get bar stays under Listen; on a desktop it does not', async ({ page }) => {
  await page.goto('/');
  const bar = win(page, 'Listen').locator('.ft-getbar');
  if (phone(page)) {
    await expect(bar).toBeVisible();
    expect(await bar.locator('a').getAttribute('href')).toContain('ct=focustones-co-bar');
  } else {
    await expect(bar).toHaveCount(0);
  }
});

test('locked controls open the matching window, with a campaign link', async ({ page }) => {
  await page.goto('/');
  for (const [id, label, heading] of [
    ['tune', 'Tune', 'An instrument you can tune'],
    ['layers', 'Layers', 'Lay something underneath'],
    ['programs', 'Programs', 'Save the sound that works'],
  ] as const) {
    await win(page, 'Listen').getByTestId(`locked-${id}`).click();
    const w = win(page, label);
    await expect(w.getByRole('heading', { name: heading })).toBeVisible();
    await expect(w.locator('img[src^="/frames/"]')).toBeVisible();
    expect(await w.locator('.ft-badge').getAttribute('href')).toContain(`ct=focustones-co-${id}`);
    if (phone(page)) await page.getByRole('button', { name: 'Listen', exact: true }).click(); // back to Listen via the strip
  }
});

for (const [label, heading, frame] of [
  ['Tune', 'An instrument you can tune', '/frames/tune.webp'],
  ['Layers', 'Lay something underneath', '/frames/layers.webp'],
  ['Programs', 'Save the sound that works', '/frames/mixes.webp'],
  ['Progress', 'See your focus time', '/frames/progress.webp'],
  ['iPhone everywhere', 'Runs the whole work block', '/frames/timer.webp'],
] as const) {
  test(`${label}: opens from its icon with the matching real app frame and an App Store link`, async ({ page }) => {
    await page.goto('/');
    await openByIcon(page, label);
    const w = win(page, label);
    await expect(w.getByRole('heading', { name: heading })).toBeVisible();
    const img = w.locator('img[src^="/frames/"]');
    await expect(img).toHaveAttribute('src', frame); // never a frame whose caption belongs to another window
    expect(await img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
    expect(await w.locator('.ft-badge').getAttribute('href')).toMatch(TOKEN);
    await shot(page, `feature-${label.split(' ')[0].toLowerCase()}`);
  });
}

test('About the sound and About FocusTones (from the FocusTones menu)', async ({ page }) => {
  await page.goto('/');
  await openByIcon(page, 'About the sound');
  await expect(win(page, 'About the sound').getByRole('heading', { name: 'Binaural beats', exact: true })).toBeVisible();
  await expect(win(page, 'About the sound').getByText('It promises no particular effect.')).toBeVisible();
  await shot(page, 'about-sound');
  await page.getByRole('menuitem', { name: 'File', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Close All Windows' }).click(); // a clean desktop for the About screenshot

  await page.getByRole('menuitem', { name: 'FocusTones menu' }).click();
  await page.getByRole('menuitem', { name: 'About FocusTones…' }).click();
  const about = win(page, 'About FocusTones');
  await expect(about.getByTestId('privacy-line')).toHaveText('This site sets no cookies and sends nothing anywhere.');
  const links = await about.locator('.ft-links a').evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).href));
  expect(links).toEqual(['https://tyl.sh/focustones/privacy', 'https://tyl.sh/focustones/support', 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/']);
  expect(await page.evaluate(() => document.cookie)).toBe('');
  await expect(about.getByText('Apple and the Apple logo are trademarks of Apple Inc., registered in the U.S. and other countries. App Store is a service mark of Apple Inc.')).toBeVisible();
  await shot(page, 'about-app');
});

test.describe('the orb', () => {
  const frame = (page: Page) => page.getByTestId('orb').locator('canvas').evaluate((c: HTMLCanvasElement) => c.toDataURL());

  test('breathes while playing', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('play').click();
    await expect(page.getByTestId('status')).toHaveText('Playing');
    const a = await frame(page);
    await page.waitForTimeout(1500);
    expect(await frame(page)).not.toBe(a);
  });

  test.describe('with Reduce Motion', () => {
    test.use({ reducedMotion: 'reduce' });
    test('holds still, playing or not', async ({ page }) => {
      await page.goto('/');
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

test('closing Listen fades the sound out and pauses it; reopening shows the same state', async ({ page }) => {
  await page.goto('/');
  const listen = win(page, 'Listen');
  await listen.getByTestId('timer-25').click();
  await listen.getByTestId('output-speaker').click();
  await listen.getByTestId('play').click();
  await expect(listen.getByTestId('status')).toHaveText(/^2[45]:\d\d left$/);
  await listen.getByRole('button', { name: 'Close' }).click();
  await expect(listen).toHaveCount(0);
  await openByIcon(page, 'Listen');
  const again = win(page, 'Listen');
  await expect(again.getByTestId('status')).toHaveText('Paused'); // paused, not still playing
  await expect(again.getByTestId('play')).toHaveAccessibleName('Play');
  await expect(again.getByTestId('orb')).toHaveAttribute('data-playing', 'false');
  await expect(again.getByTestId('timer-25')).toHaveAttribute('aria-checked', 'true');
  await expect(again.getByTestId('output-speaker')).toHaveAttribute('aria-checked', 'true');
  await again.getByTestId('play').click();
  await expect(again.getByTestId('status')).toHaveText(/Playing|\d+:\d\d left/);
});

test('every window has its own drawn desktop icon (the app icon only for Get FocusTones)', async ({ page }) => {
  await page.goto('/');
  if (phone(page)) {
    await page.getByRole('menuitem', { name: 'File', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Close All Windows' }).click();
  }
  const art = async (id: string) => page.locator(`.dicon[data-icon="${id}"] .dicon-art`).evaluate((e) => ({ tag: e.tagName, src: e.getAttribute('src'), html: e.innerHTML }));
  const ids = ['feature-tune', 'feature-layers', 'feature-programs', 'feature-progress', 'feature-iphone', 'about-sound', 'listen', 'welcome'];
  const drawn = new Set<string>();
  for (const id of ids) {
    const a = await art(id);
    expect(a.tag, id).toBe('svg');
    drawn.add(a.html);
  }
  expect(drawn.size).toBe(ids.length); // no two share a picture
  expect((await art('get')).src).toContain('/icons/app-');
});

test('on a short phone screen the Get bar never covers the last line of Listen', async ({ page }) => {
  test.skip(!phone(page), 'phones only');
  await page.setViewportSize({ width: 375, height: 600 });
  await page.goto('/');
  const body = page.locator('.win-body', { has: page.getByTestId('play') });
  await body.evaluate((e) => { e.scrollTop = e.scrollHeight; });
  const last = (await page.locator('.ft-foot').last().boundingBox())!;
  const bar = (await page.locator('.ft-getbar').boundingBox())!;
  expect(last.y + last.height).toBeLessThanOrEqual(bar.y + 1);
});

test.describe('radio groups (WAI-ARIA): roving tabindex, arrows move and select, the engine follows', () => {
  const listen = (page: Page) => win(page, 'Listen');

  test('bands: only the selected band is a Tab stop; arrows, Home and End change the preset', async ({ page }) => {
    await page.goto('/');
    const g = listen(page).getByRole('radiogroup', { name: 'Band' });
    const radios = g.getByRole('radio');
    await expect(radios).toHaveCount(5);
    await expect(g.locator('[tabindex="0"]')).toHaveCount(1);
    await expect(listen(page).getByTestId('band-beta')).toHaveAttribute('tabindex', '0');
    await expect(listen(page).getByTestId('band-delta')).toHaveAttribute('tabindex', '-1');
    await listen(page).getByTestId('band-beta').focus();
    await page.keyboard.press('ArrowRight');
    await expect(listen(page).getByTestId('band-gamma')).toBeFocused();
    await expect(listen(page).getByTestId('preset-name')).toHaveText('Peak'); // the engine's preset event
    await page.keyboard.press('ArrowRight'); // wraps
    await expect(listen(page).getByTestId('band-delta')).toBeFocused();
    await expect(listen(page).getByTestId('preset-name')).toHaveText('Deep Sleep');
    await page.keyboard.press('ArrowLeft');
    await expect(listen(page).getByTestId('band-gamma')).toBeFocused();
    await page.keyboard.press('Home');
    await expect(listen(page).getByTestId('preset-line')).toHaveText('Sleep · δ 2 Hz');
    await page.keyboard.press('End');
    await expect(listen(page).getByTestId('preset-line')).toHaveText('Focus · γ 40 Hz');
    await page.keyboard.press('ArrowUp');
    await expect(listen(page).getByTestId('preset-name')).toHaveText('Deep Work');
    await expect(listen(page).getByTestId('orb')).toHaveAttribute('data-band', 'beta');
    await expect(g.locator('[aria-checked="true"]')).toHaveCount(1);
    await expect(g.locator('[tabindex="0"]')).toHaveCount(1);
  });

  test('timer: arrows select a length and the engine counts it down', async ({ page }) => {
    await page.goto('/');
    await listen(page).getByTestId('play').click();
    await expect(listen(page).getByTestId('status')).toHaveText('Playing');
    await listen(page).getByTestId('timer-off').focus();
    await page.keyboard.press('ArrowRight'); // 15
    await page.keyboard.press('ArrowRight'); // 25
    await expect(listen(page).getByTestId('timer-25')).toBeFocused();
    await expect(listen(page).getByTestId('timer-25')).toHaveAttribute('aria-checked', 'true');
    await expect(listen(page).getByTestId('status')).toHaveText(/^2[45]:\d\d left$/); // the engine's time event
    await page.keyboard.press('End');
    await expect(listen(page).getByTestId('timer-90')).toHaveAttribute('aria-checked', 'true');
    await expect(listen(page).getByTestId('status')).toHaveText(/^(89|90):\d\d left$/);
    await page.keyboard.press('Home');
    await expect(listen(page).getByTestId('timer-off')).toHaveAttribute('aria-checked', 'true');
  });

  test('mode: an arrow switches Headphones to Speaker and the engine switches to isochronic', async ({ page }) => {
    await page.goto('/');
    await expect(listen(page).locator('[data-engine-mode]')).toHaveAttribute('data-engine-mode', 'binaural');
    await listen(page).getByTestId('output-headphones').focus();
    await page.keyboard.press('ArrowRight');
    await expect(listen(page).getByTestId('output-speaker')).toBeFocused();
    await expect(listen(page).locator('[data-engine-mode]')).toHaveAttribute('data-engine-mode', 'isochronic');
    await expect(listen(page).getByTestId('output-note')).toContainText('Speaker mode pulses the tone');
    await page.keyboard.press('ArrowLeft');
    await expect(listen(page).locator('[data-engine-mode]')).toHaveAttribute('data-engine-mode', 'binaural');
  });

  test('Tab leaves each group after one stop', async ({ page }) => {
    await page.goto('/');
    await listen(page).getByTestId('band-beta').focus();
    await page.keyboard.press('Tab');
    await expect(listen(page).getByTestId('timer-off')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(listen(page).getByTestId('output-headphones')).toBeFocused();
  });
});

test('at 200% text Listen wraps its controls instead of clipping or scrolling sideways', async ({ page }) => {
  await page.goto('/');
  const listen = win(page, 'Listen');
  // Chromium text-scaling model: double every element's own original computed font size (read first, then written, so
  // an element does not inherit its parent's doubling on top of its own).
  await listen.evaluate((root) => {
    const els = [root, ...Array.from(root.querySelectorAll<HTMLElement>('*'))];
    const sizes = els.map((el) => parseFloat(getComputedStyle(el).fontSize));
    els.forEach((el, i) => { el.style.fontSize = `${sizes[i] * 2}px`; });
  });
  await page.waitForTimeout(200);
  const body = page.locator('.win-body', { has: page.getByTestId('play') });
  const m = await body.evaluate((b) => ({ scroll: b.scrollWidth, client: b.clientWidth }));
  expect(m.scroll).toBeLessThanOrEqual(m.client); // no sideways scrolling inside the window
  const box = (await body.boundingBox())!;
  for (const id of ['locked-tune', 'locked-layers', 'locked-programs', 'timer-off', 'timer-90', 'output-speaker', 'band-gamma']) {
    const b = (await listen.getByTestId(id).boundingBox())!;
    expect(b.x, id).toBeGreaterThanOrEqual(box.x - 1);
    expect(b.x + b.width, id).toBeLessThanOrEqual(box.x + box.width + 1);
  }
  await listen.getByTestId('locked-programs').scrollIntoViewIfNeeded();
  await expect(listen.getByTestId('locked-programs')).toBeVisible();
  await shot(page, 'listen-200-percent-text');
});

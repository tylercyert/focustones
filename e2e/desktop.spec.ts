import { expect, test, type Page } from '@playwright/test';

const ORIGIN = 'http://localhost:4391';

// Reduce Motion skips the startup moment, so most tests begin on the desktop at once.
test.use({ reducedMotion: 'reduce' });

function watch(page: Page) {
  const problems: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`console: ${m.text()}`); });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  page.on('request', (r) => { if (!r.url().startsWith(ORIGIN)) problems.push(`outside request: ${r.url()}`); });
  return problems;
}
const win = (page: Page, name: string) => page.getByRole('dialog', { name, exact: true });
const openWelcome = (page: Page) => page.getByRole('button', { name: 'Welcome', exact: true }).first().dblclick();
const openHelp = async (page: Page) => { await page.getByRole('menuitem', { name: 'Help', exact: true }).click(); await page.getByRole('menuitem', { name: 'Desktop Help' }).click(); };
const box = async (page: Page, name: string) => (await win(page, name).boundingBox())!;

test.describe('desktop', () => {
  test('renders the menu bar, icons and the demo window with no errors or outside requests', async ({ page }) => {
    const problems = watch(page);
    await page.goto('/');
    await expect(page.getByRole('menubar', { name: 'Menu bar' })).toBeVisible();
    for (const m of ['FocusTones menu', 'File', 'Edit', 'View', 'Window', 'Help']) await expect(page.getByRole('menuitem', { name: m })).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0); // nothing opens on launch until the real windows register openOnLaunch
    await expect(page.getByRole('button', { name: 'Welcome' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Desktop Help' })).toHaveCount(0); // Help is in the Help menu only
    await expect(page.getByRole('button', { name: 'Trash' })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Clock/ })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(problems).toEqual([]);
  });

  test('double-click opens a window from its icon; the close box closes it; Ctrl+W closes the front window', async ({ page }) => {
    await page.goto('/');
    const icon = page.getByRole('button', { name: 'Welcome', exact: true });
    await icon.click();
    await expect(win(page, 'Welcome')).toHaveCount(0); // one click only selects
    await expect(icon).toHaveAttribute('data-selected', 'true');
    await icon.dblclick();
    await expect(win(page, 'Welcome')).toBeVisible();
    await win(page, 'Welcome').getByRole('button', { name: 'Close' }).click();
    await expect(win(page, 'Welcome')).toHaveCount(0);
    await icon.dblclick();
    await icon.dblclick();
    await expect(win(page, 'Welcome')).toHaveCount(1);
    await openHelp(page);
    await expect(win(page, 'Desktop Help')).toBeVisible();
    await page.keyboard.press('Control+w');
    await expect(win(page, 'Desktop Help')).toHaveCount(0);
    await expect(win(page, 'Welcome')).toBeVisible();
    await page.keyboard.press('Control+w');
    await expect(win(page, 'Welcome')).toHaveCount(0);
    await page.keyboard.press('Control+w'); // nothing open: no error
  });

  test('collapses on title double-click and from the collapse box, twice', async ({ page }) => {
    await page.goto('/');
    await openWelcome(page);
    const w = win(page, 'Welcome');
    const full = (await box(page, 'Welcome')).height;
    const title = w.locator('.win-title');
    await title.dblclick({ position: { x: 150, y: 10 } });
    await expect(w.locator('.win-body')).toBeHidden();
    expect((await box(page, 'Welcome')).height).toBeLessThan(40);
    await title.dblclick({ position: { x: 150, y: 10 } });
    await expect(w.locator('.win-body')).toBeVisible();
    await expect.poll(async () => (await box(page, 'Welcome')).height).toBeCloseTo(full, 0);
    await w.getByRole('button', { name: 'Collapse' }).click();
    await expect(w.locator('.win-body')).toBeHidden();
    await w.getByRole('button', { name: 'Expand' }).click();
    await expect(w.locator('.win-body')).toBeVisible();
  });

  test('zooms to fill the desktop and back', async ({ page }) => {
    await page.goto('/');
    await openWelcome(page);
    const before = await box(page, 'Welcome');
    await win(page, 'Welcome').getByRole('button', { name: 'Zoom' }).click();
    await expect.poll(async () => (await box(page, 'Welcome')).width).toBeGreaterThan(1200);
    await win(page, 'Welcome').getByRole('button', { name: 'Zoom' }).click();
    await expect.poll(async () => (await box(page, 'Welcome')).width).toBeCloseTo(before.width, 0);
  });

  test('drags by the title bar, resizes by the corner, and remembers both after a reload', async ({ page }) => {
    await page.goto('/');
    await openWelcome(page);
    const before = await box(page, 'Welcome');
    await page.mouse.move(before.x + 200, before.y + 12);
    await page.mouse.down();
    await page.mouse.move(before.x + 340, before.y + 112, { steps: 6 });
    await page.mouse.up();
    const moved = await box(page, 'Welcome');
    expect(Math.round(moved.x - before.x)).toBe(140);
    expect(Math.round(moved.y - before.y)).toBe(100);
    await page.mouse.move(moved.x + moved.width - 6, moved.y + moved.height - 6);
    await page.mouse.down();
    await page.mouse.move(moved.x + moved.width + 94, moved.y + moved.height + 54, { steps: 6 });
    await page.mouse.up();
    const sized = await box(page, 'Welcome');
    expect(Math.round(sized.width - moved.width)).toBe(100);
    expect(Math.round(sized.height - moved.height)).toBe(60);
    await page.reload();
    await openWelcome(page);
    const again = await box(page, 'Welcome');
    expect([again.x, again.y, again.width, again.height].map(Math.round)).toEqual([sized.x, sized.y, sized.width, sized.height].map(Math.round));
  });

  test('keeps the title bar on the desktop when dragged far away', async ({ page }) => {
    await page.goto('/');
    await openWelcome(page);
    const b = await box(page, 'Welcome');
    await page.mouse.move(b.x + 200, b.y + 12);
    await page.mouse.down();
    await page.mouse.move(-400, -400, { steps: 4 });
    await page.mouse.up();
    const after = await box(page, 'Welcome');
    expect(after.y).toBeGreaterThanOrEqual(24);
    expect(after.x + after.width).toBeGreaterThan(30);
  });

  test('clicking a window brings it to the front', async ({ page }) => {
    await page.goto('/');
    await openWelcome(page);
    await openHelp(page);
    const z = (n: string) => win(page, n).evaluate((e) => Number(getComputedStyle(e).zIndex));
    expect(await z('Desktop Help')).toBeGreaterThan(await z('Welcome'));
    await win(page, 'Welcome').locator('.win-title').click({ position: { x: 60, y: 10 } });
    expect(await z('Welcome')).toBeGreaterThan(await z('Desktop Help'));
    await expect(win(page, 'Welcome')).toHaveAttribute('data-active', 'true');
  });

  test('menus open windows and list them, by mouse and keyboard', async ({ page }) => {
    await page.goto('/');
    await openWelcome(page);
    await page.getByRole('menuitem', { name: 'FocusTones menu' }).click();
    await page.getByRole('menuitem', { name: 'About FocusTones…' }).click();
    await expect(win(page, 'About FocusTones')).toBeVisible();
    await page.getByRole('menuitem', { name: 'Window' }).click();
    await expect(page.getByRole('menuitemcheckbox', { name: 'About FocusTones' })).toHaveAttribute('aria-checked', 'true');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('menu')).toHaveCount(0);
    // Keyboard only: focus the Help menu, open it, choose its item.
    await page.getByRole('menuitem', { name: 'Help', exact: true }).focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('menuitem', { name: 'Desktop Help' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(win(page, 'Desktop Help')).toBeFocused();
    // File > Close Window closes it; Close All empties the desktop.
    await page.getByRole('menuitem', { name: 'File' }).click();
    await page.getByRole('menuitem', { name: 'Close All Windows' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('Ctrl/Cmd+W closes the window that holds keyboard focus, never another', async ({ page }) => {
    await page.goto('/');
    await openWelcome(page);
    await page.getByRole('menuitem', { name: 'FocusTones menu' }).click();
    await page.getByRole('menuitem', { name: 'About FocusTones…' }).click();
    await expect(win(page, 'About FocusTones')).toHaveAttribute('data-active', 'true');
    // Tab from the menu bar into Welcome (behind About): focus and the front window must agree.
    await page.getByRole('menuitem', { name: 'Help', exact: true }).focus();
    const welcome = win(page, 'Welcome');
    for (let i = 0; i < 12 && !(await welcome.evaluate((e) => e.contains(document.activeElement))); i++) await page.keyboard.press('Tab');
    expect(await welcome.evaluate((e) => e.contains(document.activeElement))).toBe(true);
    await expect(welcome).toHaveAttribute('data-active', 'true');
    await expect(win(page, 'About FocusTones')).not.toHaveAttribute('data-active', 'true');
    await page.keyboard.press('Control+w');
    await expect(welcome).toHaveCount(0);
    await expect(win(page, 'About FocusTones')).toBeVisible();
    await page.keyboard.press('Control+w'); // focus moved to the front window: it is the one that closes
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('Enter and Space open a menu onto its first item; arrows then move through it, even when it was already open', async ({ page }) => {
    await page.goto('/');
    const help = page.getByRole('menuitem', { name: 'Help', exact: true });
    await help.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('menuitem', { name: 'Desktop Help' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(help).toBeFocused();
    await page.keyboard.press('Space');
    await expect(page.getByRole('menuitem', { name: 'Desktop Help' })).toBeFocused();
    await page.keyboard.press('Escape');
    // Opened with the pointer, focus back on the trigger, then ArrowDown reaches the items.
    const view = page.getByRole('menuitem', { name: 'View', exact: true });
    await view.click();
    await view.focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('menuitem', { name: 'Clean Up Desktop' })).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('menuitemcheckbox', { name: 'Show Date in Menu Bar' })).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(page.getByRole('menuitem', { name: 'Select All Icons' })).toBeFocused();
  });

  test('keyboard alternatives: move, resize, zoom and collapse without a pointer', async ({ page }) => {
    await page.goto('/');
    await openWelcome(page);
    const w = win(page, 'Welcome');
    const before = await box(page, 'Welcome');
    await page.getByRole('menuitem', { name: 'Window', exact: true }).focus();
    await page.keyboard.press('Enter');
    await page.getByRole('menuitem', { name: 'Move or Resize Window' }).press('Enter');
    await expect(w.getByRole('group', { name: 'Welcome title bar' })).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    let b = await box(page, 'Welcome');
    expect([Math.round(b.x - before.x), Math.round(b.y - before.y)]).toEqual([16, 32]);
    await page.keyboard.press('Shift+ArrowRight');
    await page.keyboard.press('Shift+ArrowDown');
    b = await box(page, 'Welcome');
    expect([Math.round(b.width - before.width), Math.round(b.height - before.height)]).toEqual([16, 16]);
    await page.keyboard.press('Shift+ArrowLeft');
    await page.keyboard.press('Shift+ArrowLeft'); // the minimum size holds
    for (let i = 0; i < 30; i++) await page.keyboard.press('Shift+ArrowLeft');
    expect((await box(page, 'Welcome')).width).toBeGreaterThanOrEqual(219);
    // Zoom and collapse from the Window menu.
    await page.getByRole('menuitem', { name: 'Window', exact: true }).focus();
    await page.keyboard.press('Enter');
    await page.getByRole('menuitem', { name: 'Zoom Window' }).press('Enter');
    await expect.poll(async () => (await box(page, 'Welcome')).width).toBeGreaterThan(1200);
    await page.getByRole('menuitem', { name: 'Window', exact: true }).focus();
    await page.keyboard.press('Enter');
    await page.getByRole('menuitem', { name: 'Collapse Window' }).press('Enter');
    await expect(w.locator('.win-body')).toBeHidden();
  });

  test('keyboard focus rings reach 3:1 on the platinum chrome and on both desktop tones', async ({ page }) => {
    await page.goto('/');
    await openWelcome(page);
    const ratio = (a: [number, number, number], b: [number, number, number]) => {
      const lum = (c: [number, number, number]) => { const [r, g, bl] = c.map((v) => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * bl; };
      const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
      return (hi + 0.05) / (lo + 0.05);
    };
    const rgb = (c: string) => c.match(/\d+/g)!.slice(0, 3).map(Number) as [number, number, number];
    const desk = await page.locator('.desktop').evaluate((e) => ({ a: getComputedStyle(e).getPropertyValue('--desk-a').trim(), b: getComputedStyle(e).getPropertyValue('--desk-b').trim() }));
    const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
    await page.getByRole('button', { name: 'Trash' }).focus();
    await page.keyboard.press('Shift+Tab'); // keyboard modality, so :focus-visible applies
    await page.keyboard.press('Tab');
    const ring = await page.getByRole('button', { name: 'Trash' }).evaluate((e) => { const c = getComputedStyle(e); return { outline: c.outlineColor, shadow: c.boxShadow }; });
    const outer = rgb(ring.shadow);
    expect(ratio(outer, hex(desk.a))).toBeGreaterThanOrEqual(3);
    expect(ratio(outer, hex(desk.b))).toBeGreaterThanOrEqual(3);
    expect(ratio(rgb(ring.outline), outer)).toBeGreaterThanOrEqual(3);
    // On platinum: the inner black ring against #ddd.
    await win(page, 'Welcome').getByRole('button', { name: 'Zoom' }).focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    const inner = await win(page, 'Welcome').getByRole('button', { name: 'Zoom' }).evaluate((e) => getComputedStyle(e).outlineColor);
    expect(ratio(rgb(inner), [221, 221, 221])).toBeGreaterThanOrEqual(3);
  });

  test('the volume item keeps its value on this device', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /^Volume/ }).click();
    await page.getByRole('slider', { name: 'Volume' }).fill('35');
    await page.reload();
    await page.getByRole('button', { name: /^Volume/ }).click();
    await expect(page.getByRole('slider', { name: 'Volume' })).toHaveValue('35');
  });

  test('the Tab order reaches menus, icons, then the window controls', async ({ page }) => {
    await page.goto('/');
    const seen: string[] = [];
    for (let i = 0; i < 16; i++) {
      await page.keyboard.press('Tab');
      seen.push(await page.evaluate(() => document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.textContent?.trim() ?? ''));
    }
    await openWelcome(page);
    await page.getByRole('menuitem', { name: 'FocusTones menu' }).focus();
    const order: string[] = [];
    for (let i = 0; i < 14; i++) { await page.keyboard.press('Tab'); order.push(await page.evaluate(() => document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.textContent?.trim() ?? '')); }
    expect(order.indexOf('Close')).toBeGreaterThan(order.findIndex((s) => s === 'Help'));
    expect(seen.some((s) => s.includes('Welcome'))).toBe(true);
  });

  test('the startup moment shows on the first visit only, is under 1.2 s, and can be skipped', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'no-preference' });
    const page = await ctx.newPage();
    await page.goto(ORIGIN);
    await expect(page.getByRole('status', { name: 'Starting up…' })).toBeVisible();
    await page.keyboard.press('Space');
    await expect(page.getByRole('status', { name: 'Starting up…' })).toHaveCount(0);
    await page.reload();
    await expect(page.getByRole('status', { name: 'Starting up…' })).toHaveCount(0);
    await ctx.close();
    // A fresh first visit that is left alone ends by itself in under 1.2 s.
    const ctx2 = await browser.newContext({ reducedMotion: 'no-preference' });
    const page2 = await ctx2.newPage();
    const t0 = Date.now();
    await page2.goto(ORIGIN);
    await expect(page2.getByRole('status', { name: 'Starting up…' })).toBeVisible();
    await expect(page2.getByRole('status', { name: 'Starting up…' })).toHaveCount(0, { timeout: 2000 });
    expect(Date.now() - t0).toBeLessThan(1200 + 300); // + page load allowance
    await ctx2.close();
  });

  test('Reduce Motion skips the startup moment entirely', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('status', { name: 'Starting up…' })).toHaveCount(0);
  });
});

test.describe('phone', () => {
  test.use({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true });

  test('one window fills the screen, nothing scrolls sideways, labeled tabs switch windows', async ({ page }) => {
    const problems = watch(page);
    await page.goto('/');
    const noOverflow = () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth && document.body.scrollWidth <= window.innerWidth);
    expect(await noOverflow()).toBe(true);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.getByRole('button', { name: 'Welcome', exact: true }).tap(); // one tap opens
    const w = win(page, 'Welcome');
    const b = (await w.boundingBox())!;
    expect(Math.round(b.width)).toBe(375);
    expect(b.height).toBeGreaterThan(600);
    await page.getByRole('menuitem', { name: 'Help', exact: true }).tap();
    await page.getByRole('menuitem', { name: 'Desktop Help' }).tap();
    await expect(win(page, 'Desktop Help')).toBeVisible();
    await expect(w).toBeHidden(); // still open, but only one shows
    expect(await noOverflow()).toBe(true);
    const strip = page.getByRole('navigation', { name: 'Open windows' });
    await expect(strip.getByRole('button')).toHaveText(['Desktop', 'Welcome', 'Help']); // icon + short name tabs
    await strip.getByRole('button', { name: 'Welcome' }).tap();
    await expect(w).toBeVisible();
    await expect(win(page, 'Desktop Help')).toBeHidden();
    await strip.getByRole('button', { name: 'Desktop', exact: true }).tap();
    await expect(page.getByRole('dialog')).toBeHidden();
    await strip.getByRole('button', { name: 'Welcome' }).tap();
    await w.getByRole('button', { name: 'Close' }).tap();
    await expect(win(page, 'Desktop Help')).toBeVisible();
    const close = (await win(page, 'Desktop Help').getByRole('button', { name: 'Close' }).boundingBox())!;
    expect(close.width).toBeGreaterThanOrEqual(44);
    expect(close.height).toBeGreaterThanOrEqual(44);
    const bar = (await page.getByRole('menuitem', { name: 'File' }).boundingBox())!;
    expect(bar.height).toBeGreaterThanOrEqual(44);
    for (const t of await strip.getByRole('button').all()) expect((await t.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    expect(problems).toEqual([]);
  });

  test('at doubled text every menu-bar control stays on screen and reachable', async ({ page }) => {
    await page.goto('/');
    await page.addStyleTag({ content: '.menubar, .menubar * { font-size: 30px !important; }' });
    const controls = page.locator('.menubar button, .menubar time');
    const n = await controls.count();
    expect(n).toBeGreaterThanOrEqual(6);
    for (let i = 0; i < n; i++) {
      const b = (await controls.nth(i).boundingBox())!;
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.x + b.width).toBeLessThanOrEqual(375);
    }
    await page.getByRole('button', { name: /^Clock/ }).tap(); // the clock is still operable
    await page.getByRole('menuitem', { name: 'Help', exact: true }).tap();
    const m = (await page.getByRole('menu').boundingBox())!;
    expect(m.x).toBeGreaterThanOrEqual(0);
    expect(m.x + m.width).toBeLessThanOrEqual(375);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  test('menus stay inside a 375 px screen', async ({ page }) => {
    await page.goto('/');
    for (const name of ['FocusTones menu', 'File', 'Window', 'Help']) {
      await page.getByRole('menuitem', { name }).tap();
      const m = (await page.getByRole('menu').boundingBox())!;
      expect(m.x).toBeGreaterThanOrEqual(0);
      expect(m.x + m.width).toBeLessThanOrEqual(375);
      await page.keyboard.press('Escape');
    }
  });
});

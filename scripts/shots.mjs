#!/usr/bin/env node
// The design-pass screenshots (#8): every evidence size, light and dark OS, Reduce Motion, keyboard focus, the main windows.
// Usage: npx vite build && node scripts/shots.mjs <out dir>      (Playwright's Chromium against `vite preview`)
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.resolve(process.argv[2] ?? 'docs/evidence/8-polish/after');
const port = Number(process.env.FT_SHOTS_PORT ?? 4394);
const url = `http://localhost:${port}/`;
const SIZES = [[375, 812], [390, 844], [768, 1024], [1280, 800], [1920, 1080]];
fs.mkdirSync(out, { recursive: true });

const server = spawn('npx', ['vite', 'preview', '--port', String(port), '--strictPort'], { cwd: root, stdio: 'ignore' });
const settle = (page) => page.evaluate(async () => {
  await document.fonts.ready;
  await Promise.all(document.getAnimations().filter((a) => a.effect?.getComputedTiming().iterations !== Infinity).map((a) => a.finished.catch(() => undefined)));
  await Promise.all(Array.from(document.images).map((i) => (i.complete ? undefined : new Promise((r) => { i.onload = i.onerror = r; }))));
}).then(() => page.waitForTimeout(250));

async function open(browser, [w, h], { scheme = 'light', motion = 'reduce' } = {}) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1, colorScheme: scheme, reducedMotion: motion, hasTouch: w < 700, isMobile: w < 700 });
  await page.clock.setFixedTime(new Date('2026-11-19T09:41:00'));
  await page.addInitScript(() => localStorage.setItem('focustones.startup.seen', '1'));
  await page.goto(url);
  await page.getByRole('dialog', { name: 'Listen', exact: true }).waitFor();
  await settle(page);
  return page;
}
const snap = async (page, name) => { await settle(page); await page.screenshot({ path: path.join(out, `${name}.png`) }); };
async function openWindow(page, label) {
  await page.getByRole('menuitem', { name: 'File', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Close All Windows' }).click();
  const icon = page.locator('nav .dicon').filter({ hasText: label });
  if ((page.viewportSize()?.width ?? 0) < 700) await icon.click(); else await icon.dblclick();
  await page.getByRole('dialog', { name: label, exact: true }).waitFor();
}

try {
  for (let i = 0; ; i++) {
    try { if ((await fetch(url)).ok) break; } catch { /* not up yet */ }
    if (i > 100) throw new Error('vite preview did not start');
    await new Promise((r) => setTimeout(r, 100));
  }
  const browser = await chromium.launch();
  for (const size of SIZES) {
    const tag = `${size[0]}x${size[1]}`;
    for (const scheme of ['light', 'dark']) {
      const page = await open(browser, size, { scheme });
      await snap(page, `landing-${scheme}-${tag}`);
      await page.close();
    }
    const page = await open(browser, size);
    await page.getByTestId('play').click();
    await page.waitForTimeout(400);
    await snap(page, `playing-${tag}`);
    await page.getByTestId('play').click();
    await page.mouse.click(2, size[1] - 2); // clear hover
    await openWindow(page, 'Tune');
    await snap(page, `tune-${tag}`);
    await openWindow(page, 'Get FocusTones');
    await snap(page, `get-${tag}`);
    await openWindow(page, 'About the sound');
    await snap(page, `about-sound-${tag}`);
    await page.getByRole('menuitem', { name: 'File', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Close All Windows' }).click();
    await snap(page, `empty-desktop-${tag}`);
    await page.getByRole('menuitem', { name: 'FocusTones menu' }).click();
    await snap(page, `menu-${tag}`);
    await page.keyboard.press('Escape');
    await page.close();
  }
  // Keyboard only: Tab from the top of the page into Listen, at the two main sizes.
  for (const size of [[1280, 800], [375, 812]]) {
    const page = await open(browser, size);
    for (let i = 0; i < 9; i++) await page.keyboard.press('Tab');
    await snap(page, `keyboard-${size[0]}x${size[1]}`);
    await page.close();
  }
  // Motion allowed (the orb breathes) for comparison with the Reduce Motion shots above.
  const moving = await open(browser, [1280, 800], { motion: 'no-preference' });
  await moving.getByTestId('play').click();
  await moving.waitForTimeout(1500);
  await snap(moving, 'playing-motion-1280x800');
  await browser.close();
  console.log(`wrote ${fs.readdirSync(out).length} screenshots to ${path.relative(root, out)}`);
} finally {
  server.kill();
}

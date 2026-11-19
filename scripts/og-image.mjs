#!/usr/bin/env node
// Renders public/og.png, the 1200×630 link-preview image, from the real built desktop with Listen open.
// Usage: npx vite build && node scripts/og-image.mjs      (uses Playwright's Chromium and `vite preview`)
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.FT_OG_PORT ?? 4393);
const out = path.join(root, 'public/og.png');

const server = spawn('npx', ['vite', 'preview', '--port', String(port), '--strictPort'], { cwd: root, stdio: 'ignore' });
try {
  const url = `http://localhost:${port}/`;
  for (let i = 0; ; i++) {
    try { if ((await fetch(url)).ok) break; } catch { /* not up yet */ }
    if (i > 100) throw new Error('vite preview did not start');
    await new Promise((r) => setTimeout(r, 100));
  }
  const browser = await chromium.launch();
  // Laid out at 1600×840 (so both windows fit whole) and drawn at 0.75×: a 1200×630 image.
  const page = await browser.newPage({ viewport: { width: 1600, height: 840 }, deviceScaleFactor: 0.75, reducedMotion: 'reduce' });
  await page.clock.setFixedTime(new Date('2026-11-19T09:41:00'));
  // A first visit with the startup moment already seen: the launch windows (Listen in front, Get FocusTones beside it).
  await page.addInitScript(() => localStorage.setItem('focustones.startup.seen', '1'));
  await page.goto(url);
  await page.getByRole('dialog', { name: 'Listen', exact: true }).waitFor();
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(Array.from(document.images).map((i) => (i.complete ? undefined : new Promise((r) => { i.onload = i.onerror = r; }))));
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: out });
  await browser.close();
  console.log(`wrote ${path.relative(root, out)}`);
} finally {
  server.kill();
}

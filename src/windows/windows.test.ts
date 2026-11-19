import { describe, expect, it } from 'vitest';
import { windowSpecs } from './index.ts';
import { APP_STORE_ID, appStoreUrl, PROVIDER_TOKEN } from './shared/campaign.ts';
import { qrPath } from '../../vite-plugin-qr.ts';

describe('window specs', () => {
  it('have unique ids and open Listen and Get on launch', () => {
    const ids = windowSpecs.map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(windowSpecs.filter((w) => w.openOnLaunch).map((w) => w.id)).toEqual(['listen', 'get']);
  });

  it('cover every window the issue names, under the ids the Listen window opens', () => {
    expect(windowSpecs.map((w) => w.id)).toEqual(expect.arrayContaining([
      'listen', 'get', 'feature-tune', 'feature-layers', 'feature-programs', 'feature-progress', 'feature-iphone', 'about-sound', 'about-app',
    ]));
  });
});

describe('campaign link', () => {
  it('is the App Store page with a provider token, a per-placement campaign and the app media type', () => {
    const url = new URL(appStoreUrl('qr'));
    expect(url.origin + url.pathname).toBe(`https://apps.apple.com/app/apple-store/id${APP_STORE_ID}`);
    expect(url.searchParams.get('pt')).toBe(PROVIDER_TOKEN);
    expect(url.searchParams.get('ct')).toBe('focustones-co-qr');
    expect(url.searchParams.get('mt')).toBe('8');
  });
});

describe('QR code', () => {
  it('is a square grid whose path stays inside it, for the campaign link', () => {
    const { size, path } = qrPath(appStoreUrl('qr'));
    expect(size).toBeGreaterThanOrEqual(29); // version 3+: the link is ~110 bytes
    expect((size - 17) % 4).toBe(0);
    for (const m of path.matchAll(/M(\d+) (\d+)h(\d+)/g)) {
      expect(+m[1] + +m[3]).toBeLessThanOrEqual(size);
      expect(+m[2]).toBeLessThan(size);
    }
  });

  it('differs per link', () => {
    expect(qrPath(appStoreUrl('qr')).path).not.toBe(qrPath(appStoreUrl('bar')).path);
  });
});

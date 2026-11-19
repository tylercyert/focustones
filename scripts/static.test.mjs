import { describe, expect, it } from 'vitest';
import { scanText as words } from './words.mjs';
import { scanText as urls } from './requests.mjs';

describe('banned words', () => {
  it('flags medical claims, case-insensitively', () => {
    expect(words('a.ts', 'Helps ADHD and cures anxiety')).toHaveLength(3);
    expect(words('a.ts', 'It can heal you')).toHaveLength(1);
    expect(words('a.ts', 'clinically   proven')).toHaveLength(1);
  });
  it('lets honest copy and word fragments through', () => {
    expect(words('a.ts', 'Press play. Sink into focus. Wheat, healthy, treaty')).toEqual([]);
  });
  it('honours claims-exempt on the same line', () => {
    expect(words('a.ts', 'adhd // claims-exempt: a test word')).toEqual([]);
  });
});

describe('outside requests', () => {
  it('allows the App Store, privacy, support and the Apple EULA', () => {
    const text = [
      'https://apps.apple.com/app/id6834913847?ct=focustones-co',
      'https://tyl.sh/focustones/privacy',
      'https://tyl.sh/focustones/support',
      'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/',
    ].join(' ');
    expect(urls('x.js', text)).toEqual([]);
  });
  it('fails any other URL, including look-alikes and http', () => {
    expect(urls('x.js', 'https://fonts.googleapis.com/css')).toHaveLength(1);
    expect(urls('x.js', 'https://apps.apple.com.evil.example/x')).toHaveLength(1);
    expect(urls('x.js', 'https://tyl.sh/focustones/privacy-evil')).toHaveLength(1);
    expect(urls('x.js', 'http://apps.apple.com/x')).toHaveLength(1);
  });
});

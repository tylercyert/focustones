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
  it('catches a phrase soft-wrapped across lines, as HTML and JSX render it', () => {
    expect(words('index.html', '<p>clinically\nproven</p>')).toHaveLength(1);
    expect(words('index.html', '<p>clinically\n      \n  proven</p>')).toHaveLength(1);
    expect(words('A.tsx', '<p>pain\n relief</p>')).toHaveLength(1);
  });
  it('catches phrases split by string concatenation, escapes and entities', () => {
    expect(words('a.ts', 'const s = "clinically " +\n  "proven";')).toHaveLength(1);
    expect(words('a.ts', 'const s = "clinically\\nproven";')).toHaveLength(1);
    expect(words('A.tsx', '<p>clinically&nbsp;proven</p>')).toHaveLength(1);
    expect(words('A.tsx', '<p>clinically{" "}proven</p>')).toHaveLength(1);
  });
  it('reports the line a phrase starts on', () => {
    expect(words('a.ts', 'ok\nok\ncures')[0]).toMatch(/^a\.ts:3:/);
  });
  it('lets a code comment on its own line exempt the next line only', () => {
    expect(words('a.ts', '// claims-exempt: a test word\nconst w = "adhd";')).toEqual([]);
    expect(words('a.ts', '/* claims-exempt: a test word */\nconst w = "adhd";')).toEqual([]);
    expect(words('a.ts', '<!-- claims-exempt: quoted -->\n<p>adhd</p>')).toEqual([]);
    expect(words('a.ts', '// claims-exempt: a test word\nconst a = "x";\nconst w = "adhd";')).toHaveLength(1);
  });
  it('does not let a marker inside or beside copy exempt it', () => {
    expect(words('a.ts', 'const copy = "anxiety claims-exempt: why";')).toHaveLength(1);
    expect(words('a.ts', 'const w = "adhd"; // claims-exempt: a test word')).toHaveLength(1);
    expect(words('A.tsx', '<p>cures // claims-exempt: x</p>')).toHaveLength(1);
    expect(words('a.ts', '// claims-exempt:\nconst w = "adhd";')).toHaveLength(1);
  });
  it('honours the reviewed allowlist, per file and phrase', () => {
    const allowed = new Set(['a.ts: adhd']);
    expect(words('a.ts', 'adhd', allowed)).toEqual([]);
    expect(words('b.ts', 'adhd', allowed)).toHaveLength(1);
    expect(words('a.ts', 'anxiety', allowed)).toHaveLength(1);
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

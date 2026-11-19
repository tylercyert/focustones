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
  it('catches numeric, hex and named HTML space entities, even double-encoded', () => {
    for (const sp of ['&#32;', '&#x20;', '&#160;', '&#xA0;', '&nbsp;', '&NewLine;', '&Tab;', '&ensp;', '&#8201;', '&amp;#32;'])
      expect(words('index.html', `<p>clinically${sp}proven</p>`), sp).toHaveLength(1);
  });
  it('decodes entities inside the words themselves', () => {
    expect(words('index.html', '<p>anx&#105;ety, &#x63;ures</p>')).toHaveLength(2);
  });
  it('decodes JS and Unicode escapes', () => {
    expect(words('a.ts', 'const s = "clinically\\u0020proven";')).toHaveLength(1);
    expect(words('a.ts', 'const s = "clinically\\u{20}proven";')).toHaveLength(1);
    expect(words('a.ts', 'const s = "clinically\\x20proven";')).toHaveLength(1);
    expect(words('a.ts', 'const s = "anx\\u0069ety";')).toHaveLength(1);
  });
  it('ignores zero-width, soft-hyphen and exotic-space characters', () => {
    expect(words('a.ts', 'anx​iety')).toHaveLength(1);
    expect(words('a.ts', 'anx­iety')).toHaveLength(1);
    expect(words('a.ts', 'anx﻿iety')).toHaveLength(1);
    expect(words('a.ts', 'clinically proven')).toHaveLength(1);
    expect(words('a.ts', 'clinically proven')).toHaveLength(1);
    expect(words('a.ts', 'clinically​ 　proven')).toHaveLength(1);
  });
  it('sees through tags and JSX expressions that split a phrase', () => {
    expect(words('A.tsx', '<p>clinically <b>proven</b></p>')).toHaveLength(1);
    expect(words('A.tsx', '<p>{"clinically"} {"proven"}</p>')).toHaveLength(1);
  });
  it('lets honest copy through, with entities and tags', () => {
    expect(words('A.tsx', '<p>Press play &amp; sink into focus&#33;</p>')).toEqual([]);
  });
  it('has no in-source exemption: markers in any context exempt nothing', () => {
    expect(words('a.ts', '// claims-exempt: a test word\nconst w = "adhd";')).toHaveLength(1);
    expect(words('a.ts', '/* claims-exempt: x */\nconst w = "adhd";')).toHaveLength(1);
    expect(words('index.html', '<!-- claims-exempt: x -->\n<p>adhd</p>')).toHaveLength(1);
    expect(words('index.html', '<p>\n// claims-exempt: visible text\nanxiety\n</p>')).toHaveLength(1);
    expect(words('a.ts', 'const t = `\n// claims-exempt: visible text\nanxiety\n`;')).toHaveLength(1);
    expect(words('a.ts', 'const copy = "anxiety claims-exempt: why";')).toHaveLength(1);
    expect(words('a.ts', 'const w = "adhd"; // claims-exempt: a test word')).toHaveLength(1);
  });
  it('honours the reviewed allowlist, per file and phrase', () => {
    const allowed = new Set(['a.ts: adhd']);
    expect(words('a.ts', 'adhd', allowed)).toEqual([]);
    expect(words('a.ts', 'ADHD', allowed)).toEqual([]);
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

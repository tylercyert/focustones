import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Every visible string (text, aria-label, alt, title, window label) lives in src/content/strings.ts so the owner
// approves one file. This scans the windows' sources for text rendered from a literal instead.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'windows');

function sources(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) sources(p, out);
    else if (/\.tsx?$/.test(e.name) && !/\.test\./.test(e.name) && !e.name.endsWith('.d.ts')) out.push(p);
  }
  return out;
}

const FOUND = [
  { what: 'JSX text', re: />([^<>{}=;\n]+)</g, tsx: true },
  { what: 'JSX text before an expression', re: />([^<>{}=;:\n()]+)\{/g, tsx: true },
  { what: 'JSX text after an expression', re: /\}([^<>{}=;:\n()]+)</g, tsx: true },
  { what: 'text attribute', re: /\b(?:aria-label|aria-description|aria-valuetext|alt|title|placeholder)="([^"]+)"/g },
  { what: 'text attribute template', re: /\b(?:aria-label|alt|title)=\{`([^`]*)`\}/g },
  { what: 'window label', re: /\b(?:title|shortTitle|iconLabel):\s*['"]([^'"]+)['"]/g },
];

/** The literal text a source file would render, as `what "text"`. */
export function findLiterals(source, isTsx) {
  const text = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const found = [];
  for (const { what, re, tsx } of FOUND) {
    if (tsx && !isTsx) continue;
    for (const m of text.matchAll(re)) {
      const visible = m[1].replace(/\$\{[^}]*\}/g, '').trim();
      if (/[A-Za-z]/.test(visible) && !/^(?:=>|&&|\|\|)/.test(visible)) found.push(`${what} "${visible}"`);
    }
  }
  return found;
}

describe('visible copy', () => {
  it('finds literal text, labels and attributes in sources (the scanner itself)', () => {
    expect(findLiterals('<p>Hello {name}</p>', true)).toEqual(['JSX text before an expression "Hello"']);
    expect(findLiterals('<span>{n} Hz</span>', true)).toEqual(['JSX text after an expression "Hz"']);
    expect(findLiterals('<img alt="A picture" />', true)).toEqual(['text attribute "A picture"']);
    expect(findLiterals('<a aria-label={`Close ${x}`} />', true)).toEqual(['text attribute template "Close"']);
    expect(findLiterals("{ shortTitle: 'Sound' }", false)).toEqual(['window label "Sound"']);
    expect(findLiterals('<p>{strings.a.b}</p>', true)).toEqual([]);
  });

  it('has no string literal rendered outside src/content/strings.ts', () => {
    const files = sources(root);
    expect(files.length).toBeGreaterThan(10);
    const found = files.flatMap((f) => findLiterals(fs.readFileSync(f, 'utf8'), f.endsWith('.tsx')).map((x) => `${path.relative(root, f)}: ${x}`));
    expect(found).toEqual([]);
  });
});

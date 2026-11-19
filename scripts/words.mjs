// Honest words (focustones-ios ADR 0006 (honest words, no medical claims)): no medical claims in anything a visitor reads.
// The list is focustones-ios ADR 0006's, copied from its scripts/check-static.mjs.
import fs from 'node:fs';
import path from 'node:path';

export const CLAIMS = /\b(?:treat(?:s|ed|ing|ment|ments)?|cure[sd]?|curing|heal(?:s|ed|ing)?|therap(?:y|ies|eutic|ist)|adhd|anxiety|insomnia|depression|pain\s+relief|relieves?\s+pain|rewires?|hack\s+your\s+brain|clinically\s+proven|scientifically\s+proven|medically\s+proven)\b|\bIQ\b/i;

const TEXT = /\.(?:tsx?|css|html|json|svg|md)$/;
const isTest = (file) => /\.test\.[tj]sx?$/.test(file);

export function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

// Exemptions, only two ways: (1) a comment on its own line, `// claims-exempt: <why>` (or `/* */`, `{/* */}`, `<!-- -->`),
// which exempts the next line; (2) a row `path: phrase` in scripts/claims-allowlist.txt, which is reviewed like code.
// A marker anywhere else, such as inside copy or after code on the same line, exempts nothing.
const OWN_LINE_EXEMPT = /^\s*(?:\/\/|\/\*|\{\/\*|<!--)\s*claims-exempt:\s*\S/;
const keepNewlines = (m) => m.replace(/[^\n]/g, '');

// The text a reader would see: soft-wrapped phrases, adjacent string literals, escapes and entities become plain spaces.
// Newlines are kept in place so findings still point at the right line.
export function readable(text) {
  const lines = text.split('\n');
  const masked = lines.map((line, i) => (i > 0 && OWN_LINE_EXEMPT.test(lines[i - 1]) ? '' : line));
  return masked.join('\n')
    .replace(/["'`]\s*\+\s*["'`]/g, keepNewlines)
    .replace(/\{\s*["'`]\s*["'`]\s*\}/g, ' ')
    .replace(/\\[nrt]|&nbsp;|&#160;|&#xa0;| /gi, ' ');
}

export function scanText(name, text, allowed = new Set()) {
  const seen = readable(text);
  return [...seen.matchAll(new RegExp(CLAIMS, 'gi'))]
    .filter((hit) => !allowed.has(`${name}: ${hit[0].replace(/\s+/g, ' ').toLowerCase()}`))
    .map((hit) => `${name}:${seen.slice(0, hit.index).split('\n').length}: "${hit[0].replace(/\s+/g, ' ')}" is a medical claim word (focustones-ios ADR 0006)`);
}

export function loadAllowlist(file) {
  return new Set(fs.existsSync(file)
    ? fs.readFileSync(file, 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#')).map((l) => l.toLowerCase())
    : []);
}

export function claims(root) {
  const allowed = loadAllowlist(path.join(root, 'scripts/claims-allowlist.txt'));
  const files = [...walk(path.join(root, 'src')).filter((f) => TEXT.test(f) && !isTest(f)), path.join(root, 'index.html')];
  return files.filter((f) => fs.existsSync(f))
    .flatMap((f) => scanText(path.relative(root, f).split(path.sep).join('/'), fs.readFileSync(f, 'utf8'), allowed));
}

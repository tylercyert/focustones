// Honest words (focustones-ios ADR 0006 (honest words, no medical claims)): no medical claims in anything a visitor reads.
// The list is focustones-ios ADR 0006's, copied from its scripts/check-static.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { decodeHTML } from 'entities';

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

// The only exemption is scripts/claims-allowlist.txt: one `path: phrase` per line, the exact repo-relative path and the
// exact normalized phrase. Nothing written inside a source file can exempt itself, whatever language or context it is in.

// JS string escapes: \u{1F600}, \uXXXX, \xXX, \n \r \t, and a backslash-newline line continuation.
function decodeEscapes(text) {
  return text
    .replace(/\\u\{([0-9a-f]{1,6})\}/gi, (m, h) => (parseInt(h, 16) <= 0x10ffff ? String.fromCodePoint(parseInt(h, 16)) : m))
    .replace(/\\u([0-9a-f]{4})/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\x([0-9a-f]{2})/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\[nrtvf]/g, ' ')
    .replace(/\\\r?\n/g, '');
}

// The text a reader would see, lowercase, with one space between words: escapes and every HTML entity (named, decimal,
// hex, even double-encoded) decoded; adjacent string literals joined; tag names and JSX braces and quotes read as spaces;
// every Unicode space read as a space and every zero-width or soft-hyphen format character removed.
export function readable(text) {
  let out = text.replace(/["'`]\s*\+\s*["'`]/g, '');
  out = decodeEscapes(out);
  for (let i = 0; i < 5; i++) {
    const next = decodeHTML(out);
    if (next === out) break;
    out = next;
  }
  return out
    .replace(/<\/?[a-z][\w:-]*|\/?>/gi, ' ')
    .replace(/[{}"'`]/g, ' ')
    .replace(/\p{Cf}/gu, '')
    .replace(/[\p{White_Space}\p{Zs}᠎]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

export function scanText(name, text, allowed = new Set()) {
  return [...readable(text).matchAll(new RegExp(CLAIMS, 'gi'))]
    .filter((hit) => !allowed.has(`${name}: ${hit[0]}`))
    .map((hit) => `${name}: "${hit[0]}" is a medical claim word (focustones-ios ADR 0006)`);
}

export function loadAllowlist(file) {
  return new Set(fs.existsSync(file)
    ? fs.readFileSync(file, 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
      .map((l) => l.replace(/\s+/g, ' ').toLowerCase())
    : []);
}

export function claims(root) {
  const allowed = loadAllowlist(path.join(root, 'scripts/claims-allowlist.txt'));
  const files = [...walk(path.join(root, 'src')).filter((f) => TEXT.test(f) && !isTest(f)), path.join(root, 'index.html')];
  return files.filter((f) => fs.existsSync(f))
    .flatMap((f) => scanText(path.relative(root, f).split(path.sep).join('/'), fs.readFileSync(f, 'utf8'), allowed));
}

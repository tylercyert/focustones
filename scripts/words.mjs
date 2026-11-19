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

// Findings for one file's text. A line holding `claims-exempt: <why>` is let through.
export function scanText(name, text) {
  return text.split('\n').flatMap((line, i) => {
    if (/claims-exempt:/.test(line)) return [];
    return [...line.matchAll(new RegExp(CLAIMS, 'gi'))]
      .map((hit) => `${name}:${i + 1}: "${hit[0]}" is a medical claim word (focustones-ios ADR 0006)`);
  });
}

export function claims(root) {
  const files = [...walk(path.join(root, 'src')).filter((f) => TEXT.test(f) && !isTest(f)), path.join(root, 'index.html')];
  return files.filter((f) => fs.existsSync(f))
    .flatMap((f) => scanText(path.relative(root, f), fs.readFileSync(f, 'utf8')));
}

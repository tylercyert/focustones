#!/usr/bin/env node
// Usage: node scripts/check-static.mjs words | requests      Exit 0 clean, 1 findings printed.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { claims } from './words.mjs';
import { requests } from './requests.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const checks = { words: () => claims(root), requests: () => requests(path.join(root, 'dist')) };
const run = checks[process.argv[2]];
if (!run) { console.error('usage: check-static.mjs words|requests'); process.exit(2); }
const found = run();
if (found.length) { console.log(found.join('\n')); console.error(`CHECK FAILED: ${process.argv[2]}`); process.exit(1); }

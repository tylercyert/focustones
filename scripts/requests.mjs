// No third-party requests (docs/decisions/0004-no-third-party-requests.md): every http(s):// URL in the built output must
// be on this allowlist. The App Store, the privacy and support pages, and Apple's EULA are the only places the site may link.
import fs from 'node:fs';
import path from 'node:path';
import { walk } from './words.mjs';

export const ALLOWED = [
  /^https:\/\/apps\.apple\.com\//,
  /^https:\/\/tyl\.sh\/focustones\/(?:privacy|support)\/?$/,
  /^https:\/\/www\.apple\.com\/legal\/internet-services\/itunes\/dev\/stdeula\/?$/,
  // Strings inside React that are never fetched: SVG/MathML namespaces and the error-decoder text.
  /^http:\/\/www\.w3\.org\/(?:1998\/Math\/MathML|1999\/xhtml|1999\/xlink|2000\/svg|XML\/1998\/namespace)$/,
  /^https:\/\/react\.dev\/errors\//,
  /^https:\/\/react\.dev\/link\//,
];

const URL_RE = /https?:\/\/[^\s"'`<>)\\,;]+/g;
const TEXT = /\.(?:html|js|mjs|css|json|svg|webmanifest|txt|xml)$/;

export function scanText(name, text) {
  return [...text.matchAll(URL_RE)]
    .filter(([url]) => !ALLOWED.some((re) => re.test(url)))
    .map(([url]) => `${name}: ${url} is not on the allowlist (ADR 0004)`);
}

export function requests(dist) {
  if (!fs.existsSync(dist)) return [`${dist}: no build output; run vite build first`];
  return walk(dist).filter((f) => TEXT.test(f))
    .flatMap((f) => scanText(path.relative(dist, f), fs.readFileSync(f, 'utf8')));
}

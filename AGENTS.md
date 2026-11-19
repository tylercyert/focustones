# AGENTS.md

focustones.co: the free web trial and promotion site for the iOS app FocusTones: Binaural Beats. Vite + React 19 + TypeScript (strict), no backend, no third-party requests. Read `docs/product.md` first, then `CONTEXT.md`.

## Check

```sh
scripts/check.sh    # typecheck, ESLint, Vitest, vite build, banned words, outside requests, Playwright (Chromium, WebKit, Firefox)
```

Once per machine: `npx playwright install --with-deps chromium webkit firefox`. On a Linux box with no sound card the check starts a silent PulseAudio sink (`scripts/audio-sink.sh`; `apt install pulseaudio`), because headless Firefox cannot start audio without one. WebKit stands in for Safari: the `webkit-iphone` project is iOS Safari's touch, layout and audio route.

Other scripts: `scripts/shots.mjs <dir>` (design-pass screenshots at every evidence size), `scripts/lighthouse.sh [dir]` (Lighthouse mobile and desktop on the build), `scripts/og-image.mjs` (the link-preview image), `scripts/make-icons.sh` and `scripts/make-images.sh` (icons and AVIF/WebP sizes).

Run `scripts/check.sh` on the exact head before every push and paste its output in the PR. There is no CI.

## Branches and deploys

- **`main` is production**: Vercel deploys focustones.co from it. Never push to `main` or open a PR against it.
- All revamp work branches from `revamp`, goes through a PR into `revamp`, and merges after an independent review. `revamp` reaches `main` only after the owner approves the preview.
- Other branches get a Vercel preview. Keep history: no force-push, no rewrite.
- Public repo: no secrets, no personal paths, no private data in commits or PRs.

## Layout

- `src/engine/`: audio, framework-free (no React, no DOM beyond Web Audio).
- `src/desktop/`: the shell (menu bar, windows, icons). `types.ts` holds `WindowSpec`; `registry.ts` lists every window. `theme.css` holds the look's tokens: the desktop pattern and colours, platinum greys, highlight and the Listen display.
- `src/windows/<id>/`: one folder per window; add its spec to the registry.
- `src/content/strings.ts`: every visible string, so the owner approves one file. The page's head (title, description, preview card) comes from its `meta` section, written into `index.html` at build time by `vite-plugin-head.ts`.
- `public/`: self-hosted assets only. Everything in it needs a known licence.
- `scripts/`: the check. `docs/decisions/`: ADRs.

## Rules (from `docs/product.md`)

- No medical claims; the banned-word check (`scripts/words.mjs`) decodes entities and escapes, ignores zero-width characters and collapses whitespace, then matches over `src/` and `index.html`. Nothing in a source file can exempt itself: the only exemption is an exact `path: phrase` row in `scripts/claims-allowlist.txt`, which needs the owner's yes. See focustones-ios ADR 0006.
- No analytics, trackers, cookies, accounts or third-party requests; fonts, scripts and images are self-hosted. Outbound links are only the App Store, the privacy policy, support and Apple's EULA. See ADR 0004.
- The orb never flashes at the beat rate and stills with Reduce Motion.
- Public words are the owner's: reuse approved copy, and list every new visible string for the owner's batch approval.
- Classic Mac OS look, drawn from scratch: no Apple logo, fonts, icons or artwork.

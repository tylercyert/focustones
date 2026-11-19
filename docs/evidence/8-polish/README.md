# #8 Launch polish: evidence

Screenshots by `scripts/shots.mjs` (Playwright Chromium, `vite preview`, clock fixed at 9:41, first-visit startup skipped). `before/` is this branch after its first two commits (the engine fix and the head tags, no design change: the look as #5 and #6 left it); `after/` is this PR's head. Every file name is `<view>-<width>x<height>.png`. Views: `landing-light`, `landing-dark` (dark OS setting), `playing`, `playing-motion` (Reduce Motion off, mid-breath), `tune`, `get`, `about-sound`, `empty-desktop`, `menu`, `keyboard` (nine Tabs from the top of the page). All views except `playing-motion` run with Reduce Motion on.

## The owner's direction (via the coordinator, 2026-11-19)

> "the colors are not hitting the nostalgia for me. it should be mac inspired background"
>
> "period correct"

## What changed, and why

| Before | After |
| --- | --- |
| Warm brown-grey desktop | Blue-violet desktop (`#6767c8`) with an original sparse diagonal dither (two light pixels and one dark pixel per 4×4 cell), drawn in CSS |
| Gradient menu bar, gradient boxes, soft 3 px shadows | Flat platinum (`#dddddd`) with period bevels: white top-left, `#888` bottom-right, 1 px black outlines, 1 px hard shadows; no gradients, blur or rounded cards in the chrome |
| 24 px title bars, pinstripes on every window | 20 px title bars; etched pinstripes on the active window only; inactive titles and boxes go grey |
| Black menu highlight | Blue-violet highlight (`#3a3aa0`, white text 8.6:1) |
| White icon labels with a drop shadow | Black labels on a white box; selected, the box inverts and the icon darkens |
| Trash in its own column at 1280×800 | One icon column with the Trash bottom-right, at every size |
| All-dark window interiors with rounded modern cards | Platinum interiors: a bevel-button palette for the bands (band colour on each swatch), radio buttons for Timer and Mode, push buttons, etched group boxes, white sunken wells for the QR code, prices and the sound diagram |
| Gold round Play button | A period default button (thick ring) with the glyph and its label |
| Orb in a dark window | Orb in a dark inset display, the one place modern rendering (the glow) lives |
| Orb edge stair-stepped at 1× (`image-rendering: pixelated` inherited from `.desktop`) | Smooth at 1× (test: `the orb › is drawn smooth, never pixelated, at 1×`), supersampled 2× |
| 768×1024: Get FocusTones ran off-screen and covered the icons | Launch windows fit the surface and keep clear of the icon column (`fitToSurface`, unit-tested) |
| Dark startup screen | A platinum welcome box on the desktop pattern |

Tokens: `src/desktop/theme.css`. The Desktop Patterns control panel (#14) swaps `--desk-pattern`, `--desk-base`, `--desk-a`, `--desk-b` (and the label colours) on `.desktop` or `:root`.

## Pairs

| View | Before | After |
| --- | --- | --- |
| Landing, 1280×800 | ![](before/landing-light-1280x800.png) | ![](after/landing-light-1280x800.png) |
| Landing, 375×812 | ![](before/landing-light-375x812.png) | ![](after/landing-light-375x812.png) |
| Landing, 390×844 | ![](before/landing-light-390x844.png) | ![](after/landing-light-390x844.png) |
| Landing, 768×1024 | ![](before/landing-light-768x1024.png) | ![](after/landing-light-768x1024.png) |
| Landing, 1920×1080 | ![](before/landing-light-1920x1080.png) | ![](after/landing-light-1920x1080.png) |
| Dark OS, 1280×800 | ![](before/landing-dark-1280x800.png) | ![](after/landing-dark-1280x800.png) |
| Playing, 375×812 | ![](before/playing-375x812.png) | ![](after/playing-375x812.png) |
| Tune, 1280×800 | ![](before/tune-1280x800.png) | ![](after/tune-1280x800.png) |
| Get FocusTones, 375×812 | ![](before/get-375x812.png) | ![](after/get-375x812.png) |
| About the sound, 1280×800 | ![](before/about-sound-1280x800.png) | ![](after/about-sound-1280x800.png) |
| Menu, 1280×800 | ![](before/menu-1280x800.png) | ![](after/menu-1280x800.png) |
| Keyboard focus, 1280×800 | ![](before/keyboard-1280x800.png) | ![](after/keyboard-1280x800.png) |
| Keyboard focus, 375×812 | ![](before/keyboard-375x812.png) | ![](after/keyboard-375x812.png) |

Dark OS: the site keeps its look (`color-scheme: light`); `landing-dark-*` match `landing-light-*` at every size.

## Other engines

`engines/` holds Play pressed and playing in WebKit as an iPhone 13 (touch, iOS user agent, so the media-element route), WebKit as desktop Safari, and Firefox, at the moment the status reads "Playing".

## Link preview

`og-1200x630.png` is `public/og.png`, rendered from the real built desktop with Listen open by `scripts/og-image.mjs`.

## Lighthouse

`lighthouse/` holds the reports (`scripts/lighthouse.sh`, Lighthouse 13.6.0, Playwright's Chromium, `vite preview` of the build):

| | Performance | Accessibility | Best Practices | SEO |
| --- | --- | --- | --- | --- |
| Mobile | 99 | 100 | 100 | 100 |
| Desktop | 100 | 100 | 100 | 100 |

Mobile: FCP 1.4 s, LCP 1.4 s, TBT 110 ms, CLS 0, Speed Index 2.0 s. Desktop: FCP 0.2 s, LCP 0.2 s, TBT 0 ms, CLS 0, Speed Index 0.6 s. Mobile Performance varies between runs on this shared machine; five runs on the final code scored 96, 98, 98, 98 and 99.

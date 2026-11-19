# Assets

Everything in `public/` is self-hosted and has a known licence (ADR 0004). The other icons are drawn in code for this site (`src/desktop/icons.tsx`); no Apple artwork, logo or font is used (ADR 0002).

| File | What | Source | Licence |
| --- | --- | --- | --- |
| `public/fonts/pixelify-sans-latin-400-normal.woff2`, `…-700-normal.woff2` | Pixelify Sans, Latin subset, regular and bold: the bitmap-style interface font | Pixelify Sans Project Authors, via the `@fontsource/pixelify-sans` 5.3.0 package | SIL OFL 1.1 (`docs/licenses/PixelifySans-OFL.txt`) |
| `public/icons/app-64.png`, `app-128.png`, `app-256.png` | The FocusTones app icon (gold orb on ink), downscaled from the approved marketing icon (`focustones-ios` `docs/marketing/web/icon.png`) for the menu bar, icons and startup | Own work (the app's icon) | Own work |
| `public/frames/*.webp` | The app's App Store frames (`focustones-ios` `docs/marketing/kit/frames/01…05`: Listen, Tune, Timer, Mixes, Progress), resized to 640 px wide and converted to WebP (ImageMagick) | Own work (the app's marketing) | Own work |
| `public/frames/layers.webp` | Crop (layer, layer level, brightness) of the app's Tune capture (`focustones-ios` `docs/marketing/store/1.0/captures/05-tune-layer.png`), resized to 640 px wide (ImageMagick); no caption | Own work (the app's marketing) | Own work |
| `public/badges/app-store-black.svg` | Apple's official "Download on the App Store" black badge, US-UK, as already self-hosted by `apps-tyl-sh` (`public/badges/app-store-black.svg`; Apple App Store Marketing Tools, 2026-10-27), used unaltered and linking to the app's App Store page | Apple's App Store Marketing Artwork License Agreement and App Store marketing guidelines | Apple Inc. |
| `public/favicon.svg` | Site icon | Existing in this repo | Own work |

Body text inside windows uses the system UI font stack (nothing is downloaded); Pixelify Sans is used only for the menu bar, window titles, icon labels and the phone window tabs.

The QR code on the Get FocusTones window is not a file: `vite-plugin-qr.ts` generates it at build time (`qrcode-generator`, MIT) from the campaign link.

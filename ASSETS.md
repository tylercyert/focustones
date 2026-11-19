# Assets

Everything in `public/` is self-hosted and has a known licence (ADR 0004). The other icons are drawn in code for this site (`src/desktop/icons.tsx`); no Apple artwork, logo or font is used (ADR 0002).

| File | What | Source | Licence |
| --- | --- | --- | --- |
| `public/fonts/pixelify-sans-latin-400-normal.woff2`, `…-700-normal.woff2` | Pixelify Sans, Latin subset, regular and bold: the bitmap-style interface font | Pixelify Sans Project Authors, via the `@fontsource/pixelify-sans` 5.3.0 package | SIL OFL 1.1 (`docs/licenses/PixelifySans-OFL.txt`) |
| `public/icons/app-64.png`, `app-128.png`, `app-256.png` | The FocusTones app icon (gold orb on ink), downscaled from the approved marketing icon (`focustones-ios` `docs/marketing/web/icon.png`) for the menu bar, icons and startup | Own work (the app's icon) | Own work |
| `public/favicon.svg` | Site icon | Existing in this repo | Own work |

Body text inside windows uses the system UI font stack (nothing is downloaded); Pixelify Sans is used only for the menu bar, window titles, icon labels and the phone window tabs.

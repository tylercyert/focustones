# focustones.co

The free web trial and promotion site for [FocusTones: Binaural Beats](https://apps.apple.com/app/id6834913847), the iPhone app. Visitors press Play in a browser window and hear a tone fade in, with no account and no time limit, and can follow a link to the app. It is a classic Mac OS–style desktop, built with Vite, React 19 and TypeScript, with all sound generated in the browser by the Web Audio API.

The site is being rebuilt (see `docs/product.md`); the current build is a placeholder desktop.

## Run

```sh
npm install
npm run dev        # dev server on http://localhost:5173
npm run build      # production build into dist/
npm run preview    # serve the production build
```

## Check

```sh
scripts/check.sh   # typecheck, ESLint, Vitest, build, banned words, outside requests
npm run test:e2e   # Playwright (Chromium) smoke test; needs a build first and `npx playwright install chromium`
```

## Notes

- No analytics, cookies, accounts or third-party requests.
- Production deploys from `main`; work happens on `revamp`. See `AGENTS.md`.
- This repository has no licence file, so all rights are reserved.

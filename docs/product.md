# focustones.co

**Status:** adopting <!-- set to onboarded by the adopt PR -->
**Origin:** adopted 2026-11-19. This repo was the FocusTones web app (a Windows 98–style desktop, archived 2026-04). It now becomes the free web trial and promotion site for the iOS app **FocusTones: Binaural Beats** (`tylercyert/focustones-ios`, live on the App Store since 2026-11-19, app id `6834913847`).

> **Core loop:** A visitor lands on focustones.co, presses Play in the Listen window and hears a beat fade in within seconds. While it plays they explore a classic Mac–style desktop, find what the iPhone app adds, and get it from the App Store (badge on iPhone, QR code on a computer).

| | |
| --- | --- |
| **Audience** | People who focus with sound at a desk, often arriving from a search for "binaural beats online", plus anyone the iOS app's marketing sends here. |
| **Job of the site** | 1) A real, free, unlimited trial of the app's free set in the browser. 2) Show and link the real iOS app so visitors install it. |
| **Understood in 10 seconds** | A warm-gray classic desktop, one open window (Listen) with the glowing orb, the band, one big Play button, and a "Get the iPhone app" window beside it. |
| **First win** | Play pressed → tone fades in over 3 s and the orb breathes. One tap/click from landing, no sign-up. |
| **Conversion** | App Store badge (iPhone/iPad visitors), a QR code that opens the App Store page (computer visitors), and Safari's Smart App Banner. Every link carries a campaign token (`ct=focustones-co`, `pt` per Apple's campaign-link rules). |

## Decided

- 2026-11-19 · **Revamp as a free trial that promotes the app, in this repo, cleaned up** · Owner: "Next up is going to be revamping the focustones.co site to be a free trial that promotes the app. I want to keep the operating system within the browser feel but have it promote the real app. This should revive the existing repo that is archived. its set to be public so it should be cleaned up." The repo was unarchived 2026-11-19; history is kept (it holds no secrets: a full `git log -p` scan found none).
- 2026-11-19 · **Classic Mac OS look** · Owner, choosing the desktop style: "Old MacOS style since its an apple app". Classic Mac OS 8/9 ("Platinum")–era feel: menu bar, striped title bars, collapse (windowshade), close and zoom boxes, desktop icons, a Trash. Drawn from scratch: no Apple logo, no Apple fonts, icons or artwork copied, and no claim of Apple's endorsement. Inside the windows, FocusTones' own palette and band colors (`focustones-ios/docs/design/DESIGN.md`).
- 2026-11-19 · **Free trial = the app's free set, unlimited** · Owner chose "App's free set, unlimited": the five band presets (Deep Work, Peak, Daydream, Calm Focus, Deep Sleep), any timer, Headphones (binaural) or Speaker (isochronic) mode, playable with no time limit, no account. Everything Pro in the app (fine tuning, layers, the preset library, saved mixes, Programs, full Progress) and the iPhone-only things (Lock Screen, Control Center, widget, Dynamic Island, Siri) appear as windows that show the real app and link to it.

## Rules carried from the app (they apply to every word and pixel here)

- **No medical claims** (`focustones-ios` ADR 0006 and its banned-word list): the site sells an instrument and a ritual, never an outcome. The old README's claims ("brainwave entrainment", "deep sleep, recovery", "memory") go.
- **The orb never flashes at the beat rate** and stills with Reduce Motion (`focustones-ios` ADR 0005).
- **No analytics, trackers, cookies, accounts, or third-party requests** (fonts, scripts, images all self-hosted) (`focustones-ios` ADR 0004). The only outbound links are the App Store, the privacy policy and support.
- **Public words are the owner's.** Reuse approved text where it fits (`focustones-ios/docs/marketing/store/1.0/copy.md`, approved 2026-11-17 on focustones-ios#104; `docs/marketing/web/page.md`). Every new visible string is listed for the owner's one batch approval before production.
- **`main` deploys focustones.co** (Vercel Git integration, project `tylers-projects-f98a0936/focustones`; every other branch gets a preview). All revamp work lands on the `revamp` branch through PRs; `revamp` merges to `main` only after the owner's yes on the preview.

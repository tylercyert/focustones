# 0004. No third-party requests

- **Date:** 2026-11-19
- **Status:** accepted
- **The owner:** the app's rule (`focustones-ios` ADR 0004, data stays on the device) applies to the site: no analytics, trackers, cookies or accounts.

## Context

The site is a public page for a privacy-first app. A font, script or image fetched from another host would leak every visitor's address to it.

## Decision

Fonts, scripts, images and sound are self-hosted in `public/` or bundled. The only outbound links are the App Store (`apps.apple.com`), the app's privacy and support pages on `tyl.sh/focustones/`, and Apple's standard EULA. `scripts/check.sh` fails on any other `http(s)://` URL in the built output; the only exceptions are namespace and error-message strings inside React that are never fetched (listed in `scripts/requests.mjs`).

## Consequences

Adding a link or an external asset means a new ADR that extends the allowlist, with the owner's yes.

## Revisit when

The owner wants analytics or an embed.

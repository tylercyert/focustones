#!/usr/bin/env bash
# The gate: run before every push. No CI budget; this is the check. Exit 0 only when every step passes.
# Needs Playwright's browsers once per machine: npx playwright install --with-deps chromium webkit firefox.
set -euo pipefail
cd "$(dirname "$0")/.."
step() { printf '\n== %s\n' "$1"; }

step "typecheck"; npx tsc -b
step "eslint"; npx eslint .
step "vitest"; npx vitest run
step "vite build"; npx vite build
step "banned words (src/, index.html)"; node scripts/check-static.mjs words
step "outside requests (dist/)"; node scripts/check-static.mjs requests
step "playwright (Chromium, WebKit, Firefox)"; scripts/audio-sink.sh; npx playwright test --reporter=line
printf '\nCHECK PASSED\n'

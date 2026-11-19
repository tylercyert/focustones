#!/usr/bin/env bash
# Lighthouse (mobile and desktop) on the built site through `vite preview`, with Playwright's Chromium (#8).
# Usage: npx vite build && scripts/lighthouse.sh [out dir]      Prints the four category scores for each run.
set -euo pipefail
cd "$(dirname "$0")/.."
out="${1:-docs/evidence/8-polish/lighthouse}"
port="${FT_LH_PORT:-4397}"
mkdir -p "$out"
export CHROME_PATH="${CHROME_PATH:-$(node -e "console.log(require('@playwright/test').chromium.executablePath())")}"
npx vite preview --port "$port" --strictPort >/dev/null 2>&1 &
server=$!
trap 'kill $server 2>/dev/null || true' EXIT
for i in $(seq 50); do curl -sf "http://localhost:$port/" >/dev/null && break; sleep 0.2; done
for preset in mobile desktop; do
  flags=(); [[ $preset == desktop ]] && flags=(--preset=desktop)
  npx -y lighthouse@13.6.0 "http://localhost:$port/" "${flags[@]}" --chrome-flags="--headless=new --no-sandbox" \
    --output=json --output=html --output-path="$out/$preset" --quiet
  node -e "const r=require(require('path').resolve('$out/$preset.report.json'));const c=r.categories;console.log('$preset:',['performance','accessibility','best-practices','seo'].map(k=>c[k].title+' '+Math.round(c[k].score*100)).join(' | '))"
done

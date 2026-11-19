#!/usr/bin/env bash
# Makes the site's favicons and touch icon from the app icon (1024×1024 PNG, focustones-ios docs/marketing/web/icon.png).
# Usage: scripts/make-icons.sh <path to icon.png>      Needs ImageMagick 7 (magick).
set -euo pipefail
src="${1:?usage: scripts/make-icons.sh <icon.png>}"
cd "$(dirname "$0")/.."
strip=(-strip -define png:exclude-chunks=date,time)
magick "$src" -resize 180x180 "${strip[@]}" public/apple-touch-icon.png
magick "$src" -resize 32x32 "${strip[@]}" public/icons/favicon-32.png
magick "$src" \( -clone 0 -resize 16x16 \) \( -clone 0 -resize 32x32 \) \( -clone 0 -resize 48x48 \) -delete 0 public/favicon.ico
for n in 64 128 256; do magick "$src" -resize ${n}x${n} "${strip[@]}" public/icons/app-$n.png; done
ls -l public/apple-touch-icon.png public/favicon.ico public/icons/

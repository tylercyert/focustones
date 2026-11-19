#!/usr/bin/env bash
# Makes the AVIF and WebP sizes the windows serve (#8): the feature frames at 320 and 640 px wide (from the committed
# public/frames/*.webp), and the app icon at 64, 128 and 256 px (from public/icons/app-256.png, see make-icons.sh).
# Usage: scripts/make-images.sh      Needs ImageMagick 7 (magick) with AVIF and WebP.
set -euo pipefail
cd "$(dirname "$0")/.."
for f in tune layers mixes progress timer; do
  src="public/frames/$f.webp"
  for w in 320 640; do
    magick "$src" -resize "${w}x" -strip -quality 55 "public/frames/$f-$w.avif"
    magick "$src" -resize "${w}x" -strip -quality 78 "public/frames/$f-$w.webp"
  done
done
for n in 64 128 256; do
  magick public/icons/app-256.png -resize "${n}x${n}" -strip -quality 60 "public/icons/app-$n.avif"
  magick public/icons/app-256.png -resize "${n}x${n}" -strip -quality 82 "public/icons/app-$n.webp"
done
ls -l public/frames public/icons

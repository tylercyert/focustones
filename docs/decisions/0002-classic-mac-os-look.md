# 0002. Classic Mac OS look

- **Date:** 2026-11-19
- **Status:** accepted
- **The owner:** "Old MacOS style since its an apple app"

## Context

The product keeps the operating-system-in-the-browser feel but promotes an Apple app.

## Decision

The desktop follows the classic Mac OS 8/9 ("Platinum") era: menu bar, striped title bars, collapse, close and zoom boxes, desktop icons, a Trash. Everything is drawn from scratch: no Apple logo, fonts, icons or artwork copied, and no claim of Apple's endorsement. Inside windows, FocusTones' own palette and band colors (`focustones-ios/docs/design/DESIGN.md`).

## Consequences

The shell issue builds the chrome in CSS and SVG with no borrowed assets.

## Revisit when

The owner picks a different look.

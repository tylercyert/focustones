# 0003. Free trial = the app's free set, unlimited

- **Date:** 2026-11-19
- **Status:** accepted
- **The owner:** chose "App's free set, unlimited" for what the web trial offers.

## Context

The site must be a real trial of the app without giving away the paid product (`focustones-ios` ADR 0003, freemium with an honest paywall).

## Decision

The site plays the app's Free set with no time limit and no account: the five band presets (Deep Work, Peak, Daydream, Calm Focus, Deep Sleep), any timer, Headphones (binaural) or Speaker (isochronic) mode. Everything Pro (fine tuning, layers, the preset library, saved mixes, Programs, full Progress) and the iPhone-only things (Lock Screen, Control Center, widget, Dynamic Island, Siri) appear as windows that show the real app and link to it.

## Consequences

The Listen window never needs a paywall. Windows about Pro are promotion, and say what is in the app, not what the site does.

## Revisit when

The app's free set changes, or the owner changes the trial.

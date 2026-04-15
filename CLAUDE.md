# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FocusTones is a binaural beat generator web app with a Windows 98 retro theme. It generates real-time audio using the Web Audio API and renders an interactive 3D sphere visualization with Three.js. No backend -- everything runs client-side with localStorage persistence.

## Commands

```bash
npm run dev          # Start Vite dev server (default port 5173)
npm run build        # TypeScript check + Vite production build
npx tsc -b --noEmit  # Type check only (no emit)
npx eslint src/      # Lint all source files
npm run preview      # Preview production build locally
npm run host:dev     # Dev server exposed on 0.0.0.0:3000 (LAN access)
```

Docker: `npm run docker:build` then `npm run docker:run` (serves on port 3000 via nginx).

There is no test suite.

## Architecture

### Data Flow

```
User Interaction → React Component → Zustand State (+ localStorage) → useEffect in App.tsx → Audio Engines → Web Audio API → Speakers
```

`App.tsx` is the orchestrator. It reads Zustand state, syncs it to the two audio engine singletons via `useEffect`, and manages all modal open/close state. Modals are rendered via `createPortal` to `document.body`.

### Audio Layer (`src/audio/`)

Two singleton class instances, **not** React components:

- **`audioEngine`** (`BinauralEngine`) -- Creates two oscillators (left/right ear) panned to stereo extremes. The frequency difference between them produces the binaural beat. Key methods: `start()`, `stop()`, `tune()`. Manages its own `AudioContext`, gain nodes, and fade timing.
- **`overlayAudioEngine`** (`OverlayAudioEngine`) -- White noise generator using a looping `AudioBufferSourceNode` through a `BiquadFilterNode` (low-pass). Independent volume/filter controls.

Both engines use 1-second fade-in/out to avoid audio clicks. The binaural engine caps gain at -6 dB.

### State (`src/state/`)

- **`appState.ts`** -- Single Zustand store. Every setter writes to `localStorage` under `focustones_` prefix. `BAND_RANGES` defines the five brainwave bands with min/max/default offset frequencies and colors. This constant is imported throughout the app for band configuration.
- **`presets.ts`** -- Preset system with URL-based sharing (base64 encoded). Built-in presets exist but are not yet exposed in UI.

### Visualization (`src/components/SphereViz.tsx`)

Three.js scene initialized in a single `useEffect` (runs once). Uses refs (`stateRef`) to pass React state into the animation loop without re-initializing the scene. Two wireframe spheres with custom GLSL vertex shaders for displacement, plus a particle cloud. The sphere is clickable (raycaster) to toggle playback.

**Important pattern**: The animation loop reads from `stateRef.current` (mutated by separate `useEffect` hooks), not from React state directly. This avoids re-creating the Three.js scene on every state change.

### UI Theme (`src/index.css`)

Windows 98 CSS system. All styling uses `win98-*` class names (e.g., `win98-btn`, `win98-window`, `win98-titlebar`, `win98-slider`). The beveled border effect uses the classic 4-color border trick (`border-color: highlight dark-shadow dark-shadow highlight` + `box-shadow: inset`). Retro blog styles use `retro-*` classes.

### Key Conventions

- Band colors are defined in two places: `BAND_RANGES` in `appState.ts` (authoritative) and `BAND_COLORS` in `utils/colors.ts` (used by Three.js). Keep them in sync.
- Window events (`openSettings`, `openAbout`, `openBlog`) bridge between the brainwave selector component and App.tsx modal state, since the selector doesn't have direct access to modal setters.
- The `toggle()` function in App.tsx reads state from `useAppState.getState()` (not hook values) to avoid stale closures.

### Unused Features (implemented but not exposed in UI)

- `waveform` selection (sine vs triangle) -- state exists, audio engine supports it
- `timerMinutes` / `scheduleStopAfterMinutes()` -- state and engine method exist
- `reduceMotion` -- state exists, SphereViz uses it to halve animation amplitude
- Preset system with URL sharing -- full implementation in `presets.ts`

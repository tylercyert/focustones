# FocusTones web engine

The free set in the browser: binaural (Headphones) and isochronic (Speaker) tones for the five band presets. A port of
the iOS app's `Core/Engine` (Tone, Fade, EngineRenderer, Levels, Limits) and `Catalog`'s free presets. Framework-free:
nothing here imports React.

| File | What it is |
| --- | --- |
| `dsp.ts` | The pure DSP: `EngineRenderer`, `Fade`, `pulse`, `limit`, `FREE_PRESETS`. No DOM or Web Audio types; runs in the worklet and in Node tests. |
| `worklet-processor.ts` | The `AudioWorkletProcessor` that calls `EngineRenderer.render` for every quantum. Page code never imports it (Vite bundles it via `?worker&url`). |
| `protocol.ts` | The processor's name, options and message types, shared by page and worklet. |
| `engine.ts` / `index.ts` | `FocusEngine`: the typed API and the browser quirks. |

## API

```ts
import { FocusEngine, FREE_PRESETS, modeForOutput } from "./engine";

const engine = new FocusEngine();
engine.on("state", (s) => {});  // idle | starting | playing | paused | ended | error
engine.on("time", (seconds) => {}); // timer left (null: no timer); ~4×/s while playing
engine.on("preset", (p) => {});

button.onclick = () => engine.start("deep-work"); // from a click or tap: iOS unlocks audio only there; also switches preset if already playing
engine.setPreset("peak");              // glides, no click
engine.setMode(modeForOutput("speaker")); // headphones → binaural, speaker → isochronic
engine.setVolume(0.7);                 // 0…1, squared under a −6 dBFS ceiling
engine.setTimer(25 * 60);              // fades out over its last 30 s, then state "ended"; null clears it
engine.pause();                        // 1.5 s fade, then the context suspends; the timer holds
```

Presets (carrier / beat): Deep Sleep 180 / 2, Daydream 220 / 6, Calm Focus 220 / 10, Deep Work 220 / 16, Peak 220 / 40.
Calling `start()` again while a start is loading joins it. Start fades in over 3 s, pause out over 1.5 s. A timer under 30 s fades in for a short rise, then out until it ends.
The timer's fade-out is its own envelope, so changing or clearing the timer mid-fade brings the sound back (1 s).

## No allocation in the worklet's `process`

`process` does two things: it calls `EngineRenderer.render` and returns `true`. `render` creates no objects, arrays,
closures or tuples: all state is number fields on the renderer and its two `Fade`s, plus the output arrays the browser
passes in; the per-sample helpers (`pulse`, `limit`) take and return numbers. `process` also posts no messages: the
worklet never talks to the page on its own. The page learns a timer has run out from the audio clock
(`ctx.currentTime`), not from the worklet. Controls arrive as messages between quanta and each handler only assigns
numbers (the browser allocates the incoming message object itself, outside `process`). Phases are doubles, so hours of
play do not drift. Keep it that way: a new feature in `render` takes fields, not objects.

## Browser behaviour

- **iOS unlock:** `start()` creates the `AudioContext`, calls `resume()` and starts the media element synchronously,
  before its first `await` (the worklet loads afterwards), so both run inside the user's gesture. A test records the
  order on a cold start.
- **Silent switch:** on iOS the worklet feeds a `MediaStreamAudioDestinationNode` played through an `<audio>` element
  created in that same gesture (media playback, not muted by the ringer switch), and `navigator.audioSession.type = "playback"` is set where
  Safari has it. Elsewhere the node connects to the speakers directly.
- **Backgrounding:** the timer counts samples in the worklet, so throttled tabs keep time. When the tab is visible
  again and playback is wanted, a suspended or interrupted context is resumed.
- **Media Session:** title is the preset's name, artist "FocusTones", play and pause handlers.
- **Sample rate:** whatever the device runs (44.1 or 48 kHz are tested); nothing assumes one.
- **Headphones vs speaker:** a page cannot tell them apart, so the default is binaural (Headphones) and the UI offers
  the switch; `modeForOutput` maps the two names to a mode.

## Tests

`npm test` runs the Vitest DSP tests (`dsp.test.ts`): frequency per ear within 0.01 Hz, isochronic pulse rate, fade
curves, the limiter ceiling, no step on a preset, mode or volume change, timer behaviour, and identical output at any
quantum size, and timer edits during the final fade. `npm run test:e2e` runs Playwright in Chromium (`e2e/`): the real worklet through an
`OfflineAudioContext` for both modes at 44.1 and 48 kHz, plus `FocusEngine` start, preset change, pause and timer end
in real time, and control-lifecycle specs (`e2e/lifecycle.spec.ts`): start/pause/start, repeated and concurrent
starts, `start(preset)` while playing and paused, mode and preset switches, timer set/changed/cleared, and the cold iOS
unlock order, and returning to the foreground after a timer expired (both output routes).

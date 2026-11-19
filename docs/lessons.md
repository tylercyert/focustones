# Lessons

One row per lesson that took more than one approach to learn. Newest first.

| Date | Issue | Lesson |
| --- | --- | --- |
| 2026-11-19 | #14 | Synthetic gestures and allocation counts missed lifecycle behavior (PR #16 review): green journeys bypassed the browser's touch cancellation and counted audio starts without checking aggregate output, mute, teardown or cross-layout persistence. Drive touch through the browser's own input (CDP `Input.dispatchTouchEvent`), resize across the phone breakpoint, Tab through modals, and render audio offline to measure peaks, mute and disconnects. Chrome's compressor adds makeup gain; two `OfflineAudioContext.suspend` calls at the same time reject quietly. |
| 2026-11-19 | #8 | WebKit holds `play()` on an `<audio>` fed by a MediaStream until the stream carries audio. Build and connect the source before awaiting `play()` (call it inside the gesture, await it after), or a start never finishes. Chromium resolves at once, so only a WebKit run shows it. |
| 2026-11-19 | #8 | Headless Firefox on a Linux box with no audio server never starts an AudioContext (resume() stays pending). Give the machine a null PulseAudio sink (`scripts/audio-sink.sh`); no Firefox pref fixes it. |
| 2026-11-19 | #8 | `image-rendering: pixelated` on a container is inherited: it made the orb's canvas stair-stepped at 1×. Set `image-rendering` on the element that needs it, never on a shell-wide ancestor. |
| 2026-11-19 | #8 | A canvas animation that redraws gradients every frame turns into 50–90 ms long tasks on a throttled phone and costs Lighthouse its TBT. Draw still layers once and composite with `drawImage`; drop the frame rate when nothing visible moves fast. |
| 2026-11-19 | #8 | Playwright 1.65's Firefox crashes the page on `locator.evaluateAll` under a role locator; evaluate each element instead. |

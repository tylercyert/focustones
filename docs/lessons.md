# Lessons

One row per lesson from a review or a change that took more than one approach (develop-idea step 7).

| Date | Issue / PR | Cause class | What happened | Watch |
| --- | --- | --- | --- | --- |
| 2026-11-19 | #14 / #16 | Synthetic gestures and allocation counts missed lifecycle behavior | Green journeys bypassed browser touch cancellation and counted audio starts without checking aggregate output, mute, teardown or cross-layout persistence. | Drive touch through the browser's own input (CDP `Input.dispatchTouchEvent`), resize across the phone breakpoint, Tab through modals, and render audio offline to measure peaks, mute and disconnects. A compressor in Chrome adds makeup gain; two `OfflineAudioContext.suspend` calls at the same time reject quietly. |

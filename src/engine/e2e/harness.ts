// Test page for the Playwright spec: renders the real AudioWorklet through an OfflineAudioContext.
import { createToneNode, FocusEngine } from "../engine";
import type { EngineSettings } from "../dsp";

export interface Rendered {
  left: Float32Array;
  right: Float32Array;
  sampleRate: number;
}

async function renderOffline(settings: EngineSettings, seconds: number, sampleRate: number) {
  const ctx = new OfflineAudioContext(2, Math.round(seconds * sampleRate), sampleRate);
  // startFade 0.005: full level at once, so the whole buffer is steady tone.
  const node = await createToneNode(ctx, { settings, startFade: 0.005, timer: null });
  node.connect(ctx.destination);
  const buffer = await ctx.startRendering();
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  const crossings = (x: Float32Array) => {
    const ups: number[] = [];
    for (let i = 1; i < x.length; i++) if (x[i - 1] < 0 && x[i] >= 0) ups.push(i - 1 + -x[i - 1] / (x[i] - x[i - 1]));
    return ((ups.length - 1) * sampleRate) / (ups[ups.length - 1] - ups[0]);
  };
  const minGap = Math.floor((0.2 / settings.beat) * sampleRate);
  let run = 0;
  let gaps = 0;
  let peak = 0;
  let identical = true;
  for (let i = 0; i < left.length; i++) {
    peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
    if (left[i] !== right[i]) identical = false;
    if (Math.abs(left[i]) < 1e-6) {
      if (++run === minGap) gaps++;
    } else run = 0;
  }
  return { hzLeft: crossings(left), hzRight: crossings(right), gaps, peak, identical, sampleRate: buffer.sampleRate };
}

(window as unknown as { renderOffline: typeof renderOffline }).renderOffline = renderOffline;
document.title = "ready";

(window as unknown as { FocusEngine: typeof FocusEngine }).FocusEngine = FocusEngine;

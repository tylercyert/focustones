/**
 * The AudioWorklet half of the engine. Bundled by Vite on its own (`?worker&url`), so it may import `./dsp` but
 * nothing from React or the DOM. `process` only calls `EngineRenderer.render`, which allocates nothing; the one
 * `postMessage` (when a timer runs out) happens once per timer, outside the sample loop.
 */
import { EngineRenderer } from "./dsp";
import { PROCESSOR_NAME, type ProcessorOptions, type ToneMessage } from "./protocol";

// The worklet global scope is not in TypeScript's DOM lib.
declare const sampleRate: number;
declare class AudioWorkletProcessor {
  readonly port: MessagePort;
  constructor(options?: unknown);
}
declare function registerProcessor(name: string, ctor: new (options: never) => AudioWorkletProcessor): void;

class FocusToneProcessor extends AudioWorkletProcessor {
  private readonly renderer: EngineRenderer;
  private reportedDone = false;

  constructor(options: { processorOptions: ProcessorOptions }) {
    super();
    const o = options.processorOptions;
    this.renderer = new EngineRenderer(sampleRate, o.settings);
    if (o.startFade !== null) this.renderer.fadeTo(1, o.startFade);
    if (o.timer !== null) this.renderer.setTimer(o.timer);
    this.port.onmessage = (e: MessageEvent<ToneMessage>) => {
      const m = e.data;
      if (m.type === "settings") this.renderer.setSettings(m.settings);
      else if (m.type === "fade") this.renderer.fadeTo(m.target, m.seconds);
      else if (m.type === "timer") {
        this.renderer.setTimer(m.seconds);
        this.reportedDone = false;
      } else this.renderer.setRunning(m.running);
    };
  }

  process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    const out = outputs[0];
    const left = out[0];
    this.renderer.render(left.length, left, out.length > 1 ? out[1] : left);
    if (this.renderer.timerDone && !this.reportedDone) {
      this.reportedDone = true;
      this.port.postMessage({ type: "ended" });
    }
    return true;
  }
}

registerProcessor(PROCESSOR_NAME, FocusToneProcessor as never);

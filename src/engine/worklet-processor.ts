/**
 * The AudioWorklet half of the engine. Bundled by Vite on its own (`?worker&url`), so it may import `./dsp` but
 * nothing from React or the DOM. `process` only calls `EngineRenderer.render` and returns: it creates no objects and
 * posts no messages (the page learns a timer has run out from the audio clock).
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
      } else this.renderer.setRunning(m.running);
    };
  }

  process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    const out = outputs[0];
    const left = out[0];
    this.renderer.render(left.length, left, out.length > 1 ? out[1] : left);
    return true;
  }
}

registerProcessor(PROCESSOR_NAME, FocusToneProcessor as never);

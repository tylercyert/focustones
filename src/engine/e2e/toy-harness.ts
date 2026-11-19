// Test page for toy.spec.ts: the delights' ToyBus on offline and real contexts, plus a tally of live node connections.
import { ToyBus } from "../toy";

// Every node that has an outgoing connection; disconnect() with no arguments drops all of a node's outputs.
const live = new Set<AudioNode>();
const connect = AudioNode.prototype.connect as (this: AudioNode, ...a: unknown[]) => unknown;
const disconnect = AudioNode.prototype.disconnect as (this: AudioNode, ...a: unknown[]) => unknown;
AudioNode.prototype.connect = function (this: AudioNode, ...a: unknown[]) { live.add(this); return connect.apply(this, a); } as typeof AudioNode.prototype.connect;
AudioNode.prototype.disconnect = function (this: AudioNode, ...a: unknown[]) { if (!a.length) live.delete(this); return disconnect.apply(this, a); } as typeof AudioNode.prototype.disconnect;

type Step = { at: number; run: (bus: ToyBus) => void };

/** Renders the steps (each at its time, via suspend/resume) on an offline context and reports peak and RMS windows. */
async function render(steps: Step[], seconds: number, volume = 1) {
  const rate = 48000;
  const ctx = new OfflineAudioContext(2, seconds * rate, rate);
  const bus = new ToyBus(ctx, volume);
  // One suspend per time (a second suspend at the same time rejects), running every step due then.
  const times = [...new Set(steps.map((s) => s.at))];
  for (const at of times) {
    const due = steps.filter((s) => s.at === at);
    if (at === 0) due.forEach((s) => s.run(bus));
    else void ctx.suspend(at).then(() => { due.forEach((s) => s.run(bus)); return ctx.resume(); });
  }
  const buf = await ctx.startRendering();
  const ch = [buf.getChannelData(0), buf.getChannelData(1)];
  const peak = Math.max(...ch.map((c) => c.reduce((m, v) => Math.max(m, Math.abs(v)), 0)));
  const rms = (from: number, to: number) => {
    let sum = 0, n = 0;
    for (const c of ch) for (let i = Math.floor(from * rate); i < Math.floor(to * rate); i++) { sum += c[i] * c[i]; n++; }
    return Math.sqrt(sum / n);
  };
  return { peak, rms };
}

const api = {
  /**
   * Five chords 0.1 s apart against one chord started with the last of them: peaks, and the ringing tail (RMS from 1.0
   * to 1.6 s, after any replaced chord has faded and well under the limiter's threshold, so only replacement keeps them
   * equal). Then a deliberate overload, far past full scale before the bus: six beats, three crumples and five chords.
   */
  async peaks() {
    const one = await render([{ at: 0.4, run: (b) => { b.chord(); } }], 2);
    const five = await render([0, 0.1, 0.2, 0.3, 0.4].map((at) => ({ at, run: (b: ToyBus) => { b.chord(); } })), 2);
    const all = (await render([
      ...[0, 0.1, 0.2, 0.3, 0.4].map((at) => ({ at, run: (b: ToyBus) => { b.chord(); } })),
      { at: 0.15, run: (b) => { b.crumple(); b.crumple(); b.crumple(); } },
      { at: 0.2, run: (b) => { for (let i = 0; i < 6; i++) b.beat(220 + i * 40, 230 + i * 40, 2); } },
    ], 3)).peak;
    return { one: one.peak, five: five.peak, tailOne: one.rms(1, 1.6), tailFive: five.rms(1, 1.6), all };
  },
  /** A beat at full volume, muted at 1.0 s: RMS before and after. */
  async mute() {
    const r = await render([{ at: 0, run: (b) => { b.beat(220, 230, 3); } }, { at: 1, run: (b) => b.setVolume(0) }], 3);
    return { before: r.rms(0.6, 0.95), after: r.rms(1.1, 2.4) };
  },
  /** On a real context: sounds that end by themselves, or are stopped, disconnect every node; then the context suspends. */
  async lifecycle(stopEarly: boolean) {
    live.clear();
    const ctx = new AudioContext();
    await ctx.resume();
    const bus = new ToyBus(ctx, 0.0001, () => void ctx.suspend());
    const baseline = live.size; // the bus's own gain → limiter → speakers
    const chord = bus.chord();
    const beat = bus.beat(220, 230, stopEarly ? 8 : 1)!;
    const crumple = bus.crumple();
    const during = { playing: bus.playing, live: live.size };
    if (stopEarly) bus.stopAll();
    const t0 = performance.now();
    await Promise.all([chord.done, beat.done, crumple.done]);
    const ended = { ms: performance.now() - t0, playing: bus.playing, live: live.size };
    await new Promise((r) => setTimeout(r, 1800));
    return { baseline, during, ended, state: ctx.state };
  },
};

(window as unknown as { toy: typeof api }).toy = api;
document.title = "ready";

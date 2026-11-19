import { useEffect, useState } from 'react';
import { useDesktop } from '../../desktop/context.ts';
import { listenEngine, type EngineState, type Output, type Preset } from './engineAdapter.ts';

export interface ListenModel {
  readonly state: EngineState;
  readonly preset: Preset;
  readonly output: Output;
  readonly timerMinutes: number | null;
  /** Seconds left on a running timer, or null. */
  readonly left: number | null;
  readonly playing: boolean;
  readonly toggle: () => void;
  readonly choose: (id: string) => void;
  readonly setOutput: (o: Output) => void;
  readonly setTimerMinutes: (m: number | null) => void;
}

/** What the window shows survives closing and reopening it: the engine keeps the timer and mode, so the controls must agree. */
let rememberedOutput: Output = 'headphones';
let rememberedMinutes: number | null = null;

/** React state mirroring the page's one engine. The menu bar's volume item drives the engine's volume. */
export function useListen(): ListenModel {
  const engine = listenEngine();
  const { volume } = useDesktop();
  const [state, setState] = useState(engine.state);
  const [preset, setPreset] = useState(engine.preset);
  const [output, setOutputState] = useState<Output>(rememberedOutput);
  const [timerMinutes, setMinutes] = useState<number | null>(rememberedMinutes);
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const off = [engine.on('state', setState), engine.on('preset', setPreset), engine.on('time', (t) => setLeft(t === null ? null : Math.ceil(t)))];
    return () => off.forEach((f) => f());
  }, [engine]);
  useEffect(() => { engine.setVolume(volume); }, [engine, volume]);
  // Closing the window fades the sound out (1.5 s) and pauses it; reopening shows the paused state.
  useEffect(() => () => engine.pause(), [engine]);

  const playing = state === 'starting' || state === 'playing';
  return {
    state, preset, output, timerMinutes, left, playing,
    toggle: () => {
      if (playing) engine.pause();
      else {
        if (state === 'ended' && timerMinutes !== null) engine.setTimer(timerMinutes * 60);
        void engine.start();
      }
    },
    choose: (id) => engine.setPreset(id),
    setOutput: (o) => { rememberedOutput = o; setOutputState(o); engine.setOutput(o); },
    setTimerMinutes: (m) => { rememberedMinutes = m; setMinutes(m); engine.setTimer(m === null ? null : m * 60); },
  };
}

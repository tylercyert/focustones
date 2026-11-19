import { useEffect, useRef, useState } from 'react';
import { createListenEngine, type EngineState, type ListenEngine, type Output, type Preset, DEFAULT_PRESET } from './engineAdapter.ts';

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

/** One engine per Listen window; React state mirrors its events. */
export function useListen(): ListenModel {
  const engine = useRef<ListenEngine | null>(null);
  const [state, setState] = useState<EngineState>('idle');
  const [preset, setPreset] = useState<Preset>(DEFAULT_PRESET);
  const [output, setOutputState] = useState<Output>('headphones');
  const [timerMinutes, setMinutes] = useState<number | null>(null);
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const e = createListenEngine();
    engine.current = e;
    const off = [e.on('state', setState), e.on('preset', setPreset), e.on('time', (t) => setLeft(t === null ? null : Math.ceil(t)))];
    return () => { off.forEach((f) => f()); e.dispose(); engine.current = null; };
  }, []);

  const playing = state === 'starting' || state === 'playing';
  return {
    state, preset, output, timerMinutes, left, playing,
    toggle: () => {
      const e = engine.current;
      if (!e) return;
      if (playing) e.pause();
      else {
        if (state === 'ended' && timerMinutes !== null) e.setTimer(timerMinutes * 60);
        void e.start();
      }
    },
    choose: (id) => engine.current?.setPreset(id),
    setOutput: (o) => { setOutputState(o); engine.current?.setOutput(o); },
    setTimerMinutes: (m) => { setMinutes(m); engine.current?.setTimer(m === null ? null : m * 60); },
  };
}

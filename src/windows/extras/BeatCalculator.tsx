import { useEffect, useId, useRef, useState } from 'react';
import { strings } from '../../content/strings.ts';
import { playBeat, TOY_LIMITS, toyBeat, type ToyHandle } from '../../engine/toy.ts';
import { listenEngine } from '../listen/engineAdapter.ts';
import { bandColor, bandFor } from './beat.ts';

const t = strings.delights.calculator;

/** A desk accessory: two ears' frequencies in, the beat and its band out, and Hear It plays the pair for 8 s. */
export function BeatCalculator() {
  const [left, setLeft] = useState('220');
  const [right, setRight] = useState('230');
  const [playing, setPlaying] = useState(false);
  const handle = useRef<ToyHandle | null>(null);
  const ids = { left: useId(), right: useId(), out: useId() };

  const l = parseFloat(left), r = parseFloat(right);
  const plan = toyBeat(l, r);
  const earsOk = Number.isFinite(l) && Number.isFinite(r) && l >= TOY_LIMITS.minEar && l <= TOY_LIMITS.maxEar && r >= TOY_LIMITS.minEar && r <= TOY_LIMITS.maxEar;
  const band = earsOk ? bandFor(plan.beat) : null;

  const stop = () => { handle.current?.stop(); handle.current = null; setPlaying(false); };
  useEffect(() => () => { handle.current?.stop(); }, []);
  // Changing a frequency mid-play stops the old pair rather than leaving it ringing out of step with the display.
  useEffect(() => { if (handle.current) stop(); }, [left, right]);

  const hear = () => {
    if (playing) { stop(); return; }
    const engine = listenEngine();
    if (engine.state === 'playing' || engine.state === 'starting') engine.pause(); // one sound at a time
    const h = playBeat(l, r);
    if (!h) return;
    handle.current = h;
    setPlaying(true);
    void h.done.then(() => { if (handle.current === h) { handle.current = null; setPlaying(false); } });
  };

  const field = (id: string, label: string, value: string, set: (v: string) => void) => (
    <div className="dx-calc-row">
      <label htmlFor={id}>{label}</label>
      <div className="dx-calc-inputs">
        <input
          id={id} className="dx-field" type="number" inputMode="decimal" min={TOY_LIMITS.minEar} max={TOY_LIMITS.maxEar} step={0.1} value={value}
          onChange={(e) => set(e.target.value)}
        />
        <span className="dx-unit">{t.hz}</span>
      </div>
      <input
        className="dx-slider" type="range" min={TOY_LIMITS.minEar} max={TOY_LIMITS.maxEar} step={0.5} aria-label={label}
        value={Number.isFinite(parseFloat(value)) ? Math.min(TOY_LIMITS.maxEar, Math.max(TOY_LIMITS.minEar, parseFloat(value))) : TOY_LIMITS.minEar}
        onChange={(e) => set(e.target.value)}
      />
    </div>
  );

  const message = !earsOk ? t.invalid : !band ? t.outOfRange : null;
  return (
    <div className="dx dx-calc">
      {field(ids.left, t.left, left, setLeft)}
      {field(ids.right, t.right, right, setRight)}
      <output id={ids.out} className="dx-lcd" htmlFor={`${ids.left} ${ids.right}`} aria-live="polite" data-testid="beat-readout">
        {message ? <span className="dx-lcd-msg">{message}</span> : (
          <>
            <span className="dx-lcd-label">{t.beat}</span>
            <span className="dx-lcd-value">{plan.beat.toFixed(1)} {t.hz}</span>
            <span className="dx-lcd-band" style={{ color: bandColor(band!, 'light') }}>
              <i className="dx-lcd-swatch" style={{ background: bandColor(band!) }} />{strings.listen[band!]}
            </span>
          </>
        )}
      </output>
      <div className="dx-buttons">
        <button type="button" className="dx-btn dx-btn-default" disabled={!plan.playable || !band} aria-pressed={playing} onClick={hear}>{playing ? t.stop : t.hear}</button>
      </div>
      <p className="dx-small">{t.headphones}</p>
    </div>
  );
}

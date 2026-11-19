import { useEffect, useRef } from 'react';
import { strings } from '../../content/strings.ts';
import { useDesktop } from '../../desktop/context.ts';
import { useReducedMotion } from '../../desktop/hooks.ts';
import { Icon } from '../../desktop/icons.tsx';
import { RadioGroup } from '../shared/RadioGroup.tsx';
import type { Band } from './beat.ts';
import { startSaver } from './actions.ts';
import { PixelOrb } from './orbArt.tsx';
import { updateSettings, useSettings } from './store.ts';

const t = strings.delights.saver;
const ORBS: readonly { band: Band; size: number; x: number; y: number }[] = [
  { band: 'delta', size: 168, x: 12, y: 18 },
  { band: 'theta', size: 120, x: 64, y: 12 },
  { band: 'alpha', size: 144, x: 38, y: 58 },
  { band: 'beta', size: 96, x: 78, y: 64 },
  { band: 'gamma', size: 72, x: 22, y: 74 },
];

/**
 * The screen saver: band-colored pixel orbs drifting on black, each fading slowly in and out over many seconds
 * (never a flash, nothing tied to the beat). With Reduce Motion the scene holds still. Any input wakes it, but
 * input in the first 800 ms is ignored so the click that started it does not end it.
 */
export function ScreenSaverScene({ onWake }: { onWake: () => void }) {
  const reduced = useReducedMotion();
  const started = useRef(performance.now());
  const origin = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const ready = () => performance.now() - started.current > 800;
    const wake = (e: Event) => { if (!ready()) return; e.preventDefault(); e.stopPropagation(); onWake(); };
    const moved = (e: PointerEvent) => {
      if (!ready()) return;
      if (!origin.current) { origin.current = { x: e.clientX, y: e.clientY }; return; }
      if (Math.hypot(e.clientX - origin.current.x, e.clientY - origin.current.y) > 8) onWake();
    };
    // Not passive: the wake handler consumes the input (preventDefault), so a wheel that wakes the saver scrolls nothing.
    const opts = { capture: true, passive: false } as const;
    window.addEventListener('keydown', wake, opts);
    window.addEventListener('pointerdown', wake, opts);
    window.addEventListener('wheel', wake, opts);
    window.addEventListener('pointermove', moved, opts);
    return () => {
      window.removeEventListener('keydown', wake, opts);
      window.removeEventListener('pointerdown', wake, opts);
      window.removeEventListener('wheel', wake, opts);
      window.removeEventListener('pointermove', moved, opts);
    };
  }, [onWake]);
  return (
    <div className="dx-saver" data-testid="screen-saver" data-still={reduced || undefined} role="img" aria-label={t.label}>
      {ORBS.map((o, i) => (
        <div key={o.band} className={`dx-saver-orb dx-drift-${i}`} style={{ left: `${o.x}%`, top: `${o.y}%` }}>
          <PixelOrb band={o.band} size={o.size} className="dx-saver-art" />
        </div>
      ))}
      <p className="dx-saver-hint">{t.wake}</p>
    </div>
  );
}

/** The Screen Saver control panel: On or Off, and Test. */
export function ScreenSaverPanel() {
  const { saver } = useSettings();
  const { phone } = useDesktop();
  return (
    <div className="dx dx-panel">
      <div className="dx-monitor" aria-hidden="true">
        <div className="dx-monitor-screen">
          <PixelOrb band="theta" size={44} className="dx-mini dx-mini-a" />
          <PixelOrb band="beta" size={32} className="dx-mini dx-mini-b" />
          <PixelOrb band="gamma" size={22} className="dx-mini dx-mini-c" />
        </div>
      </div>
      <fieldset className="dx-group">
        <legend>{t.title}</legend>
        <RadioGroup
          className="dx-radios" itemClassName="dx-radio" label={t.label} value={saver ? 'on' : 'off'}
          onChange={(v) => updateSettings({ saver: v === 'on' })}
          items={[
            { value: 'on', testId: 'saver-on', children: <><i aria-hidden="true" />{t.on}</> },
            { value: 'off', testId: 'saver-off', children: <><i aria-hidden="true" />{t.off}</> },
          ]}
        />
        <p className="dx-small">{t.when}</p>
        <p className="dx-small">{t.motion}</p>
      </fieldset>
      <div className="dx-buttons">
        <button type="button" className="dx-btn dx-btn-default" onClick={startSaver}>
          {!phone && <Icon name="saver" size={16} />}{t.test}
        </button>
      </div>
    </div>
  );
}

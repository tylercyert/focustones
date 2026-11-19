import { useEffect, useRef, useState } from 'react';
import { strings } from '../content/strings.ts';
import { Icon } from './icons.tsx';

const clock = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
const day = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

/** The menu-bar clock. Press it to show or hide the date. */
export function Clock({ showDate, onToggle }: { showDate: boolean; onToggle: () => void }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(id);
  }, []);
  return (
    <button type="button" className="status-btn clock" onClick={onToggle} aria-label={`${strings.menuBar.clockLabel} ${day.format(now)}, ${clock.format(now)}`} aria-pressed={showDate}>
      {showDate && <span className="clock-date">{day.format(now)}</span>}
      <time dateTime={now.toISOString()}>{clock.format(now)}</time>
    </button>
  );
}

/** The speaker item: opens a small volume slider. The value lives in the desktop state and is saved on this device. */
export function Speaker({ volume, onChange }: { volume: number; onChange: (v: number) => void }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); box.current?.querySelector('button')?.focus(); } };
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', away); document.removeEventListener('keydown', esc); };
  }, [open]);
  const pct = Math.round(volume * 100);
  return (
    <div className="speaker" ref={box}>
      <button type="button" className="status-btn" aria-label={`${strings.menuBar.volume}, ${pct}%`} aria-haspopup="true" aria-expanded={open} onClick={() => setOpen(!open)}>
        <Icon name="speaker" size={20} />
      </button>
      {open && (
        <div className="speaker-pop" role="group" aria-label={strings.menuBar.volume}>
          <input
            type="range" min={0} max={100} step={1} value={pct} aria-label={strings.menuBar.volume}
            aria-valuetext={`${pct}%`} onChange={(e) => onChange(Number(e.target.value) / 100)}
          />
          <output>{pct}</output>
        </div>
      )}
    </div>
  );
}

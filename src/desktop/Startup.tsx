import { useEffect, useState } from 'react';
import { strings } from '../content/strings.ts';
import { Icon } from './icons.tsx';

const STEPS = 12;
const TICK = 100;

/** A brief, skippable startup moment: the orb and a progress bar. Not rendered with Reduce Motion (the parent decides). */
export function Startup({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (step >= STEPS) { const t = setTimeout(onDone, 160); return () => clearTimeout(t); }
    const t = setTimeout(() => setStep((s) => s + 1), TICK);
    return () => clearTimeout(t);
  }, [step, onDone]);
  useEffect(() => {
    const skip = () => onDone();
    window.addEventListener('keydown', skip);
    return () => window.removeEventListener('keydown', skip);
  }, [onDone]);
  return (
    <div className="startup" role="status" aria-label={strings.desktop.startupStatus} onPointerDown={onDone}>
      <div className="startup-card">
        <Icon name="app" size={64} className="startup-orb" />
        <div className="startup-title">{strings.desktop.startupTitle}</div>
        <div className="startup-bar" role="progressbar" aria-valuemin={0} aria-valuemax={STEPS} aria-valuenow={step}><i style={{ width: `${(step / STEPS) * 100}%` }} /></div>
        <div className="startup-status">{strings.desktop.startupStatus}</div>
      </div>
      <div className="startup-skip">{strings.desktop.startupSkip}</div>
    </div>
  );
}

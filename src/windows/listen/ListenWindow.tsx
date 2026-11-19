import { strings } from '../../content/strings.ts';
import { useDesktop } from '../../desktop/context.ts';
import { GetBar } from '../get/GetWindow.tsx';
import { Orb } from './Orb.tsx';
import { BAND_HUES, type Band } from './orbMotion.ts';
import { PRESETS, type EngineState, type Output } from './engineAdapter.ts';
import { clock } from './format.ts';
import { useListen } from './useListen.ts';

const L = strings.listen;
const TIMERS = [null, 15, 25, 45, 60, 90] as const;
const LETTER: Record<Band, string> = { delta: 'δ', theta: 'θ', alpha: 'α', beta: 'β', gamma: 'γ' };
const BAND_NAME: Record<Band, string> = { delta: L.delta, theta: L.theta, alpha: L.alpha, beta: L.beta, gamma: L.gamma };
const GOAL: Record<Band, string> = { delta: L.goalSleep, theta: L.goalCreate, alpha: L.goalRelax, beta: L.goalFocus, gamma: L.goalFocus };
const NAME: Record<string, string> = { 'deep-sleep': L.deepSleep, daydream: L.daydream, 'calm-focus': L.calmFocus, 'deep-work': L.deepWork, peak: L.peak };
const STATUS: Record<EngineState, string> = {
  idle: L.statusIdle, starting: L.statusStarting, playing: L.statusPlaying, paused: L.statusPaused, ended: L.statusEnded, error: L.statusError,
};

const rgb = (c: readonly number[]) => `rgb(${c.map((v) => Math.round(v * 255)).join(' ')})`;


function PlayGlyph({ playing }: { readonly playing: boolean }) {
  return playing ? (
    <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><rect x="6" y="5" width="4.5" height="14" rx="1.2" /><rect x="13.5" y="5" width="4.5" height="14" rx="1.2" /></svg>
  ) : (
    <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M8 5.2v13.6c0 .8.9 1.3 1.6.8l10.2-6.8c.6-.4.6-1.2 0-1.6L9.6 4.4C8.9 3.9 8 4.4 8 5.2Z" /></svg>
  );
}

const Lock = () => (
  <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M5 7V5.2a3 3 0 1 1 6 0V7h.5c.8 0 1.5.7 1.5 1.5v4c0 .8-.7 1.5-1.5 1.5h-7C3.7 14 3 13.3 3 12.5v-4C3 7.7 3.7 7 4.5 7H5Zm1.5 0h3V5.2a1.5 1.5 0 0 0-3 0V7Z" /></svg>
);

/** The window that plays sound: the orb, the preset, Play, the five bands, Timer and Headphones/Speaker. */
export function ListenWindow() {
  const m = useListen();
  const { openWindow, phone } = useDesktop();
  const hues = BAND_HUES[m.preset.band];
  const style = {
    '--band': rgb(hues.base), '--band-light': rgb(hues.light), '--band-deep': rgb(hues.deep),
  } as React.CSSProperties;
  const beat = Number.isInteger(m.preset.beat) ? String(m.preset.beat) : m.preset.beat.toFixed(1);
  const label = m.playing ? L.pause : m.state === 'ended' ? L.playAgain : L.play;

  return (
    <section className="ft-win ft-listen" style={style} aria-label={L.title} data-state={m.state}>
      <div className="ft-stage">
        <Orb band={m.preset.band} playing={m.playing} size={176} />
      </div>
      <div className="ft-now">
        <h2 className="ft-name" data-testid="preset-name">{NAME[m.preset.id]}</h2>
        <p className="ft-line" data-testid="preset-line">{GOAL[m.preset.band]} · {LETTER[m.preset.band]} {beat} Hz</p>
        <p className="ft-status" role="status" aria-live="polite" data-testid="status">
          {m.playing && m.left !== null ? `${clock(m.left)} ${L.timerLeft}` : STATUS[m.state]}
        </p>
      </div>

      <button type="button" className="ft-play" onClick={m.toggle} aria-label={label} data-testid="play">
        <PlayGlyph playing={m.playing} />
      </button>

      <div className="ft-group" role="radiogroup" aria-label={L.bands}>
        {PRESETS.map((p) => (
          <button
            key={p.id} type="button" role="radio" aria-checked={p.id === m.preset.id} className="ft-band"
            style={{ '--chip': rgb(BAND_HUES[p.band].base) } as React.CSSProperties}
            onClick={() => m.choose(p.id)} data-testid={`band-${p.band}`}
          >
            <span className="ft-band-letter" aria-hidden="true">{LETTER[p.band]}</span>
            <span className="ft-band-name">{BAND_NAME[p.band]}</span>
            <span className="ft-sr">{NAME[p.id]}</span>
          </button>
        ))}
      </div>

      <div className="ft-row">
        <span className="ft-label" id="ft-timer-label">{L.timer}</span>
        <div className="ft-seg" role="radiogroup" aria-labelledby="ft-timer-label">
          {TIMERS.map((t) => (
            <button key={t ?? 'off'} type="button" role="radio" aria-checked={m.timerMinutes === t} onClick={() => m.setTimerMinutes(t)} data-testid={`timer-${t ?? 'off'}`}>
              {t === null ? L.timerOff : t}
            </button>
          ))}
        </div>
        <span className="ft-unit" aria-hidden="true">{L.timerMinutes}</span>
      </div>

      <div className="ft-row">
        <span className="ft-label" id="ft-output-label">{L.output}</span>
        <div className="ft-seg ft-seg-wide" role="radiogroup" aria-labelledby="ft-output-label">
          {(['headphones', 'speaker'] as Output[]).map((o) => (
            <button key={o} type="button" role="radio" aria-checked={m.output === o} onClick={() => m.setOutput(o)} data-testid={`output-${o}`}>
              {o === 'headphones' ? L.headphones : L.speaker}
            </button>
          ))}
        </div>
      </div>
      <p className="ft-note" data-testid="output-note">{m.output === 'headphones' ? L.headphonesNote : L.speakerNote}</p>

      <div className="ft-pro">
        <span className="ft-pro-eyebrow">{L.proEyebrow}</span>
        <div className="ft-pro-row">
          {[
            [L.proTune, 'tune'],
            [L.proLayers, 'layers'],
            [L.proPrograms, 'programs'],
          ].map(([text, id]) => (
            <button key={id} type="button" className="ft-locked" onClick={() => openWindow(`feature-${id}`)} data-testid={`locked-${id}`}>
              <Lock />{text}
            </button>
          ))}
        </div>
      </div>

      <p className="ft-foot">{L.free}</p>
      {phone && <div className="ft-bar-dock"><GetBar /></div>}
    </section>
  );
}

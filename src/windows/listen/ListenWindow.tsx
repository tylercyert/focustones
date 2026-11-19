import { strings } from '../../content/strings.ts';
import { useDesktop } from '../../desktop/context.ts';
import { GetBar } from '../get/GetWindow.tsx';
import { Orb } from './Orb.tsx';
import { BAND_HUES, type Band } from './orbMotion.ts';
import { PRESETS, type EngineState, type Output } from './engineAdapter.ts';
import { clock } from './format.ts';
import { RadioGroup } from '../shared/RadioGroup.tsx';
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


/** Square-cornered transport glyphs, drawn on the pixel grid like a period media player's buttons. */
function PlayGlyph({ playing }: { readonly playing: boolean }) {
  return playing ? (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" shapeRendering="crispEdges"><rect x="3" y="2" width="4" height="12" /><rect x="9" y="2" width="4" height="12" /></svg>
  ) : (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M4 2v12l10-6z" /></svg>
  );
}

const Lock = () => (
  <svg viewBox="0 0 10 12" width="10" height="12" aria-hidden="true" shapeRendering="crispEdges"><path d="M3 1h4v1h1v3H7V2H3v3H2V2h1z" /><rect x="1" y="5" width="8" height="7" /></svg>
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
    <section className="ft-win ft-listen" style={style} aria-label={L.title} data-state={m.state} data-engine-mode={m.engineMode}>
      {/* The display: a dark inset screen, the one place the orb's modern glow lives (like a period media player's). */}
      <div className="ft-display">
        <div className="ft-stage">
          <Orb band={m.preset.band} playing={m.playing} size={176} />
        </div>
        <div className="ft-now">
          <h2 className="ft-name" data-testid="preset-name">{NAME[m.preset.id]}</h2>
          <p className="ft-line" data-testid="preset-line">{GOAL[m.preset.band]} · {LETTER[m.preset.band]} {beat} {L.hz}</p>
          <p className="ft-status" role="status" aria-live="polite" data-testid="status">
            {m.playing && m.left !== null ? `${clock(m.left)} ${L.timerLeft}` : STATUS[m.state]}
          </p>
        </div>
      </div>

      <button type="button" className="ft-play" onClick={m.toggle} aria-label={label} data-testid="play">
        <PlayGlyph playing={m.playing} /><span aria-hidden="true">{label}</span>
      </button>

      <RadioGroup
        className="ft-group" itemClassName="ft-band" label={L.bands} value={m.preset.id} onChange={m.choose}
        items={PRESETS.map((p) => ({
          value: p.id, testId: `band-${p.band}`, style: { '--chip': rgb(BAND_HUES[p.band].base) } as React.CSSProperties,
          children: (
            <>
              <span className="ft-band-swatch" aria-hidden="true" />
              <span className="ft-band-letter" aria-hidden="true">{LETTER[p.band]}</span>
              <span className="ft-band-name">{BAND_NAME[p.band]}</span>
              <span className="ft-sr">{NAME[p.id]}</span>
            </>
          ),
        }))}
      />

      <div className="ft-row">
        <span className="ft-label" id="ft-timer-label">{L.timer}</span>
        <RadioGroup
          className="ft-radios" itemClassName="ft-radio" labelledBy="ft-timer-label" value={m.timerMinutes} onChange={m.setTimerMinutes}
          items={TIMERS.map((t) => ({ value: t, testId: `timer-${t ?? 'off'}`, children: t === null ? L.timerOff : t }))}
        />
        <span className="ft-unit" aria-hidden="true">{L.timerMinutes}</span>
      </div>

      <div className="ft-row">
        <span className="ft-label" id="ft-output-label">{L.output}</span>
        <RadioGroup
          className="ft-radios" itemClassName="ft-radio" labelledBy="ft-output-label" value={m.output} onChange={m.setOutput}
          items={(['headphones', 'speaker'] as Output[]).map((o) => ({ value: o, testId: `output-${o}`, children: o === 'headphones' ? L.headphones : L.speaker }))}
        />
      </div>
      <p className="ft-note" data-testid="output-note">{m.output === 'headphones' ? L.headphonesNote : L.speakerNote}</p>

      <div className="ft-pro ft-groupbox" role="group" aria-labelledby="ft-pro-label">
        <span className="ft-pro-eyebrow ft-groupbox-label" id="ft-pro-label">{L.proEyebrow}</span>
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

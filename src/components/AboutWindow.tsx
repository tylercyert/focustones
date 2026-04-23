import Win98Window from "./Win98Window";
import { useWindowState } from "../state/windowState";

const BAND_SYMBOLS: Record<string, string> = {
  delta: "\u03B4", theta: "\u03B8", alpha: "\u03B1", beta: "\u03B2", gamma: "\u03B3"
};

export default function AboutWindow() {
  const closeWindow = useWindowState((s) => s.closeWindow);

  return (
    <Win98Window id="about" title="About FocusTones" icon="&#9432;">
      <div style={{ padding: 8 }}>
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--win98-titlebar)' }}>FocusTones 98</div>
          <div style={{ fontSize: 11, color: 'var(--win98-dark-silver)' }}>Version 1.0 - Binaural Beat Generator</div>
          <div className="retro-hr" />
        </div>

        <p style={{ fontSize: 12, lineHeight: 1.6, marginBottom: 8 }}>
          I created FocusTone.co to aid in my own practice of deep work. The app generates
          customizable binaural tones designed to help guide the brain into different states
          of focus, rest, and creativity.
        </p>

        <p style={{ fontSize: 12, lineHeight: 1.6, marginBottom: 8 }}>
          Binaural beats work by nudging brainwaves into specific frequency ranges:
        </p>

        <div className="win98-groupbox">
          <span className="win98-groupbox-label">Brainwave Bands</span>
          <div style={{ fontSize: 12, lineHeight: 1.8 }}>
            <div><span style={{ color: '#21B5B0', fontWeight: 700 }}>{BAND_SYMBOLS.delta} Delta (0.5-4 Hz):</span> Deep sleep, restoration, and healing.</div>
            <div><span style={{ color: '#26C3A8', fontWeight: 700 }}>{BAND_SYMBOLS.theta} Theta (4-8 Hz):</span> Relaxation, meditation, and heightened creativity.</div>
            <div><span style={{ color: '#7BBE62', fontWeight: 700 }}>{BAND_SYMBOLS.alpha} Alpha (8-12 Hz):</span> Calm, present awareness - ideal for light focus and flow.</div>
            <div><span style={{ color: '#B8A64B', fontWeight: 700 }}>{BAND_SYMBOLS.beta} Beta (12-30 Hz):</span> Active thinking, problem-solving, and alertness.</div>
            <div><span style={{ color: '#F2A23A', fontWeight: 700 }}>{BAND_SYMBOLS.gamma} Gamma (30+ Hz):</span> High-level cognition, memory, and peak concentration.</div>
          </div>
        </div>

        <p style={{ fontSize: 12, lineHeight: 1.6, marginTop: 8 }}>
          These states provide heuristic benefits - practical ways to align your mental state
          with the task at hand, whether that's entering flow, resting deeply, or sparking creativity.
        </p>

        <div className="retro-hr" />

        <div style={{ textAlign: 'center', fontSize: 11 }}>
          Built by{' '}
          <a href="https://tylercyert.com" target="_blank" rel="noopener noreferrer" className="retro-link">
            Tyler Cyert
          </a>
          {' '}&bull;{' '}
          <a href="https://github.com/tylercyert" target="_blank" rel="noopener noreferrer" className="retro-link">
            GitHub
          </a>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--win98-button-shadow)' }}>
        <button className="win98-btn win98-btn-default" onClick={() => closeWindow("about")} style={{ minWidth: 80 }}>
          OK
        </button>
      </div>
    </Win98Window>
  );
}

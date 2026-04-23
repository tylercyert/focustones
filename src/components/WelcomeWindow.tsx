import Win98Window from "./Win98Window";
import { useWindowState } from "../state/windowState";

export default function WelcomeWindow() {
  const closeWindow = useWindowState((s) => s.closeWindow);

  const dismiss = () => {
    localStorage.setItem('hasVisitedBefore', 'true');
    closeWindow("welcome");
  };

  return (
    <Win98Window id="welcome" title="Welcome to FocusTones 98" icon="&#128075;">
      <div style={{ padding: 8 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
          <div style={{ fontSize: 40, lineHeight: 1 }}>&#128266;</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: 'var(--win98-titlebar)' }}>
              Welcome to FocusTones 98
            </div>
            <p style={{ fontSize: 12, lineHeight: 1.6, margin: 0 }}>
              FocusTones generates customizable binaural beats to guide your brain into
              optimal states for focus, creativity, and deep work.
            </p>
          </div>
        </div>

        <div className="win98-groupbox">
          <span className="win98-groupbox-label">Quick Start</span>
          <div style={{ fontSize: 12, lineHeight: 1.8 }}>
            <div>&#128266; <b>Click the sphere</b> or press <b>Space</b> to play/stop</div>
            <div>&#127911; <b>Headphones required</b> for binaural effect</div>
            <div>&#127912; <b>Select a brainwave band</b> from the bottom panel</div>
            <div>&#9881; <b>Sound Control Panel</b> for advanced settings</div>
            <div>&#128196; <b>Open a Zine article</b> from the desktop to read</div>
          </div>
        </div>

        <div className="retro-hr" />

        <p style={{ fontSize: 11, textAlign: 'center', color: 'var(--win98-dark-silver)' }}>
          Built with &#9829; by Tyler Cyert &bull; Best experienced with headphones
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--win98-button-shadow)' }}>
        <button
          className="win98-btn win98-btn-default"
          onClick={dismiss}
          style={{ minWidth: 100 }}
        >
          Get Started
        </button>
      </div>
    </Win98Window>
  );
}

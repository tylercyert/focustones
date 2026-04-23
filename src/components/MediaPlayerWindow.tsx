import SphereViz from "./SphereViz";
import Win98Window from "./Win98Window";
import { useAppState, BAND_RANGES, type Band } from "../state/appState";
import { useWindowState } from "../state/windowState";

const BAND_SYMBOLS: Record<Band, string> = {
  delta: "\u03B4",
  theta: "\u03B8",
  alpha: "\u03B1",
  beta: "\u03B2",
  gamma: "\u03B3",
};

type Props = {
  onToggle: () => void;
};

export default function MediaPlayerWindow({ onToggle }: Props) {
  const band = useAppState((s) => s.band);
  const setBand = useAppState((s) => s.setBand);
  const isPlaying = useAppState((s) => s.isPlaying);
  const offsetHz = useAppState((s) => s.offsetHz);
  const carrierHz = useAppState((s) => s.carrierHz);
  const openWindow = useWindowState((s) => s.openWindow);

  return (
    <Win98Window
      id="mediaPlayer"
      title="FocusTones Player"
      icon="&#127925;"
      closable={false}
      minimizable={true}
      statusBar={
        <div className="win98-statusbar-section">
          {isPlaying
            ? `${BAND_SYMBOLS[band]} ${band.charAt(0).toUpperCase() + band.slice(1)} \u2014 ${offsetHz.toFixed(1)} Hz @ ${carrierHz} Hz carrier`
            : "Stopped"}
        </div>
      }
    >
      <div className="media-player-viz">
        <SphereViz onToggle={onToggle} />
      </div>

      <div className="media-player-lcd">
        <span className="media-player-lcd-section" style={{ color: BAND_RANGES[band].color }}>
          {BAND_SYMBOLS[band]} {band.charAt(0).toUpperCase() + band.slice(1)}
        </span>
        <span className="media-player-lcd-section">
          {offsetHz.toFixed(1)} Hz
        </span>
        <span className="media-player-lcd-section">
          {carrierHz} Hz {isPlaying ? "\u25B6" : "\u25A0"}
        </span>
      </div>

      <div className="media-player-transport">
        {(Object.keys(BAND_RANGES) as Band[]).map((key) => {
          const config = BAND_RANGES[key];
          const isActive = band === key;

          return (
            <button
              key={key}
              onClick={() => setBand(key)}
              className={`win98-btn ${isActive ? "win98-btn-active" : ""}`}
              style={{
                minWidth: 44,
                minHeight: 32,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "2px 6px",
                ...(isActive
                  ? {
                      background: config.color,
                      color: "#fff",
                      textShadow: "1px 1px 0 rgba(0,0,0,0.4)",
                    }
                  : {}),
              }}
              aria-label={`Select ${key} brainwave band (${config.min}-${config.max} Hz)`}
            >
              <span style={{ fontSize: 14, fontWeight: 700, lineHeight: 1 }}>
                {BAND_SYMBOLS[key]}
              </span>
              <span style={{ fontSize: 9, lineHeight: 1, marginTop: 1 }}>
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </span>
            </button>
          );
        })}

        <div
          style={{
            width: 2,
            height: 24,
            borderLeft: "1px solid var(--win98-button-shadow)",
            borderRight: "1px solid var(--win98-button-highlight)",
            margin: "0 2px",
          }}
        />

        <button
          onClick={onToggle}
          className={`win98-btn ${isPlaying ? "win98-btn-active" : ""}`}
          style={{ minWidth: 44, minHeight: 32, padding: "2px 8px" }}
          aria-label={isPlaying ? "Stop playback" : "Start playback"}
          title={isPlaying ? "Stop" : "Play"}
        >
          <span style={{ fontSize: 14 }}>
            {isPlaying ? "\u23F9" : "\u25B6"}
          </span>
        </button>

        <button
          onClick={() =>
            openWindow({
              kind: "settings",
              title: "Sound Control Panel",
              icon: "\u2699",
            })
          }
          className="win98-btn"
          style={{ minWidth: 44, minHeight: 32, padding: "2px 8px" }}
          aria-label="Open Sound Control Panel"
          title="Sound Control Panel"
        >
          <span style={{ fontSize: 14 }}>&#9881;</span>
        </button>
      </div>
    </Win98Window>
  );
}

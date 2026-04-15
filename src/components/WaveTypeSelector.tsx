import { useAppState, BAND_RANGES, type Band } from "../state/appState";

const BAND_SYMBOLS: Record<Band, string> = {
  delta: "\u03B4",
  theta: "\u03B8",
  alpha: "\u03B1",
  beta: "\u03B2",
  gamma: "\u03B3",
};

export default function BrainwaveBandSelector() {
  const band = useAppState((s) => s.band);
  const setBand = useAppState((s) => s.setBand);
  const isPlaying = useAppState((s) => s.isPlaying);

  return (
    <div style={{
      position: 'absolute',
      bottom: 38,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 50,
      pointerEvents: 'auto',
    }}>
      <div
        className="win98-window"
        style={{ padding: 3 }}
      >
        <div style={{
          display: 'flex',
          gap: 2,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 2,
        }}>
          {(Object.keys(BAND_RANGES) as Band[]).map((key) => {
            const config = BAND_RANGES[key];
            const isActive = band === key;

            return (
              <button
                key={key}
                onClick={() => setBand(key)}
                className={`win98-btn ${isActive ? 'win98-btn-active' : ''}`}
                style={{
                  minWidth: 44,
                  minHeight: 36,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2px 6px',
                  ...(isActive
                    ? {
                        background: config.color,
                        color: '#fff',
                        textShadow: '1px 1px 0 rgba(0,0,0,0.4)',
                      }
                    : {}),
                }}
                aria-label={`Select ${key} brainwave band (${config.min}-${config.max} Hz)`}
              >
                <span style={{ fontSize: 16, fontWeight: 700, lineHeight: 1 }}>
                  {BAND_SYMBOLS[key]}
                </span>
                <span style={{ fontSize: 9, lineHeight: 1, marginTop: 1 }}>
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </span>
              </button>
            );
          })}

          <div style={{
            width: 2,
            height: 28,
            borderLeft: '1px solid var(--win98-button-shadow)',
            borderRight: '1px solid var(--win98-button-highlight)',
            margin: '0 2px',
          }} />

          {/* Play/Stop */}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('togglePlayback'))}
            className={`win98-btn ${isPlaying ? 'win98-btn-active' : ''}`}
            style={{ minWidth: 36, minHeight: 36, padding: '2px 6px' }}
            aria-label={isPlaying ? 'Stop playback' : 'Start playback'}
            title={isPlaying ? 'Stop' : 'Play'}
          >
            <span style={{ fontSize: 16 }}>{isPlaying ? '\u23F9' : '\u25B6'}</span>
          </button>

          {/* Settings */}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('openSettings'))}
            className="win98-btn"
            style={{ minWidth: 36, minHeight: 36, padding: '2px 6px' }}
            aria-label="Open settings"
            title="Sound Control Panel"
          >
            <span style={{ fontSize: 16 }}>&#9881;</span>
          </button>

          {/* Blog */}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('openBlog'))}
            className="win98-btn"
            style={{ minWidth: 36, minHeight: 36, padding: '2px 6px' }}
            aria-label="Open blog"
            title="The Zine"
          >
            <span style={{ fontSize: 16 }}>&#128196;</span>
          </button>

          {/* About */}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('openAbout'))}
            className="win98-btn"
            style={{ minWidth: 36, minHeight: 36, padding: '2px 6px' }}
            aria-label="About FocusTones"
            title="About"
          >
            <span style={{ fontSize: 14 }}>&#9432;</span>
          </button>
        </div>
      </div>
    </div>
  );
}

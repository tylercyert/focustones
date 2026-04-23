import Win98Window from "./Win98Window";
import { useAppState, BAND_RANGES } from "../state/appState";
import { useWindowState } from "../state/windowState";
import { audioEngine } from "../audio/audioEngine";
import { overlayAudioEngine } from "../audio/overlayAudio";

const BAND_SYMBOLS: Record<string, string> = {
  delta: "\u03B4", theta: "\u03B8", alpha: "\u03B1", beta: "\u03B2", gamma: "\u03B3"
};

type Props = {
  onToggle: () => void;
};

export default function SettingsWindow({ onToggle }: Props) {
  const band = useAppState((s) => s.band);
  const offsetHz = useAppState((s) => s.offsetHz);
  const carrierHz = useAppState((s) => s.carrierHz);
  const volume = useAppState((s) => s.volume);
  const isPlaying = useAppState((s) => s.isPlaying);
  const setBand = useAppState((s) => s.setBand);
  const setOffsetHz = useAppState((s) => s.setOffsetHz);
  const setCarrierHz = useAppState((s) => s.setCarrierHz);
  const setVolume = useAppState((s) => s.setVolume);

  const overlaySound = useAppState((s) => s.overlaySound);
  const overlayVolume = useAppState((s) => s.overlayVolume);
  const overlayLowPassFreq = useAppState((s) => s.overlayLowPassFreq);
  const setOverlaySound = useAppState((s) => s.setOverlaySound);
  const setOverlayVolume = useAppState((s) => s.setOverlayVolume);
  const setOverlayLowPassFreq = useAppState((s) => s.setOverlayLowPassFreq);

  const closeWindow = useWindowState((s) => s.closeWindow);

  return (
    <Win98Window
      id="settings"
      title="Sound Control Panel"
      icon="&#9881;"
      statusBar={
        <div className="win98-statusbar-section">
          {isPlaying ? `Playing: ${band} @ ${offsetHz.toFixed(1)}Hz` : 'Stopped'}
        </div>
      }
    >
      <div className="win98-groupbox" style={{ marginTop: 4 }}>
        <span className="win98-groupbox-label">Binaural Generator</span>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 12 }}>Carrier Frequency</div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {[174, 220, 256, 320, 432].map((freq) => (
              <button
                key={freq}
                onClick={() => setCarrierHz(freq)}
                className={`win98-btn ${carrierHz === freq ? 'win98-btn-active' : ''}`}
                style={{
                  minWidth: 56,
                  ...(carrierHz === freq ? { background: 'var(--win98-selection)', color: 'var(--win98-selection-text)' } : {})
                }}
              >
                {freq} Hz
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 12 }}>Brainwave Band</div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {Object.entries(BAND_RANGES).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setBand(key as keyof typeof BAND_RANGES)}
                className={`win98-btn ${band === key ? 'win98-btn-active' : ''}`}
                style={{
                  minWidth: 60,
                  ...(band === key
                    ? { background: config.color, color: '#fff', textShadow: '1px 1px 0 rgba(0,0,0,0.3)' }
                    : {})
                }}
              >
                <span style={{ fontWeight: 700, marginRight: 2 }}>{BAND_SYMBOLS[key]}</span>
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 12 }}>
            Offset Frequency: <span style={{ fontWeight: 400 }}>{offsetHz.toFixed(1)} Hz</span>
          </div>
          <input
            type="range"
            min={BAND_RANGES[band].min}
            max={BAND_RANGES[band].max}
            step={0.1}
            value={offsetHz}
            onChange={(e) => setOffsetHz(parseFloat(e.target.value))}
            className="win98-slider"
          />
        </div>

        <div>
          <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 12 }}>
            Volume: <span style={{ fontWeight: 400 }}>{Math.round(volume * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="win98-slider"
          />
        </div>
      </div>

      <div className="win98-groupbox">
        <span className="win98-groupbox-label">Noise Generator</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <input
            type="checkbox"
            className="win98-checkbox"
            id="white-noise-toggle"
            checked={overlaySound === "white-noise"}
            onChange={(e) => {
              const newSound = e.target.checked ? "white-noise" : "none";
              setOverlaySound(newSound);
              if (newSound === "white-noise" && audioEngine.getIsPlaying()) {
                overlayAudioEngine.transitionTo("white-noise", overlayVolume);
              } else if (newSound === "none") {
                overlayAudioEngine.transitionTo("none");
              }
            }}
          />
          <label htmlFor="white-noise-toggle" style={{ fontSize: 12, cursor: 'pointer' }}>
            White Noise
          </label>
        </div>

        {overlaySound !== "none" && (
          <>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 12 }}>
                Noise Volume: <span style={{ fontWeight: 400 }}>{Math.round(overlayVolume * 2500)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={overlayVolume * 2500}
                onChange={(e) => setOverlayVolume(parseFloat(e.target.value) / 2500)}
                className="win98-slider"
              />
            </div>

            <div>
              <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 12 }}>
                Low-Pass Filter: <span style={{ fontWeight: 400 }}>{Math.round(overlayLowPassFreq)} Hz</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={((overlayLowPassFreq - 500) / (8000 - 500)) * 100}
                onChange={(e) => {
                  const sliderValue = parseFloat(e.target.value) / 100;
                  const freq = 500 + (sliderValue * (8000 - 500));
                  setOverlayLowPassFreq(freq);
                }}
                className="win98-slider"
              />
            </div>
          </>
        )}
      </div>

      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--win98-button-shadow)' }}>
        <button className="win98-btn" onClick={onToggle} style={{ minWidth: 80 }}>
          {isPlaying ? '\u23F9 Stop' : '\u25B6 Play'}
        </button>
        <button className="win98-btn" onClick={() => closeWindow("settings")} style={{ minWidth: 80 }}>
          OK
        </button>
      </div>
    </Win98Window>
  );
}

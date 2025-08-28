import { useAppState, BAND_RANGES } from "../state/appState";

export default function BrainwaveBandSelector() {
  const band = useAppState((s) => s.band);
  const setBand = useAppState((s) => s.setBand);

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
      <div className="bg-surface/80 backdrop-blur-md p-4 border border-outline-variant shadow-lg">
        <div className="flex gap-3 items-center">
          {Object.entries(BAND_RANGES).map(([key, config]) => (
            <button
              key={key}
              onClick={() => {
                console.log('Brainwave band button clicked:', key);
                setBand(key as keyof typeof BAND_RANGES);
              }}
              className={`md-button ${
                band === key ? "md-button-filled" : "md-button-outlined"
              } flex-col items-center justify-center w-[80px] h-[60px]`}
              style={{
                backgroundColor: band === key ? config.color : "transparent",
                borderColor: band === key ? config.color : "var(--md-sys-color-outline)",
                color: band === key ? "white" : "var(--md-sys-color-primary)"
              }}
              aria-label={`Select ${key} brainwave band (${config.min}-${config.max} Hz)`}
            >
              <div className="md-title-large mb-1">{config.color === "#21B5B0" ? "δ" : config.color === "#26C3A8" ? "θ" : config.color === "#7BBE62" ? "α" : config.color === "#B8A64B" ? "β" : "γ"}</div>
              <div className="md-label-small">{key.charAt(0).toUpperCase() + key.slice(1)}</div>
            </button>
          ))}
          
          {/* Settings Button - matches exact styling of brainwave band buttons */}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('openSettings'))}
            className="md-button md-button-outlined flex-col items-center justify-center w-[80px] h-[60px]"
            aria-label="Open settings"
          >
            <div className="md-title-large mb-1">⚙</div>
            <div className="md-label-small">Settings</div>
          </button>
          
          {/* About Button - matches exact styling of brainwave band buttons */}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('openAbout'))}
            className="md-button md-button-outlined flex-col items-center justify-center w-[80px] h-[60px]"
            aria-label="About FocusTone"
          >
            <div className="md-title-large mb-1">ℹ</div>
            <div className="md-label-small">About</div>
          </button>
        </div>
      </div>
    </div>
  );
}

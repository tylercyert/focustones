import './App.css'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import SphereViz from './components/SphereViz'
import ControlsOverlay from './components/ControlsOverlay'
import { useAppState, BAND_RANGES } from './state/appState'
import { audioEngine } from './audio/audioEngine'
import { overlayAudioEngine } from './audio/overlayAudio'

function App() {
  const band = useAppState((s) => s.band)
  const offsetHz = useAppState((s) => s.offsetHz)
  const carrierHz = useAppState((s) => s.carrierHz)
  const volume = useAppState((s) => s.volume)
  const waveform = useAppState((s) => s.waveform)


  const setPlaying = useAppState((s) => s.setPlaying)
  const setBand = useAppState((s) => s.setBand)
  const setOffsetHz = useAppState((s) => s.setOffsetHz)
  const setCarrierHz = useAppState((s) => s.setCarrierHz)
  const setVolume = useAppState((s) => s.setVolume)

  const overlaySound = useAppState((s) => s.overlaySound)
  const overlayVolume = useAppState((s) => s.overlayVolume)
  const overlayLowPassFreq = useAppState((s) => s.overlayLowPassFreq)
  const setOverlaySound = useAppState((s) => s.setOverlaySound)
  const setOverlayVolume = useAppState((s) => s.setOverlayVolume)
  const setOverlayLowPassFreq = useAppState((s) => s.setOverlayLowPassFreq)
  
  // Settings modal state at App level
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isAboutOpen, setIsAboutOpen] = useState(false)
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(() => {
    // Check if this is the first visit
    const hasVisited = localStorage.getItem('hasVisitedBefore');
    return !hasVisited;
  });

  useEffect(() => {
    // Always update audio parameters when they change, regardless of playing state
    // This ensures the brainwave selector works even when audio is not playing
    
    // Add a small delay to ensure audio engine is ready before tuning
    const timeoutId = setTimeout(() => {
      if (audioEngine.getIsPlaying()) {
        audioEngine.tune({ carrierHz, offsetHz, volume, waveform });
      }
    }, 100); // 100ms delay to ensure audio engine is ready
    
    return () => clearTimeout(timeoutId);
  }, [band, carrierHz, offsetHz, volume, waveform])



  // Sync overlay audio parameters when they change (but don't start/stop automatically)
  useEffect(() => {
    if (overlayAudioEngine.getState().isPlaying) {
      overlayAudioEngine.setVolume(overlayVolume);
    }
  }, [overlayVolume]);

  useEffect(() => {
    if (overlayAudioEngine.getState().isPlaying) {
      overlayAudioEngine.setLowPassFreq(overlayLowPassFreq);
    }
  }, [overlayLowPassFreq]);

  useEffect(() => {
    const handleOpenSettings = () => setIsSettingsOpen(true);
    const handleOpenAbout = () => setIsAboutOpen(true);
    window.addEventListener('openSettings', handleOpenSettings);
    window.addEventListener('openAbout', handleOpenAbout);
    return () => {
      window.removeEventListener('openSettings', handleOpenSettings);
      window.removeEventListener('openAbout', handleOpenAbout);
    };
  }, []);

  const toggle = () => {
    const audioIsPlaying = audioEngine.getIsPlaying();
    
    // Get the current state values at the time of calling toggle
    const currentState = useAppState.getState();
    const { carrierHz: currentCarrierHz, offsetHz: currentOffsetHz, volume: currentVolume, waveform: currentWaveform, overlaySound: currentOverlaySound } = currentState;
    
    if (!audioIsPlaying) {
      // Start playing with current settings
      audioEngine.start({ carrierHz: currentCarrierHz, offsetHz: currentOffsetHz, volume: currentVolume, waveform: currentWaveform })
      
      // Start overlay audio if enabled
      if (currentOverlaySound === "white-noise") {
        overlayAudioEngine.start("white-noise", overlayVolume);
      }
      
      setPlaying(true)
    } else {
      // Stop playing
      audioEngine.stop()
      
      // Stop overlay audio
      overlayAudioEngine.stop()
      
      setPlaying(false)
    }
  }

  return (
    <div className="bg-surface text-on-surface">
      {/* Three.js canvas fills entire viewport */}
      <div className="fixed inset-0 z-0">
        <SphereViz onToggle={toggle} />
      </div>
      
      {/* UI controls float above the canvas - MUST take full viewport */}
      <div className="fixed inset-0 w-screen h-screen z-10 pointer-events-none">
        <ControlsOverlay />
      </div>
      
      {/* Footer - Fixed at bottom */}
      <footer style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        pointerEvents: 'auto',
        backgroundColor: 'rgba(28, 27, 31, 0.9)',
        backdropFilter: 'blur(8px)',
        borderTop: '1px solid #49454F',
        textAlign: 'center',
        padding: '12px 16px',
        fontSize: '13px',
        lineHeight: '18px',
        fontWeight: 400,
        letterSpacing: '0.25px',
        color: '#CAC4D0'
      }}>
        Headphones Required | Built and hosted by{' '}
        <a 
          href="https://github.com/tylercyert" 
          target="_blank" 
          rel="noopener noreferrer" 
          style={{
            color: '#E6E1E5',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'color 0.2s ease'
          }}
          onMouseEnter={(e) => (e.target as HTMLElement).style.color = '#6750A4'}
          onMouseLeave={(e) => (e.target as HTMLElement).style.color = '#E6E1E5'}
        >
          Tyler Cyert
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            height="15" 
            viewBox="0 0 16 16" 
            width="16" 
            fill="currentColor" 
            aria-hidden="true"
            style={{ display: 'inline-block' }}
          >
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38
              0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52
              -.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78
              -.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67
              -.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82
              2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87
              3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2
              0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z">
            </path>
          </svg>
        </a>
      </footer>
      
      {/* Settings Modal - Rendered via portal to document body */}
      {isSettingsOpen && createPortal(
        <div className="settings-modal-overlay">
          <div className="settings-modal-content max-w-[95vw] max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="md-headline-small text-on-surface text-center">Settings</h3>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="close-button"
                aria-label="Close settings"
              >
                ×
              </button>
            </div>

                        {/* Content */}
            <div className="space-y-6 modal-content-scrollable">
              {/* Binaural Generator Section */}
              <div className="bg-surface-container">
                <h3 className="md-headline-small text-primary text-center m-0">Binaural Generator</h3>
                
                {/* Carrier Frequency */}
                <div className="mb-6">
                  <h4 className="md-title-medium text-on-surface-variant mb-3 text-center">Carrier Frequency</h4>
                  <div className="flex gap-1 sm:gap-2 flex-wrap justify-center">
                    {[174, 220, 256, 320, 432].map((freq) => (
                      <button
                        key={freq}
                        onClick={() => setCarrierHz(freq)}
                        className={`md-button text-sm sm:text-base ${
                          carrierHz === freq ? "md-button-filled" : "md-button-outlined"
                        }`}
                        style={{ 
                          minHeight: '44px', 
                          minWidth: '60px',
                          backgroundColor: carrierHz === freq ? 'var(--md-sys-color-primary)' : 'transparent',
                          borderColor: carrierHz === freq ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline)',
                          color: carrierHz === freq ? 'white' : 'var(--md-sys-color-primary)'
                        }}
                      >
                        {freq} Hz
                      </button>
                    ))}
                  </div>
                </div>

                {/* Brainwave Band Selector */}
                <div className="mb-6">
                  <h4 className="md-title-medium text-on-surface-variant mb-3 text-center">Brainwave Band</h4>
                  <div className="flex gap-1 sm:gap-2 flex-wrap justify-center">
                    {Object.entries(BAND_RANGES).map(([key, config]) => (
                      <button
                        key={key}
                        onClick={() => setBand(key as keyof typeof BAND_RANGES)}
                        className={`md-button text-sm sm:text-base ${
                          band === key ? "md-button-filled" : "md-button-outlined"
                        }`}
                        style={{
                          backgroundColor: band === key ? config.color : "transparent",
                          borderColor: band === key ? config.color : "var(--md-sys-color-outline)",
                          color: band === key ? "white" : "var(--md-sys-color-primary)",
                          minHeight: '44px',
                          width: '70px'
                        }}
                      >
                        <div className="flex flex-col items-center">
                          <div className="text-lg font-bold">
                            {key === "delta" ? "δ" : 
                             key === "theta" ? "θ" : 
                             key === "alpha" ? "α" : 
                             key === "beta" ? "β" : 
                             key === "gamma" ? "γ" : key}
                          </div>
                          <div className="text-xs">
                            {key === "delta" ? "Delta" : 
                             key === "theta" ? "Theta" : 
                             key === "alpha" ? "Alpha" : 
                             key === "beta" ? "Beta" : 
                             key === "gamma" ? "Gamma" : key}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Offset Frequency */}
                <div className="mb-6">
                  <h4 className="md-title-medium text-on-surface-variant mb-3 text-center">Offset Frequency</h4>
                  <div className="md-title-large text-on-surface mb-2 text-center">
                    {offsetHz.toFixed(1)} Hz
                  </div>
                  <input
                    type="range"
                    min={BAND_RANGES[band].min}
                    max={BAND_RANGES[band].max}
                    step={0.1}
                    value={offsetHz}
                    onChange={(e) => setOffsetHz(parseFloat(e.target.value))}
                    className="md-slider"
                    style={{ margin: '16px' }}
                  />

                </div>

                {/* Binaural Volume */}
                <div>
                  <h4 className="md-title-medium text-on-surface-variant mb-3 text-center">Binaural Volume</h4>
                  <div className="md-title-large text-on-surface mb-2 text-center">
                    {Math.round(volume * 100)}%
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="md-slider"
                    style={{ margin: '16px' }}
                  />
                </div>
              </div>

              {/* Noise Generator Section */}
              <div className="bg-surface-container">
                <h3 className="md-headline-small text-primary text-center m-0">Noise Generator</h3>
                
                {/* White Noise Toggle */}
                <div className="flex items-center justify-center mb-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={overlaySound === "white-noise"}
                      onChange={(e) => {
                        const newSound = e.target.checked ? "white-noise" : "none";
                        setOverlaySound(newSound);
                        
                        // Only start white noise if binaural beats are playing
                        if (newSound === "white-noise" && audioEngine.getIsPlaying()) {
                          overlayAudioEngine.transitionTo("white-noise", overlayVolume);
                        } else if (newSound === "none") {
                          overlayAudioEngine.transitionTo("none");
                        }
                        // If checking white noise but binaural not playing, just save the preference
                        // White noise will start automatically when binaural beats start
                      }}
                      className="w-5 h-5 accent-primary"
                    />
                    <span className="md-title-medium text-on-surface">White Noise</span>
                  </label>
                </div>
                
                {overlaySound !== "none" && (
                  <div className="space-y-6">
                    {/* Noise Volume */}
                    <div>
                      <h4 className="md-title-medium text-on-surface-variant mb-3 text-center">Noise Volume</h4>
                      <div className="md-title-large text-on-surface mb-2 text-center">
                        {Math.round(overlayVolume * 2500)}%
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={1}
                        value={overlayVolume * 2500}
                        onChange={(e) => setOverlayVolume(parseFloat(e.target.value) / 2500)}
                        className="md-slider"
                        style={{ margin: '16px' }}
                      />
                    </div>
                    
                    {/* Low-Pass Filter */}
                    <div>
                      <h4 className="md-title-medium text-on-surface-variant mb-3 text-center">Low-Pass Filter</h4>
                      <div className="md-title-large text-on-surface mb-2 text-center">
                        {overlayLowPassFreq} Hz
                      </div>
                      <input
                        type="range"
                        min={0}
                        max="100"
                        step="1"
                        value={((overlayLowPassFreq - 500) / (8000 - 500)) * 100}
                        onChange={(e) => {
                          const sliderValue = parseFloat(e.target.value) / 100;
                          const freq = 500 + (sliderValue * (8000 - 500));
                          setOverlayLowPassFreq(freq);
                        }}
                        className="md-slider"
                        style={{ margin: '16px' }}
                      />

                    </div>
                  </div>
                )}
              </div>
            </div>
      </div>
        </div>,
        document.body
      )}

      {/* About Modal */}
      {isAboutOpen && createPortal(
        <div className="settings-modal-overlay">
          <div className="settings-modal-content max-w-[95vw] max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="md-headline-small text-on-surface text-center m-0">About FocusTones</h3>
              <button
                onClick={() => setIsAboutOpen(false)}
                className="close-button"
                aria-label="Close about"
              >
                ×
        </button>
            </div>

            {/* Content */}
            <div className="space-y-6">
              <div className="prose prose-invert max-w-none">
                <p className="md-body-large text-on-surface leading-relaxed">
                  I created FocusTone.co to aid in my own practice of deep work. The app generates customizable binaural tones designed to help guide the brain into different states of focus, rest, and creativity. Binaural beats work by nudging brainwaves into specific frequency ranges:
                </p>
                
                                <div className="space-y-2 mt-4">
                  <p className="md-body-medium text-on-surface">
                    <span className="font-semibold" style={{ color: '#21B5B0' }}>δ Delta (0.5–4 Hz):</span> Deep sleep, restoration, and healing.
                  </p>
                  <p className="md-body-medium text-on-surface">
                    <span className="font-semibold" style={{ color: '#26C3A8' }}>θ Theta (4–8 Hz):</span> Relaxation, meditation, and heightened creativity.
                  </p>
                  <p className="md-body-medium text-on-surface">
                    <span className="font-semibold" style={{ color: '#7BBE62' }}>α Alpha (8–12 Hz):</span> Calm, present awareness — ideal for light focus and flow.
                  </p>
                  <p className="md-body-medium text-on-surface">
                    <span className="font-semibold" style={{ color: '#B8A64B' }}>β Beta (12–30 Hz):</span> Active thinking, problem-solving, and alertness.
                  </p>
                  <p className="md-body-medium text-on-surface">
                    <span className="font-semibold" style={{ color: '#F2A23A' }}>γ Gamma (30+ Hz):</span> High-level cognition, memory, and peak concentration.
                  </p>
                </div>
                
                <p className="md-body-large text-on-surface leading-relaxed mt-4">
                  These states provide heuristic benefits — practical ways to align your mental state with the task at hand, whether that's entering flow, resting deeply, or sparking creativity. FocusTone.co grew out of my own need for simple, effective tools to sustain focus and intentional work.
                </p>
                
                <p className="md-body-large text-on-surface leading-relaxed mt-4">
                  You can learn more about me and my work at{' '}
                  <a 
                    href="https://tylercyert.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    tylercyert.com
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Welcome Modal for First-Time Visitors */}
      {isWelcomeOpen && createPortal(
        <div className="settings-modal-overlay">
          <div className="settings-modal-content max-w-[95vw] max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="md-headline-small text-on-surface text-center m-0">Welcome to FocusTone</h3>
              <button
                onClick={() => setIsWelcomeOpen(false)}
                className="close-button"
                aria-label="Close welcome"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="space-y-6">
              <div className="prose prose-invert max-w-none">
                <p className="md-body-large text-on-surface leading-relaxed">
                  I created FocusTone.co to aid in my own practice of deep work. The app generates customizable binaural tones designed to help guide the brain into different states of focus, rest, and creativity. Binaural beats work by nudging brainwaves into specific frequency ranges:
                </p>
                
                <div className="space-y-2 mt-4">
                  <p className="md-body-medium text-on-surface">
                    <span className="font-semibold" style={{ color: '#21B5B0' }}>δ Delta (0.5–4 Hz):</span> Deep sleep, restoration, and healing.
                  </p>
                  <p className="md-body-medium text-on-surface">
                    <span className="font-semibold" style={{ color: '#26C3A8' }}>θ Theta (4–8 Hz):</span> Relaxation, meditation, and heightened creativity.
                  </p>
                  <p className="md-body-medium text-on-surface">
                    <span className="font-semibold" style={{ color: '#7BBE62' }}>α Alpha (8–12 Hz):</span> Calm, present awareness — ideal for light focus and flow.
                  </p>
                  <p className="md-body-medium text-on-surface">
                    <span className="font-semibold" style={{ color: '#B8A64B' }}>β Beta (12–30 Hz):</span> Active thinking, problem-solving, and alertness.
                  </p>
                  <p className="md-body-medium text-on-surface">
                    <span className="font-semibold" style={{ color: '#F2A23A' }}>γ Gamma (30+ Hz):</span> High-level cognition, memory, and peak concentration.
                  </p>
                </div>
                
                <p className="md-body-large text-on-surface leading-relaxed mt-4">
                  These states provide heuristic benefits — practical ways to align your mental state with the task at hand, whether that's entering flow, resting deeply, or sparking creativity. FocusTone.co grew out of my own need for simple, effective tools to sustain focus and intentional work.
                </p>
                
                <p className="md-body-large text-on-surface leading-relaxed mt-4">
                  You can learn more about me and my work at{' '}
                  <a 
                    href="https://tylercyert.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    tylercyert.com
                  </a>
                  .
                </p>

                {/* Get Started Button */}
                <div className="flex justify-center mt-8">
                  <button
                    onClick={() => {
                      localStorage.setItem('hasVisitedBefore', 'true');
                      setIsWelcomeOpen(false);
                    }}
                    className="md-button-filled px-8 py-3 text-lg"
                    style={{ minHeight: '48px', minWidth: '160px' }}
                  >
                    Get Started
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}



export default App

import './App.css'
import { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import MediaPlayerWindow from './components/MediaPlayerWindow'
import Win98Window from './components/Win98Window'
import BlogWindow from './components/BlogWindow'
import { useAppState, BAND_RANGES } from './state/appState'
import { audioEngine } from './audio/audioEngine'
import { overlayAudioEngine } from './audio/overlayAudio'

const BAND_SYMBOLS: Record<string, string> = {
  delta: "\u03B4", theta: "\u03B8", alpha: "\u03B1", beta: "\u03B2", gamma: "\u03B3"
};

function App() {
  const band = useAppState((s) => s.band)
  const offsetHz = useAppState((s) => s.offsetHz)
  const carrierHz = useAppState((s) => s.carrierHz)
  const volume = useAppState((s) => s.volume)
  const waveform = useAppState((s) => s.waveform)
  const isPlaying = useAppState((s) => s.isPlaying)

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

  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isAboutOpen, setIsAboutOpen] = useState(false)
  const [isBlogOpen, setIsBlogOpen] = useState(false)
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(() => {
    const hasVisited = localStorage.getItem('hasVisitedBefore');
    return !hasVisited;
  });
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false)

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (audioEngine.getIsPlaying()) {
        audioEngine.tune({ carrierHz, offsetHz, volume, waveform });
      }
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [band, carrierHz, offsetHz, volume, waveform])

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

  const toggle = useCallback(() => {
    const audioIsPlaying = audioEngine.getIsPlaying();
    const currentState = useAppState.getState();
    const { carrierHz: currentCarrierHz, offsetHz: currentOffsetHz, volume: currentVolume, waveform: currentWaveform, overlaySound: currentOverlaySound } = currentState;

    if (!audioIsPlaying) {
      audioEngine.start({ carrierHz: currentCarrierHz, offsetHz: currentOffsetHz, volume: currentVolume, waveform: currentWaveform })
      if (currentOverlaySound === "white-noise") {
        overlayAudioEngine.start("white-noise", overlayVolume);
      }
      setPlaying(true)
    } else {
      audioEngine.stop()
      overlayAudioEngine.stop()
      setPlaying(false)
    }
  }, [overlayVolume, setPlaying]);

  useEffect(() => {
    const handleOpenSettings = () => setIsSettingsOpen(true);
    const handleOpenAbout = () => setIsAboutOpen(true);
    const handleOpenBlog = () => setIsBlogOpen(true);
    window.addEventListener('openSettings', handleOpenSettings);
    window.addEventListener('openAbout', handleOpenAbout);
    window.addEventListener('openBlog', handleOpenBlog);
    return () => {
      window.removeEventListener('openSettings', handleOpenSettings);
      window.removeEventListener('openAbout', handleOpenAbout);
      window.removeEventListener('openBlog', handleOpenBlog);
    };
  }, []);

  // Close start menu when clicking elsewhere
  useEffect(() => {
    if (!isStartMenuOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.win98-start-menu') && !target.closest('.win98-start-btn')) {
        setIsStartMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isStartMenuOpen]);

  // Current time for the system tray clock
  const [clock, setClock] = useState(() => {
    const d = new Date();
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  });
  useEffect(() => {
    const interval = setInterval(() => {
      const d = new Date();
      setClock(d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ background: 'var(--win98-desktop)', width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Desktop Icons */}
      <div style={{ position: 'fixed', top: 12, left: 12, zIndex: 5, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button className="win98-desktop-icon" onClick={() => setIsSettingsOpen(true)} tabIndex={0}>
          <span className="win98-desktop-icon-img">&#9881;</span>
          <span className="win98-desktop-icon-label">Sound<br/>Control</span>
        </button>
        <button className="win98-desktop-icon" onClick={() => setIsBlogOpen(true)} tabIndex={0}>
          <span className="win98-desktop-icon-img">&#128196;</span>
          <span className="win98-desktop-icon-label">The<br/>Zine</span>
        </button>
        <button className="win98-desktop-icon" onClick={() => setIsAboutOpen(true)} tabIndex={0}>
          <span className="win98-desktop-icon-img">&#9432;</span>
          <span className="win98-desktop-icon-label">About</span>
        </button>
      </div>

      {/* Media Player Window - centered on desktop */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 30,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        pointerEvents: 'none',
        zIndex: 8,
      }}>
        <div style={{ pointerEvents: 'auto', width: 420, maxWidth: 'calc(100vw - 24px)' }}>
          <MediaPlayerWindow onToggle={toggle} />
        </div>
      </div>

      {/* Win98 Taskbar */}
      <div className="win98-taskbar" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100 }}>
        {/* Start Button */}
        <button
          className={`win98-start-btn ${isStartMenuOpen ? 'active' : ''}`}
          onClick={() => setIsStartMenuOpen(!isStartMenuOpen)}
        >
          <span style={{ fontSize: 14 }}>&#127988;</span>
          <span>Start</span>
        </button>

        <div className="win98-taskbar-divider" />

        {/* Taskbar Items for open windows */}
        {isSettingsOpen && (
          <button
            className="win98-taskbar-item active"
            onClick={() => setIsSettingsOpen(true)}
          >
            &#9881; Sound Control
          </button>
        )}
        {isBlogOpen && (
          <button
            className="win98-taskbar-item active"
            onClick={() => setIsBlogOpen(true)}
          >
            &#128196; The Zine
          </button>
        )}
        {isAboutOpen && (
          <button
            className="win98-taskbar-item active"
            onClick={() => setIsAboutOpen(true)}
          >
            &#9432; About
          </button>
        )}

        {/* Media Player taskbar item */}
        <button className="win98-taskbar-item active">
          &#127925; FocusTones Player
        </button>

        {/* System Tray */}
        <div className="win98-systray">
          {isPlaying && <span title="Audio playing" style={{ fontSize: 12 }}>&#128266;</span>}
          <span>{clock}</span>
        </div>
      </div>

      {/* Start Menu */}
      {isStartMenuOpen && (
        <div className="win98-start-menu" style={{ zIndex: 101 }}>
          <div className="win98-start-menu-sidebar">
            <span className="win98-start-menu-sidebar-text">FocusTones98</span>
          </div>
          <div className="win98-start-menu-items">
            <div
              className="win98-start-menu-item"
              onClick={() => { setIsSettingsOpen(true); setIsStartMenuOpen(false); }}
            >
              <span className="win98-start-menu-item-icon">&#9881;</span>
              <span>Sound Control Panel</span>
            </div>
            <div
              className="win98-start-menu-item"
              onClick={() => { setIsBlogOpen(true); setIsStartMenuOpen(false); }}
            >
              <span className="win98-start-menu-item-icon">&#128196;</span>
              <span>The Zine</span>
            </div>
            <div
              className="win98-start-menu-item"
              onClick={() => { setIsAboutOpen(true); setIsStartMenuOpen(false); }}
            >
              <span className="win98-start-menu-item-icon">&#9432;</span>
              <span>About FocusTones</span>
            </div>
            <div className="win98-start-menu-separator" />
            <div
              className="win98-start-menu-item"
              onClick={() => { toggle(); setIsStartMenuOpen(false); }}
            >
              <span className="win98-start-menu-item-icon">{isPlaying ? '&#9209;' : '&#9654;'}</span>
              <span>{isPlaying ? 'Stop Playback' : 'Start Playback'}</span>
            </div>
            <div className="win98-start-menu-separator" />
            <a
              className="win98-start-menu-item"
              href="https://github.com/tylercyert"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none', color: 'inherit' }}
              onClick={() => setIsStartMenuOpen(false)}
            >
              <span className="win98-start-menu-item-icon">&#128279;</span>
              <span>Tyler Cyert (GitHub)</span>
            </a>
          </div>
        </div>
      )}

      {/* === SETTINGS MODAL === */}
      {isSettingsOpen && createPortal(
        <div className="win98-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsSettingsOpen(false); }}>
          <Win98Window
            title="Sound Control Panel"
            icon="&#9881;"
            onClose={() => setIsSettingsOpen(false)}
            statusBar={
              <div className="win98-statusbar-section">
                {isPlaying ? `Playing: ${band} @ ${offsetHz.toFixed(1)}Hz` : 'Stopped'}
              </div>
            }
          >
            {/* Binaural Generator Group */}
            <div className="win98-groupbox" style={{ marginTop: 4 }}>
              <span className="win98-groupbox-label">Binaural Generator</span>

              {/* Carrier Frequency */}
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

              {/* Brainwave Band */}
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

              {/* Offset Frequency */}
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

              {/* Volume */}
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

            {/* Noise Generator Group */}
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

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--win98-button-shadow)' }}>
              <button className="win98-btn" onClick={toggle} style={{ minWidth: 80 }}>
                {isPlaying ? '&#9209; Stop' : '&#9654; Play'}
              </button>
              <button className="win98-btn" onClick={() => setIsSettingsOpen(false)} style={{ minWidth: 80 }}>
                OK
              </button>
            </div>
          </Win98Window>
        </div>,
        document.body
      )}

      {/* === ABOUT MODAL === */}
      {isAboutOpen && createPortal(
        <div className="win98-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsAboutOpen(false); }}>
          <Win98Window
            title="About FocusTones"
            icon="&#9432;"
            onClose={() => setIsAboutOpen(false)}
          >
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
              <button className="win98-btn win98-btn-default" onClick={() => setIsAboutOpen(false)} style={{ minWidth: 80 }}>
                OK
              </button>
            </div>
          </Win98Window>
        </div>,
        document.body
      )}

      {/* === BLOG MODAL === */}
      {isBlogOpen && createPortal(
        <div className="win98-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsBlogOpen(false); }}>
          <BlogWindow onClose={() => setIsBlogOpen(false)} />
        </div>,
        document.body
      )}

      {/* === WELCOME MODAL === */}
      {isWelcomeOpen && createPortal(
        <div className="win98-modal-overlay">
          <Win98Window
            title="Welcome to FocusTones 98"
            icon="&#128075;"
          >
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
                  <div>&#128196; <b>The Zine</b> for articles about beats, ambient & DnB</div>
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
                onClick={() => {
                  localStorage.setItem('hasVisitedBefore', 'true');
                  setIsWelcomeOpen(false);
                }}
                style={{ minWidth: 100 }}
              >
                Get Started
              </button>
            </div>
          </Win98Window>
        </div>,
        document.body
      )}
    </div>
  )
}

export default App

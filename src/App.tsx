import './App.css'
import { useEffect, useState, useCallback } from 'react'
import WindowLayer from './components/WindowLayer'
import Taskbar from './components/Taskbar'
import { useAppState } from './state/appState'
import { useWindowState } from './state/windowState'
import { articles, articleWindowId } from './content/articles'
import { audioEngine } from './audio/audioEngine'
import { overlayAudioEngine } from './audio/overlayAudio'

function App() {
  const band = useAppState((s) => s.band)
  const offsetHz = useAppState((s) => s.offsetHz)
  const carrierHz = useAppState((s) => s.carrierHz)
  const volume = useAppState((s) => s.volume)
  const waveform = useAppState((s) => s.waveform)
  const isPlaying = useAppState((s) => s.isPlaying)

  const setPlaying = useAppState((s) => s.setPlaying)

  const overlayVolume = useAppState((s) => s.overlayVolume)
  const overlayLowPassFreq = useAppState((s) => s.overlayLowPassFreq)

  const openWindow = useWindowState((s) => s.openWindow)

  // Open the media player + welcome (first visit) on mount.
  useEffect(() => {
    const centerX = Math.max(12, Math.floor((window.innerWidth - 420) / 2))
    const centerY = Math.max(12, Math.floor((window.innerHeight - 480) / 2) - 20)
    openWindow({
      kind: 'mediaPlayer',
      title: 'FocusTones Player',
      icon: '\u{1F3B5}',
      defaultPosition: { x: centerX, y: centerY },
      size: { width: 420 },
    })

    const hasVisited = localStorage.getItem('hasVisitedBefore')
    if (!hasVisited) {
      openWindow({
        kind: 'welcome',
        title: 'Welcome to FocusTones 98',
        icon: '\u{1F44B}',
        defaultPosition: { x: centerX + 40, y: centerY - 60 },
      })
    }
  }, [openWindow])

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

  const openSettings = useCallback(() => {
    openWindow({ kind: 'settings', title: 'Sound Control Panel', icon: '\u2699' })
  }, [openWindow])

  const openAbout = useCallback(() => {
    openWindow({ kind: 'about', title: 'About FocusTones', icon: '\u2139' })
  }, [openWindow])

  const openArticle = useCallback((articleId: string) => {
    const article = articles.find((a) => a.id === articleId)
    if (!article) return
    openWindow({
      kind: 'article',
      id: articleWindowId(articleId),
      title: `${article.shortTitle} - The Zine`,
      icon: '\u{1F4C4}',
      payload: { articleId },
    })
  }, [openWindow])

  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false)

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
        <button className="win98-desktop-icon" onClick={openSettings} tabIndex={0}>
          <span className="win98-desktop-icon-img">&#9881;</span>
          <span className="win98-desktop-icon-label">Sound<br/>Control</span>
        </button>
        <button className="win98-desktop-icon" onClick={openAbout} tabIndex={0}>
          <span className="win98-desktop-icon-img">&#9432;</span>
          <span className="win98-desktop-icon-label">About</span>
        </button>
        {articles.map((article) => (
          <button
            key={article.id}
            className="win98-desktop-icon"
            onClick={() => openArticle(article.id)}
            tabIndex={0}
          >
            <span className="win98-desktop-icon-img">{article.icon}</span>
            <span className="win98-desktop-icon-label" style={{ whiteSpace: 'pre-line' }}>
              {article.desktopLabel}
            </span>
          </button>
        ))}
      </div>

      <WindowLayer onToggle={toggle} />

      <Taskbar
        isStartMenuOpen={isStartMenuOpen}
        onToggleStart={() => setIsStartMenuOpen((v) => !v)}
        clock={clock}
      />

      {isStartMenuOpen && (
        <div className="win98-start-menu" style={{ zIndex: 9001 }}>
          <div className="win98-start-menu-sidebar">
            <span className="win98-start-menu-sidebar-text">FocusTones98</span>
          </div>
          <div className="win98-start-menu-items">
            <div
              className="win98-start-menu-item"
              onClick={() => { openSettings(); setIsStartMenuOpen(false); }}
            >
              <span className="win98-start-menu-item-icon">&#9881;</span>
              <span>Sound Control Panel</span>
            </div>
            <div
              className="win98-start-menu-item"
              onClick={() => { openAbout(); setIsStartMenuOpen(false); }}
            >
              <span className="win98-start-menu-item-icon">&#9432;</span>
              <span>About FocusTones</span>
            </div>
            <div className="win98-start-menu-separator" />
            {articles.map((article) => (
              <div
                key={article.id}
                className="win98-start-menu-item"
                onClick={() => { openArticle(article.id); setIsStartMenuOpen(false); }}
              >
                <span className="win98-start-menu-item-icon">{article.icon}</span>
                <span>{article.shortTitle}</span>
              </div>
            ))}
            <div className="win98-start-menu-separator" />
            <div
              className="win98-start-menu-item"
              onClick={() => { toggle(); setIsStartMenuOpen(false); }}
            >
              <span className="win98-start-menu-item-icon">{isPlaying ? '\u23F9' : '\u25B6'}</span>
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
    </div>
  )
}

export default App

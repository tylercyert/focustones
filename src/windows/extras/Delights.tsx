import { useCallback, useEffect, useRef, useState } from 'react';
import { strings } from '../../content/strings.ts';
import { useDesktop } from '../../desktop/context.ts';
import { useReducedMotion } from '../../desktop/hooks.ts';
import { playChord } from '../../engine/toy.ts';
import { listenEngine } from '../listen/engineAdapter.ts';
import { moveToTrash, showAlert, useAlert } from './actions.ts';
import { createIdleTimer, IDLE_MS } from './idle.ts';
import { completes, keyToken, push, swipeToken, type Token } from './konami.ts';
import { ScreenSaverScene } from './ScreenSaver.tsx';
import { FOLDER, folderSelection, present, settingsStore, trashStore } from './store.ts';

const editable = (el: EventTarget | null) => el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
let chordPlayed = false; // once per visit, on the first Play

/**
 * The desktop's hidden behaviors (issue #14), mounted once inside the desktop: the idle screen saver, the Konami code,
 * the startup chord on the first Play, Cmd/Ctrl+Delete to the Trash, and the alert after Empty Trash.
 */
export function Delights({ selected }: { selected: readonly string[] }) {
  const { openWindow, closeWindow, volume } = useDesktop();
  const reduced = useReducedMotion();
  const [saver, setSaver] = useState(false);
  const alert = useAlert();
  const root = useRef<HTMLDivElement>(null);
  const volumeRef = useRef(volume);
  volumeRef.current = volume;
  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  // Startup chord: the engine says "starting" synchronously inside the Play click, so this is still the user's gesture.
  useEffect(() => listenEngine().on('state', (s) => {
    if (s !== 'starting' || chordPlayed) return;
    chordPlayed = true;
    if (settingsStore.get().chord) playChord(volumeRef.current);
  }), []);

  // Screen saver after two idle minutes, only while the page is visible and focused and the saver is on.
  const saverOn = useRef(saver);
  saverOn.current = saver;
  useEffect(() => {
    const timer = createIdleTimer(IDLE_MS, () => !saverOn.current && settingsStore.get().saver && document.visibilityState === 'visible' && document.hasFocus(), () => setSaver(true));
    const poke = () => timer.poke();
    const events = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart'] as const;
    events.forEach((e) => window.addEventListener(e, poke, { passive: true }));
    const test = () => setSaver(true);
    window.addEventListener('focustones:saver', test);
    return () => { timer.stop(); events.forEach((e) => window.removeEventListener(e, poke)); window.removeEventListener('focustones:saver', test); };
  }, []);
  const wake = useCallback(() => setSaver(false), []);

  // The Konami code: keys anywhere outside a text field; on touch, swipes and taps on the bare desktop.
  const history = useRef<Token[]>([]);
  useEffect(() => {
    const desk = () => root.current?.closest('.desktop') as HTMLElement | null;
    const found = () => {
      history.current = [];
      const d = desk();
      if (d && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        d.setAttribute('data-wave', '');
        setTimeout(() => d.removeAttribute('data-wave'), 2600);
      }
      openWindow('credits');
    };
    const feed = (tk: Token | null) => {
      if (!tk) return;
      history.current = push(history.current, tk);
      if (completes(history.current)) found();
    };
    const onKey = (e: KeyboardEvent) => {
      if (editable(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      feed(keyToken(e.key));
    };
    let start: { x: number; y: number } | null = null;
    const bare = (el: EventTarget | null) => el instanceof Element && !!el.closest('.surface') && !el.closest('.win');
    const onDown = (e: PointerEvent) => { start = e.pointerType === 'touch' && bare(e.target) ? { x: e.clientX, y: e.clientY } : null; };
    const onUp = (e: PointerEvent) => {
      if (!start || e.pointerType !== 'touch') return;
      feed(swipeToken(e.clientX - start.x, e.clientY - start.y));
      start = null;
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('pointerdown', onDown); window.removeEventListener('pointerup', onUp); };
  }, [openWindow]);

  // Cmd/Ctrl+Delete moves the selection to the Trash: an item focused in the folder, else the folder icon.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || (e.key !== 'Backspace' && e.key !== 'Delete') || editable(e.target)) return;
      const inFolder = (document.activeElement as HTMLElement | null)?.closest?.(`[data-window="${FOLDER}"]`);
      const item = folderSelection.get();
      const target = inFolder && item && present(trashStore.get(), item) ? item : selectedRef.current.includes(FOLDER) ? FOLDER : null;
      if (!target) return;
      e.preventDefault();
      moveToTrash([target], closeWindow);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeWindow]);

  return (
    <div ref={root} className="dx-root">
      {saver && <ScreenSaverScene onWake={wake} />}
      {alert && <Alert text={alert} reduced={reduced} />}
    </div>
  );
}

/** A classic alert box: the message, and OK (Return, Esc or a click outside also dismiss it). */
function Alert({ text, reduced }: { text: string; reduced: boolean }) {
  const ok = useRef<HTMLButtonElement>(null);
  const back = useRef<Element | null>(null);
  const close = useCallback(() => { showAlert(null); (back.current as HTMLElement | null)?.focus?.({ preventScroll: true }); }, []);
  useEffect(() => {
    back.current = document.activeElement;
    ok.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' || e.key === 'Enter') { e.preventDefault(); close(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);
  return (
    <div className="dx-alert-layer" onPointerDown={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="dx-alert" role="alertdialog" aria-modal="true" aria-labelledby="dx-alert-text" data-still={reduced || undefined}>
        <span className="dx-alert-icon" aria-hidden="true">
          <svg width="32" height="32" viewBox="0 0 32 32" shapeRendering="crispEdges"><rect x="2" y="2" width="28" height="28" fill="#fff" stroke="#000" /><rect x="14" y="7" width="4" height="12" /><rect x="14" y="22" width="4" height="4" /></svg>
        </span>
        <p id="dx-alert-text">{text}</p>
        <button ref={ok} type="button" className="dx-btn dx-btn-default" onClick={close}>{strings.delights.trash.ok}</button>
      </div>
    </div>
  );
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { strings } from '../../content/strings.ts';
import { useDesktop } from '../../desktop/context.ts';
import { useReducedMotion } from '../../desktop/hooks.ts';
import { playChord, setToyVolume, stopToys } from '../../engine/toy.ts';
import { listenEngine } from '../listen/engineAdapter.ts';
import { alertReturnTarget, moveToTrash, showAlert, useAlert } from './actions.ts';
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
  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  // Every delight sound follows the desktop's volume live (muting silences one already playing); unmounting stops them.
  useEffect(() => { setToyVolume(volume); }, [volume]);
  useEffect(() => () => stopToys(), []);

  // Startup chord: the engine says "starting" synchronously inside the Play click, so this is still the user's gesture.
  useEffect(() => listenEngine().on('state', (s) => {
    if (s !== 'starting' || chordPlayed) return;
    chordPlayed = true;
    if (settingsStore.get().chord) playChord();
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
    // Touch: the browser may claim a swipe as a pan and cancel its pointer events (pointercancel, no pointerup), so this
    // follows touch events, which keep reporting positions, and reads the swipe at touchend or touchcancel alike.
    let touch: { id: number; x0: number; y0: number; x: number; y: number } | null = null;
    const bare = (el: EventTarget | null) => el instanceof Element && !!el.closest('.surface') && !el.closest('.win');
    const onStart = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      touch = e.touches.length === 1 && t && bare(e.target) ? { id: t.identifier, x0: t.clientX, y0: t.clientY, x: t.clientX, y: t.clientY } : null;
    };
    const find = (e: TouchEvent) => [...e.changedTouches].find((t) => t.identifier === touch?.id);
    const onMove = (e: TouchEvent) => { const t = find(e); if (t && touch) { touch.x = t.clientX; touch.y = t.clientY; } };
    const onEnd = (e: TouchEvent) => {
      const t = find(e);
      if (!t || !touch) return;
      if (e.type === 'touchend') { touch.x = t.clientX; touch.y = t.clientY; }
      feed(swipeToken(touch.x - touch.x0, touch.y - touch.y0));
      touch = null;
    };
    const passive = { passive: true } as const;
    window.addEventListener('keydown', onKey);
    window.addEventListener('touchstart', onStart, passive);
    window.addEventListener('touchmove', onMove, passive);
    window.addEventListener('touchend', onEnd, passive);
    window.addEventListener('touchcancel', onEnd, passive);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onEnd);
    };
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

/**
 * A classic alert box, modal: focus starts on OK and Tab or Shift-Tab cannot leave it, the rest of the desktop is inert,
 * and the shell's shortcuts are held off while it is open. OK, Return or Esc (or a click outside) dismiss it, and
 * focus goes back to the control that emptied the Trash (or the nearest thing that still exists).
 */
function Alert({ text, reduced }: { text: string; reduced: boolean }) {
  const ok = useRef<HTMLButtonElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const close = useCallback(() => { showAlert(null); }, []);
  useEffect(() => {
    const desk = box.current?.closest('.desktop');
    const layer = box.current?.closest('.dx-root');
    const others = desk ? [...desk.children].filter((el) => el !== layer) : [];
    others.forEach((el) => el.setAttribute('inert', ''));
    ok.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') { e.preventDefault(); e.stopImmediatePropagation(); close(); return; }
      if (e.key === 'Tab') { e.preventDefault(); ok.current?.focus(); return; } // OK is the only control: focus stays on it
      if (e.key !== ' ' || document.activeElement !== ok.current) { e.stopImmediatePropagation(); if (e.metaKey || e.ctrlKey || e.altKey) e.preventDefault(); }
    };
    window.addEventListener('keydown', onKey, { capture: true });
    return () => {
      window.removeEventListener('keydown', onKey, { capture: true });
      others.forEach((el) => el.removeAttribute('inert'));
      alertReturnTarget()?.focus({ preventScroll: true });
    };
  }, [close]);
  return (
    <div className="dx-alert-layer" onPointerDown={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div ref={box} className="dx-alert" role="alertdialog" aria-modal="true" aria-labelledby="dx-alert-text" data-still={reduced || undefined}>
        <span className="dx-alert-icon" aria-hidden="true">
          <svg width="32" height="32" viewBox="0 0 32 32" shapeRendering="crispEdges"><rect x="2" y="2" width="28" height="28" fill="#fff" stroke="#000" /><rect x="14" y="7" width="4" height="12" /><rect x="14" y="22" width="4" height="4" /></svg>
        </span>
        <p id="dx-alert-text">{text}</p>
        <button ref={ok} type="button" className="dx-btn dx-btn-default" onClick={close}>{strings.delights.trash.ok}</button>
      </div>
    </div>
  );
}

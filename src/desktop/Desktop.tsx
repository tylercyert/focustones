import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState, type KeyboardEvent } from 'react';
import { strings } from '../content/strings.ts';
import { DesktopContext, type DesktopApi } from './context.ts';
import { DesktopIcon } from './DesktopIcon.tsx';
import { usePhone, useReducedMotion } from './hooks.ts';
import { MenuBar, type MenuDef, type MenuItem } from './MenuBar.tsx';
import { windowRegistry } from './registry.ts';
import { shellWindows } from './shellWindows.ts';
import { Startup } from './Startup.tsx';
import { Clock, Speaker } from './StatusItems.tsx';
import { initialState, loadSaved, reduce, save, type Size, type WindowDef } from './store.ts';
import { Switcher } from './Switcher.tsx';
import { WindowFrame } from './Window.tsx';
import './desktop.css';

const specs = [...windowRegistry, ...shellWindows];
const defs: WindowDef[] = specs.map((s) => ({ id: s.id, size: s.defaultSize, position: s.defaultPosition, openOnLaunch: s.openOnLaunch }));
const SEEN = 'focustones.startup.seen'; // set on the first visit; return visits skip the startup moment
const m = strings.menuBar;

export default function Desktop() {
  const phone = usePhone();
  const reduced = useReducedMotion();
  const [state, dispatch] = useReducer(reduce, undefined, () => initialState(defs, loadSaved()));
  const [selected, setSelected] = useState<string[]>([]);
  const [showDate, setShowDate] = useState(false);
  const [starting, setStarting] = useState(() => { try { return localStorage.getItem(SEEN) !== '1'; } catch { return true; } });
  const [surface, setSurface] = useState<Size>({ width: window.innerWidth, height: window.innerHeight - 24 });
  const surfaceEl = useRef<HTMLElement>(null);
  const booted = useRef(false);

  useEffect(() => { save(state); }, [state]);
  useEffect(() => { booted.current = true; }, []);
  useLayoutEffect(() => {
    const el = surfaceEl.current;
    if (!el) return;
    const read = () => setSurface({ width: el.clientWidth, height: el.clientHeight });
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const endStartup = useCallback(() => { setStarting(false); try { localStorage.setItem(SEEN, '1'); } catch { /* ignore */ } }, []);
  const showStartup = starting && !reduced;

  const openWindow = useCallback((id: string) => dispatch({ type: 'open', id }), []);
  const closeWindow = useCallback((id: string) => dispatch({ type: 'close', id }), []);
  const api = useMemo<DesktopApi>(
    () => ({ volume: state.volume, setVolume: (volume) => dispatch({ type: 'setVolume', volume }), openWindow, closeWindow, phone }),
    [state.volume, openWindow, closeWindow, phone],
  );

  const byId = useMemo(() => new Map(specs.map((s) => [s.id, s])), []);
  const active = state.active;
  const activeState = active ? state.rects[active] : null;

  // When the last window closes, focus returns to the desktop so keyboard users are not left on a removed element.
  const surfaceFocus = useRef(active);
  useEffect(() => {
    if (surfaceFocus.current && !active && booted.current) surfaceEl.current?.focus({ preventScroll: true });
    surfaceFocus.current = active;
  }, [active]);

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'w' && active && !e.defaultPrevented) {
        e.preventDefault();
        dispatch({ type: 'close', id: active });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active]);

  const openNames = state.order.map((id) => byId.get(id)!).filter(Boolean);
  const cycle = () => { if (state.order.length > 1) dispatch({ type: 'focus', id: state.order[0] }); };
  const desktopSpecs = specs.filter((s) => s.showOnDesktop !== false);
  const trash = desktopSpecs.find((s) => s.id === 'trash');
  const others = desktopSpecs.filter((s) => s.id !== 'trash');
  const canResize = active ? byId.get(active)?.resizable !== false : false;

  const menus: MenuDef[] = [
    { id: 'app', label: m.appMenu, ariaLabel: m.appMenuLabel, icon: 'app', items: [
      { kind: 'item', label: m.about, onSelect: () => openWindow('about') },
      { kind: 'sep' },
      { kind: 'item', label: m.replayStartup, onSelect: () => setStarting(true) },
    ] },
    { id: 'file', label: m.file, items: [
      ...specs.filter((s) => s.showOnDesktop !== false && s.id !== 'trash').map((s) => ({ kind: 'item' as const, label: `${m.open} ${s.title}`, onSelect: () => openWindow(s.id) })),
      { kind: 'sep' },
      { kind: 'item', label: m.closeWindow, shortcut: 'W', disabled: !active, onSelect: () => active && dispatch({ type: 'close', id: active }) },
      { kind: 'item', label: m.closeAll, disabled: state.order.length === 0, onSelect: () => dispatch({ type: 'closeAll' }) },
    ] },
    { id: 'edit', label: m.edit, items: [
      { kind: 'item', label: m.selectAll, onSelect: () => setSelected(others.concat(trash ? [trash] : []).map((x) => x.id)) },
      { kind: 'item', label: m.deselectAll, disabled: selected.length === 0, onSelect: () => setSelected([]) },
    ] },
    { id: 'view', label: m.view, items: [
      { kind: 'item', label: m.cleanUp, onSelect: () => dispatch({ type: 'cleanUp', defs }) },
      { kind: 'item', label: m.showDate, checked: showDate, onSelect: () => setShowDate(!showDate) },
    ] },
    { id: 'window', label: m.window, items: [
      ...(phone ? [] : ([
        { kind: 'item', label: m.zoom, disabled: !active || !canResize, onSelect: () => active && dispatch({ type: 'toggleZoom', id: active }) },
        { kind: 'item', label: activeState?.collapsed ? m.expand : m.collapse, disabled: !active, onSelect: () => active && dispatch({ type: 'toggleCollapse', id: active }) },
      ] as MenuItem[])),
      { kind: 'item', label: m.nextWindow, disabled: state.order.length < 2, onSelect: cycle },
      { kind: 'item', label: m.showDesktop, disabled: !active, onSelect: () => dispatch({ type: 'showDesktop' }) },
      { kind: 'sep' },
      ...(openNames.length
        ? [...openNames].reverse().map((s) => ({ kind: 'item' as const, label: s.title, checked: s.id === active, onSelect: () => dispatch({ type: 'open', id: s.id }) }))
        : [{ kind: 'item' as const, label: m.noWindows, disabled: true, onSelect: () => undefined }]),
    ] },
    { id: 'help', label: m.help, items: [{ kind: 'item', label: m.desktopHelp, onSelect: () => openWindow('help') }] },
  ];
  const shownMenus = phone ? menus.filter((x) => x.id !== 'edit' && x.id !== 'view') : menus;

  const iconKeys = (e: KeyboardEvent) => {
    const keys = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 } as const;
    const dir = keys[e.key as keyof typeof keys];
    if (!dir) return;
    const all = [...e.currentTarget.querySelectorAll<HTMLElement>('.dicon')];
    const i = all.indexOf(document.activeElement as HTMLElement);
    if (i < 0) return;
    e.preventDefault();
    all[(i + dir + all.length) % all.length].focus();
  };

  const icon = (s: (typeof specs)[number], className?: string) => (
    <DesktopIcon key={s.id} id={s.id} label={s.iconLabel ?? s.title} icon={s.icon} selected={selected.includes(s.id)} phone={phone} className={className} onSelect={(id) => setSelected([id])} onOpen={openWindow} />
  );

  return (
    <DesktopContext.Provider value={api}>
      <div className={`desktop${phone ? ' is-phone' : ''}`}>
        <MenuBar label={m.menuBarLabel} menus={shownMenus}>
          <Speaker volume={state.volume} onChange={api.setVolume} />
          <Clock showDate={showDate && !phone} onToggle={() => setShowDate(!showDate)} />
        </MenuBar>
        <main className="surface" ref={surfaceEl} tabIndex={-1} aria-label={strings.desktop.surfaceLabel} onPointerDown={(e) => { if (e.target === e.currentTarget) setSelected([]); }}>
          <nav className="icons" aria-label={strings.desktop.iconsLabel} onKeyDown={iconKeys} hidden={phone && active !== null}>
            {others.map((s) => icon(s))}
            {trash && icon(trash, 'dicon-trash')}
          </nav>
          {specs.filter((s) => state.order.includes(s.id)).map((s) => (
            <WindowFrame
              key={s.id} spec={s} st={state.rects[s.id]} z={10 + state.order.indexOf(s.id)} active={active === s.id}
              phone={phone} hidden={phone && active !== s.id} surface={surface} booted={booted} dispatch={dispatch}
            />
          ))}
        </main>
        {phone && (
          <Switcher
            label={strings.desktop.switcherLabel} desktopLabel={strings.desktop.switcherDesktop}
            items={state.order.map((id) => byId.get(id)!).filter(Boolean).map((s) => ({ id: s.id, title: s.title, short: s.shortTitle ?? s.title, icon: s.icon }))}
            active={active} onPick={(id) => dispatch({ type: 'focus', id })} onDesktop={() => dispatch({ type: 'showDesktop' })}
          />
        )}
        {showStartup && <Startup onDone={endStartup} />}
      </div>
    </DesktopContext.Provider>
  );
}

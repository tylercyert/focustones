import { useEffect, useId, useRef, useState, type MutableRefObject, type PointerEvent as RPointerEvent } from 'react';
import { strings } from '../content/strings.ts';
import { Icon } from './icons.tsx';
import { clampRect, type Action, type Rect, type Size, type WinState } from './store.ts';
import type { WindowSpec } from './types.ts';

export const TITLE_H = 24;
const MIN_DEFAULT: Size = { width: 220, height: 140 };

interface Props {
  spec: WindowSpec; st: WinState; z: number; active: boolean; phone: boolean; hidden: boolean;
  surface: Size; booted: MutableRefObject<boolean>; dispatch: (a: Action) => void;
}

export function WindowFrame({ spec, st, z, active, phone, hidden, surface, booted, dispatch }: Props) {
  const titleId = useId();
  const frame = useRef<HTMLElement>(null);
  const [live, setLive] = useState<Rect | null>(null);
  const gesture = useRef<{ kind: 'move' | 'size'; px: number; py: number; from: Rect; last: Rect | null } | null>(null);
  const Body = spec.component;
  const resizable = spec.resizable !== false;
  const min = spec.minSize ?? MIN_DEFAULT;

  const base: Rect = st.zoomed
    ? { x: 8, y: 8, width: Math.max(min.width, surface.width - 16), height: Math.max(min.height, surface.height - 16) }
    : clampRect(st, surface);
  const rect = live ?? base;

  // Newly opened or newly focused windows take keyboard focus (not on first paint, so the page starts unfocused).
  useEffect(() => {
    if (active && booted.current && !hidden && !frame.current?.contains(document.activeElement)) frame.current?.focus({ preventScroll: true });
  }, [active, hidden, booted]);

  const begin = (e: RPointerEvent, kind: 'move' | 'size') => {
    if (phone || e.button !== 0) return;
    gesture.current = { kind, px: e.clientX, py: e.clientY, from: base, last: null };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const track = (e: RPointerEvent) => {
    const g = gesture.current;
    if (!g) return;
    const dx = e.clientX - g.px, dy = e.clientY - g.py;
    if (!g.last && Math.abs(dx) + Math.abs(dy) < 3) return;
    const next: Rect = g.kind === 'move'
      ? clampRect({ ...g.from, x: g.from.x + dx, y: g.from.y + dy }, surface)
      : {
        ...g.from,
        width: Math.min(Math.max(min.width, g.from.width + dx), Math.max(min.width, surface.width - g.from.x)),
        height: Math.min(Math.max(min.height, g.from.height + dy), Math.max(min.height, surface.height - g.from.y)),
      };
    g.last = next;
    setLive(next);
  };
  const end = () => {
    const g = gesture.current;
    gesture.current = null;
    if (g?.last) {
      if (g.kind === 'move') dispatch({ type: 'move', id: spec.id, x: g.last.x, y: g.last.y });
      else {
        dispatch({ type: 'move', id: spec.id, x: g.last.x, y: g.last.y });
        dispatch({ type: 'resize', id: spec.id, width: g.last.width, height: g.last.height, min });
      }
    }
    setLive(null);
  };

  const style = phone
    ? { zIndex: z }
    : { zIndex: z, left: rect.x, top: rect.y, width: rect.width, height: st.collapsed ? TITLE_H + 2 : rect.height };

  return (
    <section
      ref={frame} className="win" role="dialog" aria-labelledby={titleId} tabIndex={-1} hidden={hidden}
      data-window={spec.id} data-active={active || undefined} data-collapsed={st.collapsed || undefined} data-moving={live ? '' : undefined}
      style={style}
      onPointerDownCapture={() => { if (!active) dispatch({ type: 'focus', id: spec.id }); }}
    >
      <div
        className="win-title" onPointerDown={(e) => { if (!(e.target as HTMLElement).closest('button')) begin(e, 'move'); }}
        onPointerMove={track} onPointerUp={end} onPointerCancel={end}
        onDoubleClick={(e) => { if (!phone && !(e.target as HTMLElement).closest('button')) dispatch({ type: 'toggleCollapse', id: spec.id }); }}
      >
        <button type="button" className="win-box win-close" aria-label={strings.desktop.close} onClick={() => dispatch({ type: 'close', id: spec.id })}><i /></button>
        <h2 className="win-name" id={titleId}><span><Icon name={spec.icon} size={16} />{spec.title}</span></h2>
        {resizable && !phone && (
          <button type="button" className="win-box win-zoom" aria-label={strings.desktop.zoom} aria-pressed={st.zoomed} onClick={() => dispatch({ type: 'toggleZoom', id: spec.id })}><i /></button>
        )}
        {!phone && (
          <button type="button" className="win-box win-shade" aria-label={st.collapsed ? strings.desktop.expand : strings.desktop.collapse} aria-expanded={!st.collapsed} onClick={() => dispatch({ type: 'toggleCollapse', id: spec.id })}><i /></button>
        )}
      </div>
      <div className="win-body" hidden={st.collapsed && !phone}><Body /></div>
      {resizable && !phone && !st.collapsed && (
        <div
          className="win-grow" role="presentation" title={strings.desktop.resize}
          onPointerDown={(e) => begin(e, 'size')} onPointerMove={track} onPointerUp={end} onPointerCancel={end}
        />
      )}
    </section>
  );
}

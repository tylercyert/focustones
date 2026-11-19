import { useLayoutEffect, useRef, useState, type PointerEvent } from 'react';
import { Icon } from './icons.tsx';

export interface IconOffset { dx: number; dy: number }

interface Props {
  id: string; label: string; icon: string; selected: boolean; phone: boolean; className?: string;
  onSelect: (id: string) => void; onOpen: (id: string) => void;
  /** Optional (issue #14): how far the icon has been moved from its place in the column. */
  offset?: IconOffset;
  /** Optional (issue #14): with a mouse or pen, the icon can be dragged; these report where it goes. */
  draggable?: boolean;
  onDrag?: (id: string, x: number, y: number) => void;
  onDrop?: (id: string, offset: IconOffset, x: number, y: number) => void;
}

/** A desktop icon: click selects, double-click opens; touch, phones and the keyboard open on one activation. */
export function DesktopIcon({ id, label, icon, selected, phone, className, onSelect, onOpen, offset, draggable, onDrag, onDrop }: Props) {
  const pointer = useRef('mouse');
  const drag = useRef<{ px: number; py: number; from: IconOffset; min: IconOffset; max: IconOffset; moved: boolean; at: IconOffset } | null>(null);
  const dragged = useRef(false);
  const [live, setLive] = useState<IconOffset | null>(null);
  const el = useRef<HTMLButtonElement>(null);
  // A saved offset is kept as saved, but shown clamped to the surface: a smaller window must not strand an icon off-screen.
  // Phones lay icons out in a grid and ignore offsets entirely.
  const saved = phone ? undefined : offset;
  const [fit, setFit] = useState<IconOffset | null>(null);
  const applied = useRef<IconOffset>({ dx: 0, dy: 0 });
  useLayoutEffect(() => {
    const b = el.current;
    const surface = b?.closest('.surface');
    if (!b || !surface || !saved) { setFit(null); return; }
    const place = () => {
      const s = surface.getBoundingClientRect();
      const r = b.getBoundingClientRect();
      const left = r.left - applied.current.dx, top = r.top - applied.current.dy; // where the column puts the icon
      const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, Math.ceil(lo)), Math.max(Math.ceil(lo), Math.floor(hi))); // whole pixels, rounded inward
      const next = { dx: clamp(saved.dx, s.left - left, s.right - left - r.width), dy: clamp(saved.dy, s.top - top, s.bottom - top - r.height) };
      setFit((f) => (next.dx === saved.dx && next.dy === saved.dy ? null : f && f.dx === next.dx && f.dy === next.dy ? f : next));
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(surface);
    return () => ro.disconnect();
  }, [saved?.dx, saved?.dy]); // eslint-disable-line react-hooks/exhaustive-deps -- re-run on the saved numbers, not the object
  const shown = live ?? fit ?? saved;
  applied.current = shown ?? { dx: 0, dy: 0 };

  const begin = (e: PointerEvent<HTMLButtonElement>) => {
    if (!draggable || phone || e.button !== 0 || e.pointerType === 'touch') return;
    const from = shown ?? { dx: 0, dy: 0 };
    const r = e.currentTarget.getBoundingClientRect();
    const s = (e.currentTarget.closest('.surface') ?? document.body).getBoundingClientRect();
    // Keep the whole icon on the desktop surface.
    drag.current = {
      px: e.clientX, py: e.clientY, from, moved: false, at: from,
      min: { dx: from.dx + s.left - r.left, dy: from.dy + s.top - r.top },
      max: { dx: from.dx + s.right - r.right, dy: from.dy + s.bottom - r.bottom },
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const track = (e: PointerEvent) => {
    const g = drag.current;
    if (!g) return;
    const dx = e.clientX - g.px, dy = e.clientY - g.py;
    if (!g.moved && Math.hypot(dx, dy) < 4) return;
    g.moved = true;
    g.at = { dx: Math.round(Math.min(g.max.dx, Math.max(g.min.dx, g.from.dx + dx))), dy: Math.round(Math.min(g.max.dy, Math.max(g.min.dy, g.from.dy + dy))) };
    setLive(g.at);
    onDrag?.(id, e.clientX, e.clientY);
  };
  const end = (e: PointerEvent) => {
    const g = drag.current;
    drag.current = null;
    if (g?.moved) { dragged.current = true; onDrop?.(id, g.at, e.clientX, e.clientY); }
    setLive(null);
  };

  return (
    <button
      ref={el} type="button" className={`dicon${className ? ` ${className}` : ''}`} data-selected={selected || undefined} data-icon={id}
      data-dragging={live ? '' : undefined}
      style={shown && (shown.dx || shown.dy) ? { transform: `translate(${shown.dx}px, ${shown.dy}px)` } : undefined}
      onPointerDown={(e) => { pointer.current = e.pointerType; begin(e); }}
      onPointerMove={track} onPointerUp={end} onPointerCancel={() => { drag.current = null; setLive(null); }}
      onClick={(e) => {
        if (dragged.current) { dragged.current = false; onSelect(id); return; } // the click that ends a drag only selects
        if (phone || pointer.current === 'touch' || e.detail === 0) onOpen(id);
        else onSelect(id);
        pointer.current = 'mouse';
      }}
      onDoubleClick={() => onOpen(id)}
      onFocus={() => onSelect(id)}
    >
      <Icon name={icon} size={phone ? 48 : 40} className="dicon-art" />
      <span className="dicon-label">{label}</span>
    </button>
  );
}

// The desktop's state as a pure reducer, so every window rule is testable without a browser.
export interface Rect { x: number; y: number; width: number; height: number }
export interface WinState extends Rect { collapsed: boolean; zoomed: boolean }
export interface Size { width: number; height: number }

export interface WindowDef {
  id: string;
  size: Size;
  position: { x: number; y: number };
  openOnLaunch: boolean;
}

export interface DesktopState {
  /** Open window ids, back to front. */
  order: string[];
  /** The focused window, or null when the desktop itself is in front. */
  active: string | null;
  rects: Record<string, WinState>;
  volume: number;
}

export type Action =
  | { type: 'open'; id: string }
  | { type: 'close'; id: string }
  | { type: 'focus'; id: string }
  | { type: 'showDesktop' }
  | { type: 'toggleCollapse'; id: string }
  | { type: 'toggleZoom'; id: string }
  | { type: 'move'; id: string; x: number; y: number }
  | { type: 'resize'; id: string; width: number; height: number; min: Size }
  | { type: 'cleanUp'; defs: readonly WindowDef[]; surface?: Size }
  | { type: 'closeAll' }
  | { type: 'setVolume'; volume: number };

export interface Saved { rects: Record<string, WinState>; volume?: number }

const STORAGE_KEY = 'focustones.desktop.v1';
const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);

export function parseSaved(raw: string | null): Saved | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as { version?: unknown; rects?: Record<string, Record<string, unknown>>; volume?: unknown };
    if (data?.version !== 1 || typeof data.rects !== 'object' || data.rects === null) return null;
    const rects: Record<string, WinState> = {};
    for (const [id, r] of Object.entries(data.rects)) {
      if (finite(r?.x) && finite(r?.y) && finite(r?.width) && finite(r?.height)) {
        rects[id] = { x: r.x, y: r.y, width: r.width, height: r.height, collapsed: r.collapsed === true, zoomed: r.zoomed === true };
      }
    }
    const volume = finite(data.volume) ? Math.min(1, Math.max(0, data.volume)) : undefined;
    return { rects, volume };
  } catch {
    return null;
  }
}

export function serialize(s: DesktopState): string {
  return JSON.stringify({ version: 1, rects: s.rects, volume: s.volume });
}

export function loadSaved(): Saved | null {
  try { return parseSaved(localStorage.getItem(STORAGE_KEY)); } catch { return null; }
}

export function save(s: DesktopState): void {
  try { localStorage.setItem(STORAGE_KEY, serialize(s)); } catch { /* storage off: positions just do not persist */ }
}

/** The strip down the right-hand side that the desktop icons use: a fresh window keeps clear of it. */
export const ICON_COLUMN = 124;
const MARGIN = 8;

/**
 * Where a window opens by default on this surface: its own position and size when they fit; otherwise moved left to
 * stay clear of the icon column, then narrowed and shortened to fit (never off the edge, never under the icons).
 */
export function fitToSurface(d: WindowDef, surface?: Size): Rect {
  const r = { x: d.position.x, y: d.position.y, width: d.size.width, height: d.size.height };
  if (!surface) return r;
  const right = surface.width - ICON_COLUMN;
  if (r.x + r.width > right) r.x = Math.max(MARGIN, right - r.width);
  r.width = Math.min(r.width, Math.max(240, right - r.x));
  r.height = Math.min(r.height, Math.max(200, surface.height - r.y - MARGIN));
  return r;
}

const fresh = (d: WindowDef, surface?: Size): WinState => ({ ...fitToSurface(d, surface), collapsed: false, zoomed: false });

export function initialState(defs: readonly WindowDef[], saved: Saved | null, surface?: Size): DesktopState {
  const rects: Record<string, WinState> = {};
  for (const d of defs) rects[d.id] = saved?.rects[d.id] ?? fresh(d, surface);
  const order = defs.filter((d) => d.openOnLaunch).map((d) => d.id);
  return { order, active: order.at(-1) ?? null, rects, volume: saved?.volume ?? 0.7 };
}

const front = (order: string[], id: string) => [...order.filter((o) => o !== id), id];

export function reduce(s: DesktopState, a: Action): DesktopState {
  const patch = (id: string, p: Partial<WinState>): DesktopState =>
    s.rects[id] ? { ...s, rects: { ...s.rects, [id]: { ...s.rects[id], ...p } } } : s;
  switch (a.type) {
    case 'open': {
      if (!s.rects[a.id]) return s;
      return { ...patch(a.id, { collapsed: false }), order: front(s.order, a.id), active: a.id };
    }
    case 'focus':
      return s.order.includes(a.id) ? { ...s, order: front(s.order, a.id), active: a.id } : s;
    case 'close': {
      if (!s.order.includes(a.id)) return s;
      const order = s.order.filter((o) => o !== a.id);
      return { ...s, order, active: s.active === a.id ? (order.at(-1) ?? null) : s.active };
    }
    case 'closeAll':
      return { ...s, order: [], active: null };
    case 'showDesktop':
      return { ...s, active: null };
    case 'toggleCollapse':
      return s.rects[a.id] ? patch(a.id, { collapsed: !s.rects[a.id].collapsed }) : s;
    case 'toggleZoom':
      return s.rects[a.id] ? patch(a.id, { zoomed: !s.rects[a.id].zoomed }) : s;
    case 'move':
      return patch(a.id, { x: a.x, y: a.y, zoomed: false });
    case 'resize':
      return patch(a.id, { width: Math.max(a.min.width, a.width), height: Math.max(a.min.height, a.height), zoomed: false });
    case 'cleanUp': {
      const rects = { ...s.rects };
      for (const d of a.defs) rects[d.id] = fresh(d, a.surface);
      return { ...s, rects };
    }
    case 'setVolume':
      return { ...s, volume: Math.min(1, Math.max(0, a.volume)) };
  }
}

/** Keeps at least 40 px of the title bar on screen and the whole bar below the menu bar. */
export function clampRect(r: Rect, surface: Size): Rect {
  const keep = 40;
  return {
    ...r,
    x: Math.min(Math.max(r.x, keep - r.width), surface.width - keep),
    y: Math.min(Math.max(r.y, 0), surface.height - 20),
  };
}

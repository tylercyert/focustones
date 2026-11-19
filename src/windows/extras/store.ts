// The delights' state (issue #14) as pure reducers plus two tiny external stores, so every rule is testable without a
// browser. Settings and icon positions persist on this device; the Trash is per visit (distractions come back next visit).
import { useSyncExternalStore } from 'react';
import { PATTERN_IDS } from './patterns.ts';

export interface Offset { dx: number; dy: number }

export interface Settings {
  /** A pattern id, or 'default' for the desktop's own background. */
  pattern: string;
  /** The screen saver starts after two idle minutes. */
  saver: boolean;
  /** A warm chord plays on the first Play of a visit. */
  chord: boolean;
  /** How far each moved desktop icon sits from its place in the column, in px. */
  icons: Record<string, Offset>;
}

export const DEFAULT_SETTINGS: Settings = { pattern: 'default', saver: true, chord: true, icons: {} };
export const SETTINGS_KEY = 'focustones.delights.v1';

const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);

export function parseSettings(raw: string | null): Settings {
  if (!raw) return DEFAULT_SETTINGS;
  try {
    const d = JSON.parse(raw) as Record<string, unknown>;
    if (!d || typeof d !== 'object' || d.version !== 1) return DEFAULT_SETTINGS;
    const icons: Record<string, Offset> = {};
    if (d.icons && typeof d.icons === 'object') {
      for (const [id, o] of Object.entries(d.icons as Record<string, Record<string, unknown>>)) {
        if (finite(o?.dx) && finite(o?.dy)) icons[id] = { dx: o.dx, dy: o.dy };
      }
    }
    return {
      pattern: typeof d.pattern === 'string' && (d.pattern === 'default' || PATTERN_IDS.includes(d.pattern)) ? d.pattern : 'default',
      saver: typeof d.saver === 'boolean' ? d.saver : DEFAULT_SETTINGS.saver,
      chord: typeof d.chord === 'boolean' ? d.chord : DEFAULT_SETTINGS.chord,
      icons,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export const serializeSettings = (s: Settings): string => JSON.stringify({ version: 1, ...s });

// ---- The Trash ---------------------------------------------------------------------------------------------------

/** The folder on the desktop and the five things inside it. */
export const FOLDER = 'distractions';
export const ITEMS = ['notifications', 'video', 'inbox', 'chat', 'tabs'] as const;
export type Item = (typeof ITEMS)[number];
export const ITEM_ICONS: Record<Item, string> = { notifications: 'bell', video: 'video', inbox: 'inbox', chat: 'chat', tabs: 'tabs' };
export const TRASHABLE: readonly string[] = [FOLDER, ...ITEMS];

export interface TrashState {
  /** In the Trash, in the order they went in. */
  trashed: string[];
  /** Gone for this visit (the Trash was emptied). */
  emptied: string[];
}

export const EMPTY_TRASH: TrashState = { trashed: [], emptied: [] };

export type TrashAction = { type: 'trash'; ids: readonly string[] } | { type: 'empty' };

export function trashReduce(s: TrashState, a: TrashAction): TrashState {
  switch (a.type) {
    case 'trash': {
      const add = a.ids.filter((id) => TRASHABLE.includes(id) && !s.trashed.includes(id) && !s.emptied.includes(id));
      return add.length ? { ...s, trashed: [...s.trashed, ...add] } : s;
    }
    case 'empty':
      return s.trashed.length ? { trashed: [], emptied: [...s.emptied, ...s.trashed] } : s;
  }
}

/** True when the item is still in its folder on the desktop (not trashed, not emptied, and its folder is not either). */
export function present(s: TrashState, id: string): boolean {
  const gone = (x: string) => s.trashed.includes(x) || s.emptied.includes(x);
  return !gone(id) && (id === FOLDER || !gone(FOLDER));
}

/** How many distractions are left anywhere but emptied: what About This Desktop's memory bar counts. */
export function distractionsLeft(s: TrashState): number {
  if (s.emptied.includes(FOLDER)) return 0;
  return ITEMS.filter((i) => !s.emptied.includes(i)).length;
}

/** About This Desktop's joke: distractions start at 2% and fall in steps as they are emptied. */
export function memory(s: TrashState): { focus: string; distractions: string } {
  const d = Math.round((2 * distractionsLeft(s) / ITEMS.length) * 10) / 10;
  const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
  return { focus: fmt(Math.round((100 - d) * 10) / 10), distractions: fmt(d) };
}

// ---- Stores ------------------------------------------------------------------------------------------------------

function createStore<T>(initial: () => T, persist?: (v: T) => void) {
  let value: T | undefined;
  const subs = new Set<() => void>();
  const get = () => (value === undefined ? (value = initial()) : value);
  return {
    get,
    set(next: T) {
      if (next === get()) return;
      value = next;
      persist?.(next);
      subs.forEach((f) => f());
    },
    subscribe(f: () => void) { subs.add(f); return () => { subs.delete(f); }; },
  };
}

export const settingsStore = createStore<Settings>(
  () => { try { return parseSettings(localStorage.getItem(SETTINGS_KEY)); } catch { return DEFAULT_SETTINGS; } },
  (s) => { try { localStorage.setItem(SETTINGS_KEY, serializeSettings(s)); } catch { /* storage off: settings last this visit */ } },
);
export const updateSettings = (p: Partial<Settings>) => settingsStore.set({ ...settingsStore.get(), ...p });
export const useSettings = () => useSyncExternalStore(settingsStore.subscribe, settingsStore.get, settingsStore.get);

export const trashStore = createStore<TrashState>(() => EMPTY_TRASH);
export const trashDispatch = (a: TrashAction) => trashStore.set(trashReduce(trashStore.get(), a));
export const useTrash = () => useSyncExternalStore(trashStore.subscribe, trashStore.get, trashStore.get);

/** The item selected inside the Distractions window (File ▸ Move to Trash acts on it). */
export const folderSelection = createStore<string | null>(() => null);
export const useFolderSelection = () => useSyncExternalStore(folderSelection.subscribe, folderSelection.get, folderSelection.get);

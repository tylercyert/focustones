import { create } from "zustand";

export type WindowKind =
  | "settings"
  | "about"
  | "welcome"
  | "mediaPlayer"
  | "article";

export type WindowInstance = {
  id: string;
  kind: WindowKind;
  title: string;
  icon: string;
  position: { x: number; y: number };
  size?: { width?: number; height?: number };
  isMinimized: boolean;
  zIndex: number;
  payload?: { articleId?: string };
};

type OpenConfig = {
  kind: WindowKind;
  id?: string;
  title: string;
  icon: string;
  defaultPosition?: { x: number; y: number };
  size?: { width?: number; height?: number };
  payload?: WindowInstance["payload"];
};

type WindowStore = {
  windows: Record<string, WindowInstance>;
  nextZ: number;
  openWindow: (config: OpenConfig) => string;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  toggleFromTaskbar: (id: string) => void;
  moveWindow: (id: string, position: { x: number; y: number }) => void;
};

const BASE_Z = 1000;
const CASCADE_STEP = 28;

const positionKey = (id: string) => `focustones_winpos_${id}`;

const loadPosition = (id: string): { x: number; y: number } | null => {
  try {
    const raw = localStorage.getItem(positionKey(id));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed.x === "number" &&
      typeof parsed.y === "number"
    ) {
      return { x: parsed.x, y: parsed.y };
    }
  } catch {
    // ignore
  }
  return null;
};

const savePosition = (id: string, position: { x: number; y: number }) => {
  try {
    localStorage.setItem(positionKey(id), JSON.stringify(position));
  } catch {
    // ignore
  }
};

const cascadePosition = (existingCount: number) => {
  const base = { x: 120, y: 60 };
  return {
    x: base.x + (existingCount % 6) * CASCADE_STEP,
    y: base.y + (existingCount % 6) * CASCADE_STEP,
  };
};

export const useWindowState = create<WindowStore>((set, get) => ({
  windows: {},
  nextZ: BASE_Z,

  openWindow: (config) => {
    const id = config.id ?? config.kind;
    const state = get();
    const existing = state.windows[id];
    const newZ = state.nextZ + 1;

    if (existing) {
      set({
        windows: {
          ...state.windows,
          [id]: { ...existing, isMinimized: false, zIndex: newZ },
        },
        nextZ: newZ,
      });
      return id;
    }

    const saved = loadPosition(id);
    const position =
      saved ??
      config.defaultPosition ??
      cascadePosition(Object.keys(state.windows).length);

    const instance: WindowInstance = {
      id,
      kind: config.kind,
      title: config.title,
      icon: config.icon,
      position,
      size: config.size,
      isMinimized: false,
      zIndex: newZ,
      payload: config.payload,
    };

    set({
      windows: { ...state.windows, [id]: instance },
      nextZ: newZ,
    });
    return id;
  },

  closeWindow: (id) => {
    const state = get();
    if (!state.windows[id]) return;
    const next = { ...state.windows };
    delete next[id];
    set({ windows: next });
  },

  focusWindow: (id) => {
    const state = get();
    const win = state.windows[id];
    if (!win) return;
    if (win.zIndex === state.nextZ && !win.isMinimized) return;
    const newZ = state.nextZ + 1;
    set({
      windows: {
        ...state.windows,
        [id]: { ...win, isMinimized: false, zIndex: newZ },
      },
      nextZ: newZ,
    });
  },

  minimizeWindow: (id) => {
    const state = get();
    const win = state.windows[id];
    if (!win || win.isMinimized) return;
    set({
      windows: {
        ...state.windows,
        [id]: { ...win, isMinimized: true },
      },
    });
  },

  restoreWindow: (id) => {
    get().focusWindow(id);
  },

  toggleFromTaskbar: (id) => {
    const state = get();
    const win = state.windows[id];
    if (!win) return;
    if (win.isMinimized) {
      get().focusWindow(id);
      return;
    }
    // Topmost non-minimized window? -> minimize. Otherwise focus.
    const topId = Object.values(state.windows)
      .filter((w) => !w.isMinimized)
      .sort((a, b) => b.zIndex - a.zIndex)[0]?.id;
    if (topId === id) {
      get().minimizeWindow(id);
    } else {
      get().focusWindow(id);
    }
  },

  moveWindow: (id, position) => {
    const state = get();
    const win = state.windows[id];
    if (!win) return;
    set({
      windows: {
        ...state.windows,
        [id]: { ...win, position },
      },
    });
    savePosition(id, position);
  },
}));

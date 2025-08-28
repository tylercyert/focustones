import { create } from "zustand";
import type { Band } from "./appState";

export type Preset = {
  id: string;
  name: string;
  band: Band;
  offsetHz: number;
  carrierHz: number;
  volume: number;
  waveform: OscillatorType;
  timerMinutes: number | null;
};

type PresetState = {
  builtIns: Preset[];
  userPresets: Preset[];
  savePreset: (p: Omit<Preset, "id">) => Preset;
  deletePreset: (id: string) => void;
  loadFromStorage: () => void;
};

const LS_KEY = "focustones.presets";

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const BUILTIN_PRESETS: Preset[] = [
  { id: "builtin-alpha-focus", name: "Alpha Focus", band: "alpha", offsetHz: 10, carrierHz: 256, volume: 0.4, waveform: "sine", timerMinutes: 15 },
  { id: "builtin-theta-relax", name: "Theta Relax", band: "theta", offsetHz: 6, carrierHz: 220, volume: 0.35, waveform: "sine", timerMinutes: 10 },
  { id: "builtin-delta-sleep", name: "Delta Sleep", band: "delta", offsetHz: 2, carrierHz: 180, volume: 0.3, waveform: "sine", timerMinutes: 30 },
  { id: "builtin-beta-energize", name: "Beta Energize", band: "beta", offsetHz: 18, carrierHz: 300, volume: 0.45, waveform: "triangle", timerMinutes: 5 }
];

function readStorage(): Preset[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as Preset[];
    if (!Array.isArray(arr)) return [];
    return arr;
  } catch {
    return [];
  }
}

function writeStorage(list: Preset[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list));
  } catch { /* Storage write failed */ }
}

export const usePresets = create<PresetState>((set, get) => ({
  builtIns: BUILTIN_PRESETS,
  userPresets: [],
  loadFromStorage: () => set({ userPresets: readStorage() }),
  savePreset: (p) => {
    const preset: Preset = { id: uid(), ...p };
    const next = [...get().userPresets, preset];
    writeStorage(next);
    set({ userPresets: next });
    return preset;
  },
  deletePreset: (id) => {
    const next = get().userPresets.filter((x) => x.id !== id);
    writeStorage(next);
    set({ userPresets: next });
  }
}));

export function encodePresetToUrlParam(p: Omit<Preset, "id" | "name"> & { name?: string }) {
  const payload = {
    name: p.name ?? "Shared Preset",
    band: p.band,
    offsetHz: p.offsetHz,
    carrierHz: p.carrierHz,
    volume: p.volume,
    waveform: p.waveform,
    timerMinutes: p.timerMinutes ?? null
  };
  const json = JSON.stringify(payload);
  const b64 = btoa(unescape(encodeURIComponent(json)));
  const url = new URL(window.location.href);
  url.searchParams.set("p", b64);
  return url.toString();
}

export function decodePresetFromUrlParam(): Omit<Preset, "id"> | null {
  try {
    const url = new URL(window.location.href);
    const b64 = url.searchParams.get("p");
    if (!b64) return null;
    const json = decodeURIComponent(escape(atob(b64)));
    const data = JSON.parse(json);
    const p: Omit<Preset, "id"> = {
      name: data.name ?? "Shared Preset",
      band: data.band,
      offsetHz: data.offsetHz,
      carrierHz: data.carrierHz,
      volume: data.volume,
      waveform: data.waveform,
      timerMinutes: data.timerMinutes ?? null
    };
    return p;
  } catch {
    return null;
  }
}



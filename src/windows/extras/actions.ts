// Actions shared by the menus, the keyboard and the windows, so every path to the Trash does the same thing.
import { useSyncExternalStore } from 'react';
import { playCrumple } from '../../engine/toy.ts';
import { FOLDER, folderSelection, present, trashDispatch, trashStore } from './store.ts';

/** Starts the screen saver from the panel's Test button or the Special menu. Delights listens for it. */
export const startSaver = () => window.dispatchEvent(new Event('focustones:saver'));

/** Fills `{name}` placeholders in a string from strings.ts. */
export const fill = (template: string, vars: Record<string, string | number>) => template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));

/** Puts things in the Trash. The folder's window closes when the folder goes. */
export function moveToTrash(ids: readonly string[], closeWindow: (id: string) => void): void {
  const live = ids.filter((id) => present(trashStore.get(), id));
  if (!live.length) return;
  trashDispatch({ type: 'trash', ids: live });
  if (live.includes(FOLDER)) closeWindow(FOLDER);
  const sel = folderSelection.get();
  if (sel && !present(trashStore.get(), sel)) folderSelection.set(null);
}

// The alert shown after emptying the Trash: one at a time, dismissed with OK, Return or Esc.
let alertText: string | null = null;
const alertSubs = new Set<() => void>();
export const showAlert = (text: string | null) => { alertText = text; alertSubs.forEach((f) => f()); };
export const useAlert = () => useSyncExternalStore((f) => { alertSubs.add(f); return () => { alertSubs.delete(f); }; }, () => alertText, () => alertText);

/** Empties the Trash: a crumple at the desktop's volume (from the user's click), then the alert. */
export function emptyTrash(volume: number, message: string): void {
  if (!trashStore.get().trashed.length) return;
  playCrumple(volume);
  trashDispatch({ type: 'empty' });
  showAlert(message);
}

/** The Trash icon under a point, if it is the topmost thing there (a window over it hides it, as on a real desktop). */
export function trashAt(x: number, y: number): HTMLElement | null {
  const hit = document.elementsFromPoint(x, y).find((el) => !el.closest('[data-dragging], .dx-ghost'));
  return (hit?.closest('.dicon[data-icon="trash"]') as HTMLElement | null) ?? null;
}

/** Highlights the Trash icon while something is dragged over it. */
export function markTrash(on: boolean): void {
  document.querySelector('.dicon[data-icon="trash"]')?.toggleAttribute('data-drop', on);
}

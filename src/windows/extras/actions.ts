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
let alertFrom: Element | null = null;
const alertSubs = new Set<() => void>();
/** Shows (or, with null, hides) the alert, remembering the control that opened it so focus can go back there. */
export const showAlert = (text: string | null) => {
  if (text && !alertText) alertFrom = document.activeElement;
  alertText = text;
  alertSubs.forEach((f) => f());
};
/**
 * Where focus goes when the alert closes: the control that opened it if it is still on the page, else the Trash window
 * (its Empty Trash button is replaced by the empty state), else the Special menu, else the desktop.
 */
export function alertReturnTarget(): HTMLElement | null {
  const from = alertFrom as HTMLElement | null;
  alertFrom = null;
  if (from?.isConnected && from !== document.body && !from.closest('[role="menu"]')) return from;
  return document.querySelector<HTMLElement>('[data-window="trash"]') ?? document.querySelector<HTMLElement>('[data-trigger="special"]') ?? document.querySelector<HTMLElement>('.surface');
}
export const useAlert = () => useSyncExternalStore((f) => { alertSubs.add(f); return () => { alertSubs.delete(f); }; }, () => alertText, () => alertText);

/** Empties the Trash: a crumple at the desktop's volume (from the user's click), then the alert. */
export function emptyTrash(message: string): void {
  if (!trashStore.get().trashed.length) return;
  playCrumple();
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

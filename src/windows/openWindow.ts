/** Asks the desktop to open a window by its `WindowSpec` id. The shell listens for this event; windows never import it. */
export const OPEN_WINDOW_EVENT = 'focustones:open-window';

export function openWindow(id: string): void {
  window.dispatchEvent(new CustomEvent<string>(OPEN_WINDOW_EVENT, { detail: id }));
}

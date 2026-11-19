import { createContext, useContext } from 'react';

/** What a window's contents can ask of the desktop (volume, opening other windows, closing itself). */
export interface DesktopApi {
  readonly volume: number;
  readonly setVolume: (volume: number) => void;
  readonly openWindow: (id: string) => void;
  readonly closeWindow: (id: string) => void;
  /** True under 700 px wide, where one window fills the screen. */
  readonly phone: boolean;
}

export const DesktopContext = createContext<DesktopApi | null>(null);

export function useDesktop(): DesktopApi {
  const api = useContext(DesktopContext);
  if (!api) throw new Error('useDesktop must be used inside <Desktop>');
  return api;
}

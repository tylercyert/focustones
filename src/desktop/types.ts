import type { ComponentType } from 'react';

/** What a window needs to open: the shell reads these, one `WindowSpec` per window in `src/windows/<id>/`. */
export interface WindowSpec {
  readonly id: string;
  readonly title: string;
  /** An icon name from `src/desktop/icons.tsx` (e.g. `app`, `note`), or a single emoji or glyph. */
  readonly icon: string;
  readonly defaultSize: { readonly width: number; readonly height: number };
  readonly defaultPosition: { readonly x: number; readonly y: number };
  readonly component: ComponentType;
  /** True for windows that are open when the desktop first loads. */
  readonly openOnLaunch: boolean;
  /** Optional, added by the shell (backward compatible). A desktop icon label; defaults to `title`. */
  readonly iconLabel?: string;
  /** Optional. False hides the window's desktop icon (it stays reachable from the menus). Defaults to true. */
  readonly showOnDesktop?: boolean;
  /** Optional. False removes the resize box and the zoom box. Defaults to true. */
  readonly resizable?: boolean;
  /** Optional. The smallest size the user can resize to. Defaults to 220 × 140. */
  readonly minSize?: { readonly width: number; readonly height: number };
}

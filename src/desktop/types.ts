import type { ComponentType } from 'react';

/** What a window needs to open: the shell reads these, one `WindowSpec` per window in `src/windows/<id>/`. */
export interface WindowSpec {
  readonly id: string;
  readonly title: string;
  /** A single emoji or glyph until the drawn icon set lands. */
  readonly icon: string;
  readonly defaultSize: { readonly width: number; readonly height: number };
  readonly defaultPosition: { readonly x: number; readonly y: number };
  readonly component: ComponentType;
  /** True for windows that are open when the desktop first loads. */
  readonly openOnLaunch: boolean;
}

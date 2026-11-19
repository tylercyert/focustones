import { strings } from '../content/strings.ts';
import { Welcome } from './Welcome.tsx';
import type { WindowSpec } from './types.ts';

const t = strings.windows.welcome;

/** The one demo window the shell ships with: reachable from its icon and the File menu, never open on launch. Real windows (issue #6) replace it. */
export const welcomeWindow: WindowSpec = {
  id: 'welcome', title: t.title, iconLabel: t.iconLabel, icon: 'note',
  defaultSize: { width: 440, height: 290 }, defaultPosition: { x: 96, y: 56 }, component: Welcome, openOnLaunch: false,
};

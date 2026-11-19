import { strings } from '../content/strings.ts';
import { Welcome } from './Welcome.tsx';
import type { WindowSpec } from './types.ts';

const t = strings.windows.welcome;

/** The one demo window the shell ships with. Real windows replace it (issue #6). */
export const welcomeWindow: WindowSpec = {
  id: 'welcome', title: t.title, iconLabel: t.iconLabel, icon: 'note',
  defaultSize: { width: 440, height: 290 }, defaultPosition: { x: 96, y: 56 }, component: Welcome, openOnLaunch: true,
};

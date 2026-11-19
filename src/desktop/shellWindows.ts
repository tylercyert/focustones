import { strings } from '../content/strings.ts';
import { About, Help, Trash } from './ShellPanes.tsx';
import type { WindowSpec } from './types.ts';

const t = strings.windows;

/** Windows the shell itself owns. They use the same machinery as the registry's windows. */
export const shellWindows: readonly WindowSpec[] = [
  { id: 'about', title: t.about.title, icon: 'app', defaultSize: { width: 340, height: 250 }, defaultPosition: { x: 340, y: 150 }, component: About, openOnLaunch: false, showOnDesktop: false, resizable: false },
  { id: 'help', title: t.help.title, iconLabel: t.help.iconLabel, icon: 'help', defaultSize: { width: 420, height: 380 }, defaultPosition: { x: 240, y: 110 }, component: Help, openOnLaunch: false },
  { id: 'trash', title: t.trash.title, iconLabel: t.trash.iconLabel, icon: 'trash', defaultSize: { width: 300, height: 210 }, defaultPosition: { x: 420, y: 200 }, component: Trash, openOnLaunch: false },
];

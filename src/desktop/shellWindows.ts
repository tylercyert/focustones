import { strings } from '../content/strings.ts';
import { AboutAppWindow } from '../windows/about/AboutAppWindow.tsx';
import { Help, Trash } from './ShellPanes.tsx';
import type { WindowSpec } from './types.ts';

const t = strings.windows;

/** Windows the shell itself owns. They use the same machinery as the registry's windows. */
export const shellWindows: readonly WindowSpec[] = [
  { id: 'about', title: t.about.title, shortTitle: t.about.short, icon: 'app', defaultSize: { width: 380, height: 580 }, defaultPosition: { x: 340, y: 40 }, minSize: { width: 320, height: 300 }, component: AboutAppWindow, openOnLaunch: false, showOnDesktop: false },
  { id: 'help', title: t.help.title, shortTitle: t.help.short, iconLabel: t.help.iconLabel, icon: 'help', defaultSize: { width: 420, height: 380 }, defaultPosition: { x: 240, y: 110 }, component: Help, openOnLaunch: false, showOnDesktop: false },
  { id: 'trash', title: t.trash.title, iconLabel: t.trash.iconLabel, icon: 'trash', defaultSize: { width: 300, height: 210 }, defaultPosition: { x: 420, y: 200 }, component: Trash, openOnLaunch: false },
];

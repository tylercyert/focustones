import { strings } from '../../content/strings.ts';
import type { WindowSpec } from '../../desktop/types.ts';
import { AboutDesktop, Credits } from './About.tsx';
import { BeatCalculator } from './BeatCalculator.tsx';
import { DistractionsWindow } from './Distractions.tsx';
import './extras.css';
import { NoteWindow } from './Note.tsx';
import { PatternsPanel } from './Patterns.tsx';
import { ScreenSaverPanel } from './ScreenSaver.tsx';
import { FOLDER } from './store.ts';

export { Delights } from './Delights.tsx';
export { TrashContents } from './TrashContents.tsx';
export { useDesktopExtras } from './useDesktopExtras.ts';

const d = strings.delights;

/** The desktop delights' windows (issue #14). The folder, the note and the calculator have desktop icons; the rest open from the menus. */
export const extraSpecs: readonly WindowSpec[] = [
  { id: FOLDER, title: d.distractions.title, icon: 'folder', defaultSize: { width: 440, height: 330 }, defaultPosition: { x: 180, y: 120 }, minSize: { width: 300, height: 240 }, component: DistractionsWindow, openOnLaunch: false },
  { id: 'note', title: d.note.title, shortTitle: d.note.short, icon: 'sticky', defaultSize: { width: 290, height: 250 }, defaultPosition: { x: 620, y: 360 }, minSize: { width: 200, height: 160 }, component: NoteWindow, openOnLaunch: false },
  { id: 'beat-calculator', title: d.calculator.title, shortTitle: d.calculator.short, icon: 'calculator', defaultSize: { width: 320, height: 340 }, defaultPosition: { x: 300, y: 70 }, resizable: false, component: BeatCalculator, openOnLaunch: false },
  { id: 'desktop-patterns', title: d.patterns.title, shortTitle: d.patterns.short, icon: 'patterns', defaultSize: { width: 440, height: 470 }, defaultPosition: { x: 240, y: 50 }, minSize: { width: 320, height: 320 }, component: PatternsPanel, openOnLaunch: false, showOnDesktop: false },
  { id: 'screen-saver', title: d.saver.title, shortTitle: d.saver.short, icon: 'saver', defaultSize: { width: 380, height: 420 }, defaultPosition: { x: 280, y: 80 }, minSize: { width: 300, height: 300 }, component: ScreenSaverPanel, openOnLaunch: false, showOnDesktop: false },
  { id: 'about-desktop', title: d.about.title, shortTitle: d.about.short, icon: 'app', defaultSize: { width: 440, height: 250 }, defaultPosition: { x: 260, y: 90 }, resizable: false, component: AboutDesktop, openOnLaunch: false, showOnDesktop: false },
  { id: 'credits', title: d.credits.title, icon: 'credits', defaultSize: { width: 360, height: 280 }, defaultPosition: { x: 320, y: 120 }, minSize: { width: 280, height: 240 }, component: Credits, openOnLaunch: false, showOnDesktop: false },
];

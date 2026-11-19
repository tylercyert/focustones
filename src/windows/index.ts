import type { WindowSpec } from '../desktop/types.ts';
import { strings } from '../content/strings.ts';
import './windows.css';
import { AboutAppWindow } from './about/AboutAppWindow.tsx';
import { AboutSoundWindow } from './about/AboutSoundWindow.tsx';
import { IphoneWindow, LayersWindow, ProgramsWindow, ProgressWindow, TuneWindow } from './features/windows.tsx';
import { GetWindow } from './get/GetWindow.tsx';
import { ListenWindow } from './listen/ListenWindow.tsx';

const F = strings.features;
const feature = (id: string, title: string, icon: string, n: number, component: WindowSpec['component']): WindowSpec => ({
  id: `feature-${id}`, title, icon, defaultSize: { width: 620, height: 470 }, defaultPosition: { x: 120 + n * 28, y: 70 + n * 28 }, component, openOnLaunch: false,
});

/** Every window this folder provides; `src/desktop/registry.ts` lists them. */
export const windowSpecs: readonly WindowSpec[] = [
  { id: 'listen', title: strings.listen.title, icon: '🎧', defaultSize: { width: 440, height: 760 }, defaultPosition: { x: 64, y: 40 }, component: ListenWindow, openOnLaunch: true },
  { id: 'get', title: strings.get.title, icon: '📱', defaultSize: { width: 400, height: 730 }, defaultPosition: { x: 540, y: 56 }, component: GetWindow, openOnLaunch: true },
  feature('tune', F.tune.title, '🎚', 0, TuneWindow),
  feature('layers', F.layers.title, '🌧', 1, LayersWindow),
  feature('programs', F.programs.title, '🗂', 2, ProgramsWindow),
  feature('progress', F.progress.title, '📈', 3, ProgressWindow),
  feature('iphone', F.iphone.title, '📲', 4, IphoneWindow),
  { id: 'about-sound', title: strings.aboutSound.title, icon: '〰', defaultSize: { width: 460, height: 730 }, defaultPosition: { x: 200, y: 90 }, component: AboutSoundWindow, openOnLaunch: false },
  { id: 'about-app', title: strings.aboutApp.title, icon: 'ℹ️', defaultSize: { width: 380, height: 600 }, defaultPosition: { x: 260, y: 110 }, component: AboutAppWindow, openOnLaunch: false },
];

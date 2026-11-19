import type { WindowSpec } from '../desktop/types.ts';
import { strings } from '../content/strings.ts';
import './windows.css';
import { AboutSoundWindow } from './about/AboutSoundWindow.tsx';
import { IphoneWindow, LayersWindow, ProgramsWindow, ProgressWindow, TuneWindow } from './features/windows.tsx';
import { GetWindow } from './get/GetWindow.tsx';
import { ListenWindow } from './listen/ListenWindow.tsx';

const F = strings.features;
const feature = (id: string, title: string, icon: string, n: number, component: WindowSpec['component']): WindowSpec => ({
  id: `feature-${id}`, title, icon, defaultSize: { width: 620, height: 404 }, defaultPosition: { x: 120 + n * 28, y: 70 + n * 28 },
  minSize: { width: 340, height: 260 }, component, openOnLaunch: false,
});

/** Every window this folder provides; `src/desktop/registry.ts` lists them. The About FocusTones window is the shell's `about`. */
export const windowSpecs: readonly WindowSpec[] = [
  { id: 'get', title: strings.get.title, shortTitle: strings.get.title, icon: 'app', defaultSize: { width: 400, height: 676 }, defaultPosition: { x: 532, y: 30 }, minSize: { width: 340, height: 420 }, component: GetWindow, openOnLaunch: true },
  { id: 'listen', title: strings.listen.title, icon: 'speaker', defaultSize: { width: 440, height: 604 }, defaultPosition: { x: 64, y: 18 }, minSize: { width: 340, height: 420 }, component: ListenWindow, openOnLaunch: true },
  feature('tune', F.tune.title, 'tune', 0, TuneWindow),
  feature('layers', F.layers.title, 'layers', 1, LayersWindow),
  feature('programs', F.programs.title, 'programs', 2, ProgramsWindow),
  feature('progress', F.progress.title, 'progress', 3, ProgressWindow),
  feature('iphone', F.iphone.title, 'phone', 4, IphoneWindow),
  { id: 'about-sound', title: strings.aboutSound.title, shortTitle: strings.aboutSound.short, icon: 'wave', defaultSize: { width: 460, height: 730 }, defaultPosition: { x: 200, y: 40 }, minSize: { width: 340, height: 300 }, component: AboutSoundWindow, openOnLaunch: false },
];

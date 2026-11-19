import { welcomeWindow } from './demo.ts';
import type { WindowSpec } from './types.ts';

/** Every window the desktop can open. Each window issue appends its spec here (one line, to keep merges trivial). */
export const windowRegistry: readonly WindowSpec[] = [welcomeWindow];

export function launchWindows(registry: readonly WindowSpec[] = windowRegistry): readonly WindowSpec[] {
  return registry.filter((w) => w.openOnLaunch);
}

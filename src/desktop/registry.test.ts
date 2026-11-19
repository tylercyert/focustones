import { describe, expect, it } from 'vitest';
import { launchWindows, windowRegistry } from './registry.ts';
import type { WindowSpec } from './types.ts';

const spec = (id: string, openOnLaunch: boolean): WindowSpec => ({
  id, title: id, icon: '·', defaultSize: { width: 1, height: 1 }, defaultPosition: { x: 0, y: 0 },
  component: () => null, openOnLaunch,
});

describe('window registry', () => {
  it('starts empty and has unique ids', () => {
    expect(new Set(windowRegistry.map((w) => w.id)).size).toBe(windowRegistry.length);
  });
  it('launches only windows marked openOnLaunch', () => {
    expect(launchWindows([spec('a', true), spec('b', false)]).map((w) => w.id)).toEqual(['a']);
  });
});

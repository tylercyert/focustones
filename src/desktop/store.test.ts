import { describe, expect, it } from 'vitest';
import { clampRect, initialState, parseSaved, reduce, serialize, type DesktopState, type Action } from './store.ts';

const defs = [
  { id: 'a', size: { width: 300, height: 200 }, position: { x: 40, y: 30 }, openOnLaunch: true },
  { id: 'b', size: { width: 260, height: 180 }, position: { x: 90, y: 70 }, openOnLaunch: false },
];
const run = (s: DesktopState, ...as: Action[]) => as.reduce(reduce, s);

describe('desktop store', () => {
  it('opens launch windows and focuses the last one', () => {
    const s = initialState(defs, null);
    expect(s.order).toEqual(['a']);
    expect(s.active).toBe('a');
  });

  it('opens, focuses and closes windows in front-to-back order, twice and interleaved', () => {
    let s = initialState(defs, null);
    s = run(s, { type: 'open', id: 'b' }, { type: 'focus', id: 'a' }, { type: 'focus', id: 'a' });
    expect(s.order).toEqual(['b', 'a']);
    expect(s.active).toBe('a');
    s = run(s, { type: 'close', id: 'a' }, { type: 'close', id: 'a' });
    expect(s.order).toEqual(['b']);
    expect(s.active).toBe('b');
    s = run(s, { type: 'open', id: 'a' }, { type: 'close', id: 'a' }, { type: 'open', id: 'a' });
    expect(s.order).toEqual(['b', 'a']);
    s = run(s, { type: 'close', id: 'a' }, { type: 'close', id: 'b' });
    expect(s.order).toEqual([]);
    expect(s.active).toBeNull();
  });

  it('reopening an open window brings it forward and unrolls it', () => {
    let s = run(initialState(defs, null), { type: 'open', id: 'b' }, { type: 'toggleCollapse', id: 'a' });
    expect(s.rects.a.collapsed).toBe(true);
    s = run(s, { type: 'open', id: 'a' });
    expect(s.rects.a.collapsed).toBe(false);
    expect(s.order.at(-1)).toBe('a');
  });

  it('toggles collapse and zoom independently, twice', () => {
    let s = initialState(defs, null);
    s = run(s, { type: 'toggleCollapse', id: 'a' }, { type: 'toggleZoom', id: 'a' });
    expect(s.rects.a).toMatchObject({ collapsed: true, zoomed: true });
    s = run(s, { type: 'toggleCollapse', id: 'a' }, { type: 'toggleZoom', id: 'a' });
    expect(s.rects.a).toMatchObject({ collapsed: false, zoomed: false });
  });

  it('moves and resizes, keeping the minimum size, and un-zooms', () => {
    let s = run(initialState(defs, null), { type: 'toggleZoom', id: 'a' }, { type: 'move', id: 'a', x: 100, y: 50 });
    expect(s.rects.a).toMatchObject({ x: 100, y: 50, zoomed: false });
    s = run(s, { type: 'resize', id: 'a', width: 10, height: 10, min: { width: 220, height: 140 } });
    expect(s.rects.a).toMatchObject({ width: 220, height: 140 });
  });

  it('cleans up positions but keeps what is open', () => {
    let s = run(initialState(defs, null), { type: 'move', id: 'a', x: 500, y: 400 }, { type: 'toggleCollapse', id: 'a' });
    s = run(s, { type: 'cleanUp', defs });
    expect(s.rects.a).toMatchObject({ x: 40, y: 30, width: 300, height: 200, collapsed: false });
    expect(s.order).toEqual(['a']);
  });

  it('closeAll empties the desktop; showDesktop clears the active window only', () => {
    let s = run(initialState(defs, null), { type: 'open', id: 'b' }, { type: 'showDesktop' });
    expect(s.active).toBeNull();
    expect(s.order).toEqual(['a', 'b']);
    s = run(s, { type: 'closeAll' });
    expect(s.order).toEqual([]);
  });

  it('round-trips through storage and ignores junk', () => {
    const s = run(initialState(defs, null), { type: 'move', id: 'a', x: 123, y: 77 }, { type: 'setVolume', volume: 0.4 });
    const saved = parseSaved(serialize(s));
    expect(saved?.rects.a).toMatchObject({ x: 123, y: 77 });
    expect(saved?.volume).toBe(0.4);
    expect(initialState(defs, saved).rects.a).toMatchObject({ x: 123, y: 77 });
    expect(parseSaved('{nope')).toBeNull();
    expect(parseSaved('{"version":1,"rects":{"a":{"x":"x"}}}')?.rects.a).toBeUndefined();
    expect(parseSaved(null)).toBeNull();
  });

  it('clamps a rect so the title bar stays reachable', () => {
    const r = { x: -500, y: -40, width: 300, height: 200 };
    expect(clampRect(r, { width: 1000, height: 600 })).toMatchObject({ x: -260, y: 0 });
    expect(clampRect({ x: 5000, y: 5000, width: 300, height: 200 }, { width: 1000, height: 600 })).toMatchObject({ x: 960, y: 580 });
  });
});

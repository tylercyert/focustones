import { afterEach, describe, expect, it, vi } from 'vitest';
import { bandFor } from './beat.ts';
import { createIdleTimer, IDLE_MS } from './idle.ts';
import { CODE, completes, keyToken, push, swipeToken, type Token } from './konami.ts';
import { PATTERNS, patternMask } from './patterns.ts';
import {
  DEFAULT_SETTINGS, EMPTY_TRASH, FOLDER, ITEMS, distractionsLeft, memory, parseSettings, present, serializeSettings, trashReduce, type TrashState,
} from './store.ts';

describe('Trash', () => {
  it('takes the folder or its items, once each, and ignores anything else', () => {
    let s = trashReduce(EMPTY_TRASH, { type: 'trash', ids: ['video'] });
    s = trashReduce(s, { type: 'trash', ids: ['video'] });
    s = trashReduce(s, { type: 'trash', ids: ['listen', 'get', 'trash'] });
    expect(s.trashed).toEqual(['video']);
    expect(present(s, 'video')).toBe(false);
    expect(present(s, 'inbox')).toBe(true);
    expect(present(s, FOLDER)).toBe(true);
  });

  it('hides every item with the folder, empties for the visit, and keeps working after a second round', () => {
    let s: TrashState = trashReduce(EMPTY_TRASH, { type: 'trash', ids: ['inbox'] });
    s = trashReduce(s, { type: 'trash', ids: [FOLDER] });
    for (const i of ITEMS) expect(present(s, i)).toBe(false);
    s = trashReduce(s, { type: 'empty' });
    expect(s).toEqual({ trashed: [], emptied: ['inbox', FOLDER] });
    expect(trashReduce(s, { type: 'empty' })).toBe(s); // emptying an empty Trash changes nothing
    expect(trashReduce(s, { type: 'trash', ids: [FOLDER] })).toBe(s); // emptied things cannot be trashed again this visit
    expect(present(s, FOLDER)).toBe(false);
  });

  it('counts distractions for About This Desktop: 98/2 at first, 100/0 once all are emptied', () => {
    expect(memory(EMPTY_TRASH)).toEqual({ focus: '98', distractions: '2' });
    let s = trashReduce(EMPTY_TRASH, { type: 'trash', ids: ['tabs', 'chat'] });
    expect(memory(s)).toEqual({ focus: '98', distractions: '2' }); // still in the Trash, not gone yet
    s = trashReduce(s, { type: 'empty' });
    expect(distractionsLeft(s)).toBe(3);
    expect(memory(s)).toEqual({ focus: '98.8', distractions: '1.2' });
    s = trashReduce(trashReduce(s, { type: 'trash', ids: [FOLDER] }), { type: 'empty' });
    expect(memory(s)).toEqual({ focus: '100', distractions: '0' });
  });
});

describe('settings', () => {
  it('round-trip, and fall back to the defaults for junk', () => {
    const s = { pattern: 'ripple', saver: false, chord: false, icons: { listen: { dx: -40, dy: 12 } } };
    expect(parseSettings(serializeSettings(s))).toEqual(s);
    expect(parseSettings(serializeSettings(parseSettings(serializeSettings(s))))).toEqual(s);
    for (const junk of [null, '', '{', '[]', '{"version":2}', 'null']) expect(parseSettings(junk)).toEqual(DEFAULT_SETTINGS);
  });

  it('drop an unknown pattern and broken icon offsets but keep the rest', () => {
    const raw = JSON.stringify({ version: 1, pattern: 'flying-things', saver: 'yes', chord: false, icons: { a: { dx: 1, dy: 2 }, b: { dx: 'x', dy: 1 }, c: null } });
    expect(parseSettings(raw)).toEqual({ pattern: 'default', saver: true, chord: false, icons: { a: { dx: 1, dy: 2 } } });
  });
});

describe('Konami code', () => {
  const feed = (tokens: Token[]) => tokens.reduce<Token[]>((h, t) => push(h, t), []);
  it('matches the keys in order, even after a false start, and only the whole code', () => {
    const keys = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    expect(completes(feed(keys.map((k) => keyToken(k)!)))).toBe(true);
    expect(completes(feed(['up', ...keys.map((k) => keyToken(k)!)]))).toBe(true); // ↑↑↑… still counts
    expect(completes(feed(CODE.slice(0, 9)))).toBe(false);
    expect(completes(feed([...CODE.slice(0, 9), 'b']))).toBe(false);
    expect(keyToken('x')).toBeNull();
    expect(keyToken('B')).toBe('b');
  });

  it('accepts swipes and two taps on a touch screen', () => {
    expect(swipeToken(3, -4)).toBe('tap');
    expect(swipeToken(0, -80)).toBe('up');
    expect(swipeToken(60, 10)).toBe('right');
    const swipes: Token[] = [[0, -50], [0, -50], [0, 50], [0, 50], [-50, 0], [50, 0], [-50, 0], [50, 0], [1, 1], [0, 2]].map(([x, y]) => swipeToken(x, y));
    expect(completes(feed(swipes))).toBe(true);
    expect(completes(feed(['tap', 'tap', ...CODE.slice(2)]))).toBe(false); // taps stand only for B and A
  });
});

describe('idle timer', () => {
  afterEach(() => { vi.useRealTimers(); });

  it('fires after two quiet minutes, and every poke restarts the count', () => {
    vi.useFakeTimers();
    const fired = vi.fn();
    const t = createIdleTimer(IDLE_MS, () => true, fired);
    vi.advanceTimersByTime(IDLE_MS - 1000);
    t.poke();
    vi.advanceTimersByTime(IDLE_MS - 1000);
    expect(fired).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(fired).toHaveBeenCalledTimes(1);
    t.poke();
    vi.advanceTimersByTime(IDLE_MS);
    expect(fired).toHaveBeenCalledTimes(2);
    t.stop();
    vi.advanceTimersByTime(IDLE_MS * 3);
    expect(fired).toHaveBeenCalledTimes(2);
  });

  it('waits while the page is not eligible (hidden, unfocused or the saver is off)', () => {
    vi.useFakeTimers();
    let ok = false;
    const fired = vi.fn();
    createIdleTimer(IDLE_MS, () => ok, fired);
    vi.advanceTimersByTime(IDLE_MS * 2);
    expect(fired).not.toHaveBeenCalled();
    ok = true;
    vi.advanceTimersByTime(IDLE_MS);
    expect(fired).toHaveBeenCalledTimes(1);
  });
});

describe('bands', () => {
  it('place a beat in the CONTEXT.md ranges, low end included, and nothing outside 0.5–45 Hz', () => {
    expect([0.4, 0.5, 2, 4, 6, 8, 10, 13, 16, 30, 40, 45, 45.1].map(bandFor)).toEqual([
      null, 'delta', 'delta', 'theta', 'theta', 'alpha', 'alpha', 'beta', 'beta', 'gamma', 'gamma', 'gamma', null,
    ]);
    expect(bandFor(Number.NaN)).toBeNull();
  });
});

describe('Desktop Patterns', () => {
  it('are 7 original 8 × 8 tiles, all different, each with something drawn', () => {
    expect(PATTERNS).toHaveLength(7);
    expect(new Set(PATTERNS.map((p) => p.id)).size).toBe(7);
    expect(new Set(PATTERNS.map((p) => p.rows.join(''))).size).toBe(7);
    for (const p of PATTERNS) {
      expect(p.rows).toHaveLength(8);
      for (const r of p.rows) expect(r).toMatch(/^[#.]{8}$/);
      expect(p.rows.join('')).toContain('#');
    }
  });

  it('become an SVG mask with one square per drawn pixel', () => {
    const tilt = PATTERNS.find((p) => p.id === 'tilt')!;
    const url = patternMask(tilt);
    expect(url.startsWith('url("data:image/svg+xml,')).toBe(true);
    expect(decodeURIComponent(url).match(/<rect /g)).toHaveLength(8);
  });
});

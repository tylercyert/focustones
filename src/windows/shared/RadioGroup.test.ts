import { describe, expect, it } from 'vitest';
import { radioTarget } from './radioTarget.ts';

describe('radio group keys (WAI-ARIA)', () => {
  it('arrows move by one and wrap; Home and End jump; other keys do nothing', () => {
    expect(radioTarget('ArrowRight', 0, 5)).toBe(1);
    expect(radioTarget('ArrowDown', 4, 5)).toBe(0);
    expect(radioTarget('ArrowLeft', 0, 5)).toBe(4);
    expect(radioTarget('ArrowUp', 3, 5)).toBe(2);
    expect(radioTarget('Home', 3, 5)).toBe(0);
    expect(radioTarget('End', 1, 5)).toBe(4);
    expect(radioTarget('Enter', 1, 5)).toBeNull();
    expect(radioTarget('Tab', 1, 5)).toBeNull();
  });
});

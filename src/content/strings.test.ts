import { describe, expect, it } from 'vitest';
import { strings } from './strings.ts';

function leaves(value: unknown): string[] {
  return typeof value === 'string' ? [value] : Object.values(value as object).flatMap(leaves);
}

describe('strings', () => {
  it('has no empty string', () => {
    for (const s of leaves(strings)) expect(s.trim()).not.toBe('');
  });
});

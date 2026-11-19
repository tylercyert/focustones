import { describe, expect, it } from 'vitest';
import { provenance, strings } from './strings.ts';

function leaves(value: unknown, path = ''): [string, string][] {
  return typeof value === 'string'
    ? [[path, value]]
    : Object.entries(value as object).flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k));
}

describe('strings', () => {
  const all = leaves(strings);
  const mine = leaves({ listen: strings.listen, get: strings.get, features: strings.features, aboutSound: strings.aboutSound, aboutApp: strings.aboutApp, meta: strings.meta, delights: strings.delights });

  it('has no empty string', () => {
    for (const [, s] of all) expect(s.trim()).not.toBe('');
  });

  it('marks every string approved: <source> or new, and nothing else', () => {
    for (const [path] of mine) expect(provenance[path], path).toMatch(/^(new|approved: \S)/);
    expect(Object.keys(provenance).sort()).toEqual(mine.map(([p]) => p).sort());
  });

  it('quotes approved copy verbatim where a sentence is reused', () => {
    expect(strings.get.annual).toBe('Annual: a 7-day trial, then $39.99 a year.');
    expect(strings.listen.free).toBe(strings.get.free);
  });

  it('marks every desktop delight (issue #14) new, one entry per string', () => {
    const delights = leaves(strings.delights, 'delights');
    expect(delights.length).toBeGreaterThan(60);
    for (const [path] of delights) expect(provenance[path], path).toBe('new');
  });
});

// The Konami code (↑↑↓↓←→←→BA) as a pure matcher. On touch screens the same code is four swipes up/down/left/right
// in order, then two taps for B and A, so phones can find the egg too.

export type Token = 'up' | 'down' | 'left' | 'right' | 'b' | 'a' | 'tap';

export const CODE: readonly Token[] = ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right', 'b', 'a'];

const KEYS: Record<string, Token> = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', b: 'b', B: 'b', a: 'a', A: 'a' };
export const keyToken = (key: string): Token | null => KEYS[key] ?? null;

/** A touch gesture's token: a tap under 12 px of travel, else the main direction of the swipe. */
export function swipeToken(dx: number, dy: number): Token {
  if (Math.hypot(dx, dy) < 12) return 'tap';
  return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
}

const fits = (want: Token, got: Token) => want === got || (got === 'tap' && (want === 'b' || want === 'a'));

/** True when the recent tokens end with the whole code. */
export function completes(history: readonly Token[]): boolean {
  if (history.length < CODE.length) return false;
  const tail = history.slice(-CODE.length);
  return CODE.every((t, i) => fits(t, tail[i]));
}

/** Adds a token to the history, keeping only as many as the code needs. */
export const push = (history: readonly Token[], t: Token): Token[] => [...history, t].slice(-CODE.length);

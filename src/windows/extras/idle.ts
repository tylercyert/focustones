// The screen saver's idle clock: fires once after `ms` without a poke, but only when `eligible()` says so (the page is
// visible and focused and the saver is on). When it is not eligible at the deadline it waits another full period.

export const IDLE_MS = 2 * 60 * 1000;

export interface IdleTimer { poke(): void; stop(): void }

export function createIdleTimer(ms: number, eligible: () => boolean, onIdle: () => void): IdleTimer {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const arm = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      if (eligible()) onIdle();
      else arm();
    }, ms);
  };
  arm();
  return {
    poke: arm,
    stop() { if (timer) clearTimeout(timer); timer = null; },
  };
}

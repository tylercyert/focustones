import { useSyncExternalStore } from 'react';

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (notify) => {
      const mq = window.matchMedia(query);
      mq.addEventListener('change', notify);
      return () => mq.removeEventListener('change', notify);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Phones: one window fills the screen at a time (issue #5). */
export const PHONE_QUERY = '(max-width: 699px)';
export const usePhone = () => useMediaQuery(PHONE_QUERY);
export const useReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)');

export const isMac = () => typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

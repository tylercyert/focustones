import { radioTarget } from './radioTarget.ts';
import { useRef, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';

export interface RadioItem<T extends string | number | null> {
  readonly value: T;
  readonly testId: string;
  readonly children: ReactNode;
  readonly style?: CSSProperties;
  readonly className?: string;
}

interface Props<T extends string | number | null> {
  readonly items: readonly RadioItem<T>[];
  readonly value: T;
  readonly onChange: (value: T) => void;
  readonly className?: string;
  readonly itemClassName?: string;
  readonly label?: string;
  readonly labelledBy?: string;
}

/**
 * A radio group with a roving tabindex: only the selected button is a Tab stop, and the arrow keys move focus and
 * select (so the engine hears each change), as in the WAI-ARIA radio group pattern.
 */
export function RadioGroup<T extends string | number | null>({ items, value, onChange, className, itemClassName, label, labelledBy }: Props<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const selected = Math.max(0, items.findIndex((i) => i.value === value));
  const onKeyDown = (e: KeyboardEvent, index: number) => {
    const to = radioTarget(e.key, index, items.length);
    if (to === null) return;
    e.preventDefault();
    onChange(items[to].value);
    refs.current[to]?.focus();
  };
  return (
    <div role="radiogroup" className={className} aria-label={label} aria-labelledby={labelledBy}>
      {items.map((item, i) => (
        <button
          key={String(item.value)} ref={(el) => { refs.current[i] = el; }} type="button" role="radio"
          aria-checked={i === selected} tabIndex={i === selected ? 0 : -1}
          className={[itemClassName, item.className].filter(Boolean).join(' ') || undefined} style={item.style}
          onClick={() => onChange(item.value)} onKeyDown={(e) => onKeyDown(e, i)} data-testid={item.testId}
        >
          {item.children}
        </button>
      ))}
    </div>
  );
}

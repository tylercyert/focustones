import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Icon } from './icons.tsx';
import { isMac } from './hooks.ts';

export type MenuItem =
  | { kind: 'item'; label: string; onSelect: () => void; shortcut?: string; disabled?: boolean; checked?: boolean }
  | { kind: 'sep' };

export interface MenuDef { id: string; label: string; ariaLabel?: string; icon?: string; items: MenuItem[] }

interface Props { label: string; menus: MenuDef[]; children?: ReactNode }

export function MenuBar({ label, menus, children }: Props) {
  const [open, setOpen] = useState<string | null>(null);
  const keyboardOpen = useRef(false);
  const bar = useRef<HTMLDivElement>(null);
  const base = useId();
  const mod = isMac() ? 'Cmd' : 'Ctrl';

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => { if (!bar.current?.contains(e.target as Node)) setOpen(null); };
    document.addEventListener('pointerdown', away);
    return () => document.removeEventListener('pointerdown', away);
  }, [open]);

  useEffect(() => {
    if (!open || !keyboardOpen.current) return;
    keyboardOpen.current = false;
    bar.current?.querySelector<HTMLElement>('[role="menu"] [role^="menuitem"]:not([aria-disabled="true"])')?.focus();
  }, [open]);

  const triggers = () => [...(bar.current?.querySelectorAll<HTMLElement>('[data-trigger]') ?? [])];
  const shift = (from: number, dir: 1 | -1, keepOpen: boolean) => {
    const t = triggers();
    const next = t[(from + dir + t.length) % t.length];
    if (keepOpen) { keyboardOpen.current = true; setOpen(next.dataset.trigger!); } else next.focus();
  };

  const onTriggerKey = (e: KeyboardEvent<HTMLButtonElement>, id: string, index: number) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); keyboardOpen.current = true; setOpen(id); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); shift(index, 1, false); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); shift(index, -1, false); }
    else if (e.key === 'Escape') setOpen(null);
  };

  const onMenuKey = (e: KeyboardEvent<HTMLDivElement>, id: string, index: number) => {
    const items = [...e.currentTarget.querySelectorAll<HTMLElement>('[role^="menuitem"]:not([aria-disabled="true"])')];
    const at = items.indexOf(document.activeElement as HTMLElement);
    const go = (i: number) => { e.preventDefault(); items[(i + items.length) % items.length]?.focus(); };
    if (e.key === 'ArrowDown') go(at + 1);
    else if (e.key === 'ArrowUp') go(at < 0 ? -1 : at - 1);
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(-1);
    else if (e.key === 'ArrowRight') { e.preventDefault(); shift(index, 1, true); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); shift(index, -1, true); }
    else if (e.key === 'Escape') { e.preventDefault(); setOpen(null); bar.current?.querySelector<HTMLElement>(`[data-trigger="${id}"]`)?.focus(); }
    else if (e.key === 'Tab') setOpen(null);
  };

  return (
    <div className="menubar" ref={bar}>
      <div className="menubar-menus" role="menubar" aria-label={label}>
        {menus.map((m, index) => {
          const isOpen = open === m.id;
          return (
            <div className="menu" key={m.id}>
              <button
                type="button" role="menuitem" data-trigger={m.id} aria-haspopup="menu" aria-expanded={isOpen}
                aria-controls={isOpen ? `${base}-${m.id}` : undefined} aria-label={m.ariaLabel}
                className={`menu-trigger${m.icon ? ' menu-trigger-app' : ''}`} data-open={isOpen || undefined}
                onClick={() => setOpen(isOpen ? null : m.id)}
                onPointerEnter={() => { if (open && open !== m.id) setOpen(m.id); }}
                onKeyDown={(e) => onTriggerKey(e, m.id, index)}
              >
                {m.icon && <Icon name={m.icon} size={20} />}
                <span className={m.icon ? 'menu-app-name' : undefined}>{m.label}</span>
              </button>
              {isOpen && (
                <div className="menu-list" role="menu" id={`${base}-${m.id}`} aria-label={m.ariaLabel ?? m.label} onKeyDown={(e) => onMenuKey(e, m.id, index)}>
                  {m.items.map((it, i) => it.kind === 'sep'
                    ? <div key={i} className="menu-sep" role="separator" />
                    : (
                      <button
                        key={i} type="button" tabIndex={-1} className="menu-item"
                        role={it.checked === undefined ? 'menuitem' : 'menuitemcheckbox'}
                        aria-checked={it.checked} aria-disabled={it.disabled || undefined}
                        onPointerEnter={(e) => { if (!it.disabled) e.currentTarget.focus({ preventScroll: true }); }}
                        onClick={() => { if (!it.disabled) { setOpen(null); it.onSelect(); } }}
                      >
                        <span className="menu-check" aria-hidden="true">{it.checked ? '✓' : ''}</span>
                        <span className="menu-label">{it.label}</span>
                        {it.shortcut && <span className="menu-key" aria-hidden="true">{mod}+{it.shortcut}</span>}
                      </button>
                    ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="menubar-status">{children}</div>
    </div>
  );
}

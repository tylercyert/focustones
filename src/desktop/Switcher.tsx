import { Icon } from './icons.tsx';

export interface SwitcherItem { id: string; title: string; icon: string }

interface Props {
  label: string; desktopLabel: string; items: SwitcherItem[]; active: string | null;
  onPick: (id: string) => void; onDesktop: () => void;
}

/** Phones: the app-switcher strip along the bottom, one button per open window. */
export function Switcher({ label, desktopLabel, items, active, onPick, onDesktop }: Props) {
  return (
    <nav className="switcher" aria-label={label}>
      <button type="button" className="switch-btn" aria-label={desktopLabel} aria-current={active === null ? 'true' : undefined} onClick={onDesktop}>
        <Icon name="app" size={28} />
      </button>
      <span className="switch-rule" aria-hidden="true" />
      {items.map((w) => (
        <button key={w.id} type="button" className="switch-btn" aria-label={w.title} aria-current={active === w.id ? 'true' : undefined} onClick={() => onPick(w.id)}>
          <Icon name={w.icon} size={28} />
        </button>
      ))}
    </nav>
  );
}

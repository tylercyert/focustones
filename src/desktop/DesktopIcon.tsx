import { useRef } from 'react';
import { Icon } from './icons.tsx';

interface Props {
  id: string; label: string; icon: string; selected: boolean; phone: boolean; className?: string;
  onSelect: (id: string) => void; onOpen: (id: string) => void;
}

/** A desktop icon: click selects, double-click opens; touch, phones and the keyboard open on one activation. */
export function DesktopIcon({ id, label, icon, selected, phone, className, onSelect, onOpen }: Props) {
  const pointer = useRef('mouse');
  return (
    <button
      type="button" className={`dicon${className ? ` ${className}` : ''}`} data-selected={selected || undefined} data-icon={id}
      onPointerDown={(e) => { pointer.current = e.pointerType; }}
      onClick={(e) => {
        if (phone || pointer.current === 'touch' || e.detail === 0) onOpen(id);
        else onSelect(id);
        pointer.current = 'mouse';
      }}
      onDoubleClick={() => onOpen(id)}
      onFocus={() => onSelect(id)}
    >
      <Icon name={icon} size={phone ? 48 : 40} className="dicon-art" />
      <span className="dicon-label">{label}</span>
    </button>
  );
}

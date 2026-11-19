import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { strings } from '../../content/strings.ts';
import { useDesktop } from '../../desktop/context.ts';
import { Icon } from '../../desktop/icons.tsx';
import { fill, markTrash, moveToTrash, trashAt } from './actions.ts';
import { FOLDER, folderSelection, ITEM_ICONS, ITEMS, present, useFolderSelection, useTrash, type Item } from './store.ts';

const t = strings.delights.distractions;

interface Drag { id: Item; x: number; y: number; px: number; py: number; moved: boolean; over: boolean }

/** The Distractions folder: five playful items to drag into the Trash (or select and press Move to Trash). */
export function DistractionsWindow() {
  const { closeWindow, phone } = useDesktop();
  const trash = useTrash();
  const selected = useFolderSelection();
  const [quip, setQuip] = useState<string | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const dragRef = useRef<Drag | null>(null);
  const items = ITEMS.filter((i) => present(trash, i));
  const sel = selected && items.includes(selected as Item) ? (selected as Item) : null;

  useEffect(() => () => { markTrash(false); }, []);

  const begin = (e: PointerEvent, id: Item) => {
    if (phone || e.button !== 0) return;
    const d = { id, x: e.clientX, y: e.clientY, px: e.clientX, py: e.clientY, moved: false, over: false };
    dragRef.current = d;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const move = (e: PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const moved = d.moved || Math.hypot(e.clientX - d.px, e.clientY - d.py) > 4;
    if (!moved) return;
    const over = !!trashAt(e.clientX, e.clientY);
    markTrash(over);
    const next = { ...d, x: e.clientX, y: e.clientY, moved, over };
    dragRef.current = next;
    setDrag(next);
  };
  const end = (e: PointerEvent) => {
    const d = dragRef.current;
    dragRef.current = null;
    setDrag(null);
    markTrash(false);
    if (d?.moved && trashAt(e.clientX, e.clientY)) moveToTrash([d.id], closeWindow);
  };

  // The listbox keyboard model (WAI-ARIA APG): one Tab stop, selection follows focus; arrows move by one, Home and End
  // jump to the ends, and typing jumps to the next item whose name starts with the letters typed (half a second apart).
  const list = useRef<HTMLDivElement>(null);
  const typed = useRef({ text: '', at: 0 });
  const go = (id: Item) => {
    folderSelection.set(id);
    setQuip(null);
    list.current?.querySelector<HTMLElement>(`[data-item="${id}"]`)?.focus();
  };
  const onKey = (e: KeyboardEvent, id: Item) => {
    const at = items.indexOf(id);
    const to = (i: number) => { e.preventDefault(); go(items[(i + items.length) % items.length]); };
    if (e.key === 'Enter') { e.preventDefault(); setQuip(t.items[id].quip); }
    else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') to(Math.min(at + 1, items.length - 1));
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') to(Math.max(at - 1, 0));
    else if (e.key === 'Home') to(0);
    else if (e.key === 'End') to(items.length - 1);
    else if (e.key.length === 1 && /\S/.test(e.key) && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const now = performance.now();
      const text = (now - typed.current.at < 500 ? typed.current.text : '') + e.key.toLowerCase();
      typed.current = { text, at: now };
      // Repeating one letter cycles through the items that start with it; otherwise search from the current item.
      const same = [...text].every((c) => c === text[0]);
      const needle = same ? text[0] : text;
      const order = [...items.slice(at + (same ? 1 : 0)), ...items.slice(0, at + (same ? 1 : 0))];
      const hit = order.find((i) => t.items[i].name.toLowerCase().startsWith(needle));
      if (hit) { e.preventDefault(); go(hit); }
    }
  };

  const count = items.length === 1 ? t.countOne : fill(t.count, { n: items.length });
  const host = typeof document !== 'undefined' ? document.querySelector('.desktop') : null;

  return (
    <div className="dx dx-folder">
      <div className="dx-folder-bar" aria-live="polite">{count}</div>
      {items.length ? (
        <div ref={list} className="dx-folder-items" role="listbox" aria-label={t.itemsLabel}>
          {items.map((id, i) => (
            <button
              key={id} type="button" role="option" aria-selected={sel === id} className="dx-item" data-item={id}
              tabIndex={(sel ? sel === id : i === 0) ? 0 : -1}
              data-dragging={drag?.moved && drag.id === id ? '' : undefined}
              onClick={() => { folderSelection.set(id); setQuip(null); }}
              onDoubleClick={() => setQuip(t.items[id].quip)}
              onFocus={() => folderSelection.set(id)}
              onKeyDown={(e) => onKey(e, id)}
              onPointerDown={(e) => begin(e, id)} onPointerMove={move} onPointerUp={end} onPointerCancel={() => { dragRef.current = null; setDrag(null); markTrash(false); }}
            >
              <Icon name={ITEM_ICONS[id]} size={phone ? 44 : 36} />
              <span className="dx-item-label">{t.items[id].name}</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="dx-folder-empty">{t.empty}</p>
      )}
      <p className="dx-quip" aria-live="polite">{quip ?? t.hint}</p>
      <div className="dx-buttons">
        <button type="button" className="dx-btn" disabled={!sel} onClick={() => sel && moveToTrash([sel], closeWindow)}>{t.moveToTrash}</button>
        <button type="button" className="dx-btn" onClick={() => moveToTrash([FOLDER], closeWindow)}>{t.trashFolder}</button>
      </div>
      {drag?.moved && host && createPortal(
        <div className="dx-ghost" data-over={drag.over || undefined} style={{ left: drag.x - 18, top: drag.y - 18 }} aria-hidden="true">
          <Icon name={ITEM_ICONS[drag.id]} size={36} />
        </div>,
        host,
      )}
    </div>
  );
}

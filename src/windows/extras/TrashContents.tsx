import { strings } from '../../content/strings.ts';
import { Icon } from '../../desktop/icons.tsx';
import { emptyTrash, fill } from './actions.ts';
import { FOLDER, ITEM_ICONS, useTrash, type Item } from './store.ts';

const t = strings.delights;

/** The Trash window's contents while it holds something: what went in, and Empty Trash. */
export function TrashContents() {
  const { trashed } = useTrash();
  const name = (id: string) => (id === FOLDER ? t.distractions.title : t.distractions.items[id as Item].name);
  return (
    <div className="dx dx-trash">
      <p className="dx-folder-bar">{trashed.length === 1 ? t.trash.holdsOne : fill(t.trash.holds, { n: trashed.length })}</p>
      <ul className="dx-trash-list" aria-label={t.trash.listLabel}>
        {trashed.map((id) => (
          <li key={id}><Icon name={id === FOLDER ? 'folder' : ITEM_ICONS[id as Item]} size={24} /><span>{name(id)}</span></li>
        ))}
      </ul>
      <div className="dx-buttons">
        <button type="button" className="dx-btn dx-btn-default" onClick={() => emptyTrash(t.trash.emptied)}>{t.trash.emptyTrash}</button>
      </div>
    </div>
  );
}

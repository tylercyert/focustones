import { strings } from '../content/strings.ts';
import { TrashContents } from '../windows/extras/index.ts';
import { useTrash } from '../windows/extras/store.ts';
import { Icon } from './icons.tsx';

const t = strings.windows;

export function Help() {
  return (
    <div className="pane">
      <h3 className="pane-title">{t.help.heading}</h3>
      <ul className="pane-list">{t.help.items.map((x) => <li key={x}>{x}</li>)}</ul>
    </div>
  );
}

export function Trash() {
  const { trashed } = useTrash(); // the desktop delights (issue #14) can put the Distractions folder here
  if (trashed.length) return <TrashContents />;
  return (
    <div className="pane pane-center">
      <Icon name="trash" size={48} />
      <p>{t.trash.empty}</p>
      <p className="pane-small">{t.trash.detail}</p>
    </div>
  );
}

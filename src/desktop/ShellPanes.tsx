import { strings } from '../content/strings.ts';
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
  return (
    <div className="pane pane-center">
      <Icon name="trash" size={48} />
      <p>{t.trash.empty}</p>
      <p className="pane-small">{t.trash.detail}</p>
    </div>
  );
}

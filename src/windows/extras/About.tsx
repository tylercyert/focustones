import { strings } from '../../content/strings.ts';
import { Icon } from '../../desktop/icons.tsx';
import { fill } from './actions.ts';
import { memory, useTrash } from './store.ts';

const t = strings.delights.about;

/** About This Desktop: the period "About This Computer" box, with a cheeky memory bar that empties with the Trash. */
export function AboutDesktop() {
  const m = memory(useTrash());
  const rows = [
    { icon: 'app', name: t.focus, value: m.focus },
    { icon: 'folder', name: t.distractions, value: m.distractions },
  ];
  return (
    <div className="dx dx-about">
      <div className="dx-about-head">
        <Icon name="app" size={48} />
        <div>
          <h3 className="dx-title">{t.name}</h3>
          <p className="dx-small">{t.version}</p>
        </div>
      </div>
      <p className="dx-about-memory">{t.memory}</p>
      <p className="dx-about-summary" data-testid="memory-summary">{fill(t.summary, m)}</p>
      <ul className="dx-about-rows">
        {rows.map((r) => (
          <li key={r.name}>
            <Icon name={r.icon} size={16} />
            <span className="dx-about-name">{r.name}</span>
            <span className="dx-about-bar" aria-hidden="true"><i style={{ width: `${r.value}%` }} /></span>
            <span className="dx-about-value">{fill(t.percent, { n: r.value })}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Credits() {
  const c = strings.delights.credits;
  return (
    <div className="dx dx-credits">
      <Icon name="credits" size={48} />
      <h3 className="dx-title">{c.heading}</h3>
      {c.lines.map((l) => <p key={l}>{l}</p>)}
    </div>
  );
}

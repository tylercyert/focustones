import { strings } from '../content/strings.ts';
import { useDesktop } from './context.ts';
import { Icon } from './icons.tsx';

const t = strings.windows.welcome;

export function Welcome() {
  const { phone } = useDesktop();
  return (
    <div className={`pane${phone ? ' pane-center pane-fill' : ''}`}>
      <div className="pane-row"><Icon name="app" size={phone ? 96 : 48} /><h3 className="pane-title">{t.heading}</h3></div>
      <p>{phone ? t.phoneBody : t.body}</p>
      {!phone && <p className="pane-small">{t.tip}</p>}
    </div>
  );
}

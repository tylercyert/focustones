import { strings } from './content/strings.ts';
import { launchWindows } from './desktop/registry.ts';

export default function App() {
  return (
    <div className="desktop">
      <header className="menu-bar">{strings.menuBar.appMenu}</header>
      <main className="desktop-surface" aria-label={strings.siteName}>
        {launchWindows().map((w) => <w.component key={w.id} />)}
        <p className="placeholder">{strings.desktop.placeholder}</p>
      </main>
    </div>
  );
}

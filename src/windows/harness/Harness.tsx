// Dev-only page (`npm run dev`, then /harness.html): renders the windows standalone, in a stand-in frame, until the
// shell (#5) registers them on the real desktop. It is not part of the production build (index.html is the only entry).
// ?w=listen,get picks windows (default: the launch pair); ?bar=1 adds the phone's persistent Get bar.
import { useEffect, useState } from 'react';
import { GetBar } from '../get/GetWindow.tsx';
import { windowSpecs } from '../index.ts';
import { OPEN_WINDOW_EVENT } from '../openWindow.ts';

const params = new URLSearchParams(location.search);
const ids = (params.get('w') ?? 'listen,get').split(',');
const find = (id: string) => windowSpecs.find((w) => w.id === id);

export function Harness() {
  const [open, setOpen] = useState(() => ids.filter((id) => find(id)));
  useEffect(() => {
    const on = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      if (find(id)) setOpen((o) => (o.includes(id) ? o : [...o, id]));
    };
    window.addEventListener(OPEN_WINDOW_EVENT, on);
    return () => window.removeEventListener(OPEN_WINDOW_EVENT, on);
  }, []);
  const picked = open.map(find).filter((w) => w !== undefined);
  return (
    <div className="h-desktop">
      <header className="h-menubar"><b>FocusTones</b><span>File</span><span>Edit</span><span>View</span></header>
      <main className="h-surface" data-count={picked.length}>
        {picked.map((w, i) => (
          <article key={w.id} className="h-window" data-window={w.id} style={{ '--w': `${w.defaultSize.width}px`, '--h': `${w.defaultSize.height}px`, '--i': i } as React.CSSProperties}>
            <div className="h-title"><i className="h-close" /><span>{w.title}</span></div>
            <div className="h-body"><w.component /></div>
          </article>
        ))}
      </main>
      {params.get('bar') === '1' && <div className="h-bar"><GetBar /></div>}
    </div>
  );
}


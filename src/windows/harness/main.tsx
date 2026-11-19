// Dev-only page (`npm run dev`, then /harness.html): renders the windows standalone, in a stand-in frame, until the
// shell (#5) registers them on the real desktop. It is not part of the production build (index.html is the only entry).
// ?w=listen,get picks windows (default: the launch pair); ?bar=1 adds the phone's persistent Get bar.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Harness } from './Harness.tsx';
import './harness.css';

createRoot(document.getElementById('root')!).render(<StrictMode><Harness /></StrictMode>);

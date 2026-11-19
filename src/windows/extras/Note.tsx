import { useId, useState } from 'react';
import { strings } from '../../content/strings.ts';

const t = strings.delights.note;
const NOTE_KEY = 'focustones.note.v1';
const MAX = 500;

const load = () => { try { return localStorage.getItem(NOTE_KEY) ?? ''; } catch { return ''; } };

/** "Today's one thing": a yellow note that keeps its text on this device. */
export function NoteWindow() {
  const [text, setText] = useState(load);
  const id = useId();
  const foot = useId();
  return (
    <div className="dx-note">
      <label className="dx-sr" htmlFor={id}>{t.label}</label>
      <textarea
        id={id} className="dx-note-text" value={text} maxLength={MAX} placeholder={t.placeholder} spellCheck aria-describedby={foot}
        onChange={(e) => { setText(e.target.value); try { localStorage.setItem(NOTE_KEY, e.target.value); } catch { /* storage off: the note lasts this visit */ } }}
      />
      <p className="dx-note-foot" id={foot}>{t.saved}</p>
    </div>
  );
}

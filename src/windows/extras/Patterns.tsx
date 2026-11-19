import { strings } from '../../content/strings.ts';
import { useDesktop } from '../../desktop/context.ts';
import { playChord } from '../../engine/toy.ts';
import { RadioGroup } from '../shared/RadioGroup.tsx';
import { PATTERNS, patternStyle } from './patterns.ts';
import { updateSettings, useSettings } from './store.ts';
import { useBand } from './useBand.ts';

const t = strings.delights.patterns;

/** The Desktop Patterns control panel: eight patterns (the desktop's default and seven originals), and the startup chord. */
export function PatternsPanel() {
  const { pattern, chord } = useSettings();
  const { volume } = useDesktop();
  const band = useBand();
  const ids = ['default', ...PATTERNS.map((p) => p.id)] as const;
  return (
    <div className="dx dx-panel">
      <fieldset className="dx-group">
        <legend>{t.heading}</legend>
        <RadioGroup
          className="dx-swatches" itemClassName="dx-swatch" label={t.heading} value={pattern}
          onChange={(v) => updateSettings({ pattern: v })}
          items={ids.map((id) => ({
            value: id, testId: `pattern-${id}`,
            children: (
              <>
                <span className={`dx-swatch-art${id === 'default' ? ' dx-swatch-default' : ''}`} data-pattern={id === 'default' ? undefined : id} style={patternStyle(id, band)} aria-hidden="true" />
                <span className="dx-swatch-name">{t.names[id as keyof typeof t.names]}</span>
              </>
            ),
          }))}
        />
        <p className="dx-small">{t.tinted}</p>
      </fieldset>
      <fieldset className="dx-group">
        <legend>{t.sound}</legend>
        <label className="dx-check">
          <input type="checkbox" checked={chord} onChange={(e) => updateSettings({ chord: e.target.checked })} />
          <span>{t.chord}</span>
        </label>
        <div className="dx-buttons dx-buttons-start">
          <button type="button" className="dx-btn" onClick={() => playChord(volume)}>{t.preview}</button>
        </div>
      </fieldset>
    </div>
  );
}

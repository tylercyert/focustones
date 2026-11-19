import { strings } from '../../content/strings.ts';
import { FeatureWindow } from './FeatureWindow.tsx';

const F = strings.features;

export const TuneWindow = () => <FeatureWindow placement="tune" frame="/frames/tune.webp" copy={F.tune} pro />;
export const LayersWindow = () => <FeatureWindow placement="layers" frame="/frames/tune.webp" copy={F.layers} pro />;
export const ProgramsWindow = () => <FeatureWindow placement="programs" frame="/frames/mixes.webp" copy={F.programs} pro />;
export const ProgressWindow = () => <FeatureWindow placement="progress" frame="/frames/progress.webp" copy={F.progress} pro={false} />;

export function IphoneWindow() {
  const s = F.iphone;
  return (
    <FeatureWindow placement="iphone" frame="/frames/timer.webp" copy={s} pro={false}>
      <p className="ft-small ft-surfaces-label">{s.surfaces}</p>
      <ul className="ft-chips">
        {[s.lockScreen, s.dynamicIsland, s.controlCenter, s.widget, s.siri].map((x) => <li key={x}>{x}</li>)}
      </ul>
    </FeatureWindow>
  );
}

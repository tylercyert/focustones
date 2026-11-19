import { strings } from '../../content/strings.ts';
import { AppStoreBadge } from '../shared/AppStoreBadge.tsx';

const F = strings.features;

export interface FeatureProps {
  readonly placement: string;
  /** Where the frame lives in public/. */
  readonly frame: string;
  readonly copy: { readonly heading: string; readonly body: string; readonly caption: string; readonly frameAlt: string };
  readonly pro: boolean;
  /** Extra content under the body (the iPhone window's list of surfaces). */
  readonly children?: React.ReactNode;
}

/** One idea from the app: the real App Store frame, an approved line, and the badge. */
export function FeatureWindow({ placement, frame, copy, pro, children }: FeatureProps) {
  return (
    <section className="ft-win ft-flush" aria-label={copy.heading} data-feature={placement}>
      <div className="ft-feature">
        <figure className="ft-frame">
          <img src={frame} alt={`${copy.caption} ${copy.frameAlt}`} width="320" height="696" loading="lazy" />
        </figure>
        <div className="ft-feature-text">
          <span className={pro ? 'ft-eyebrow ft-eyebrow-pro' : 'ft-eyebrow'}>{pro ? F.eyebrowPro : F.eyebrowFree}</span>
          <h2 className="ft-h2">{copy.heading}</h2>
          <p className="ft-p">{copy.body}</p>
          {children}
          <div className="ft-feature-cta">
            <AppStoreBadge placement={placement} height={40} />
          </div>
        </div>
      </div>
    </section>
  );
}

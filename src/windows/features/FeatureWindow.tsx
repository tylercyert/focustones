import { strings } from '../../content/strings.ts';
import { AppStoreBadge } from '../shared/AppStoreBadge.tsx';

const F = strings.features;

/** Frames show at most 280 CSS px wide (windows.css); 320 and 640 px files cover 1× and 2× screens. */
const FRAME_SIZES = '(max-width: 320px) 100vw, 280px';
const frameSet = (frame: string, ext: string) => `${frame}-320.${ext} 320w, ${frame}-640.${ext} 640w`;

export interface FeatureProps {
  readonly placement: string;
  /** The frame's path in public/ without size or extension, e.g. `/frames/tune` (make-images.sh writes the files). */
  readonly frame: string;
  readonly copy: { readonly heading: string; readonly body: string; readonly caption: string; readonly frameAlt: string };
  readonly pro: boolean;
  /** True when the image is a cropped capture of one part of a screen (no phone frame, no caption baked in). */
  readonly crop?: boolean;
  /** Extra content under the body (the iPhone window's list of surfaces). */
  readonly children?: React.ReactNode;
}

/** One idea from the app: the real App Store frame, an approved line, and the badge. */
export function FeatureWindow({ placement, frame, copy, pro, crop, children }: FeatureProps) {
  return (
    <section className="ft-win ft-flush" aria-label={copy.heading} data-feature={placement}>
      <div className="ft-feature">
        <figure className={crop ? 'ft-frame ft-frame-crop' : 'ft-frame'}>
          <picture>
            <source type="image/avif" srcSet={frameSet(frame, 'avif')} sizes={FRAME_SIZES} />
            <source type="image/webp" srcSet={frameSet(frame, 'webp')} sizes={FRAME_SIZES} />
            <img src={`${frame}-640.webp`} alt={`${copy.caption} ${copy.frameAlt}`} width={320} height={crop ? 250 : 696} loading="lazy" decoding="async" />
          </picture>
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

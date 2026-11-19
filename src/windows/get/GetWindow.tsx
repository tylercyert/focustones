import { AppIconImage } from '../../desktop/icons.tsx';
import qr from 'virtual:campaign-qr';
import { strings } from '../../content/strings.ts';
import { AppStoreBadge } from '../shared/AppStoreBadge.tsx';
import { appStoreUrl } from '../shared/campaign.ts';

const G = strings.get;

/** The campaign link as a QR code, generated at build time (vite-plugin-qr.ts) and drawn as one SVG path. */
export function Qr() {
  return (
    <a className="ft-qr" href={appStoreUrl('qr')} target="_blank" rel="noopener" data-testid="qr" aria-label={G.qrAlt}>
      <svg viewBox={`-2 -2 ${qr.size + 4} ${qr.size + 4}`} role="img" aria-label={G.qrAlt} shapeRendering="crispEdges">
        <rect x="-2" y="-2" width={qr.size + 4} height={qr.size + 4} fill="#fff" />
        <path d={qr.path} fill="#0a0c12" />
      </svg>
    </a>
  );
}

/** The pitch: app icon, name, subtitle, badge (iPhone) or QR (computer), prices and the free set. */
export function GetWindow() {
  return (
    <section className="ft-win ft-get" aria-label={G.title}>
      <header className="ft-get-head">
        <AppIconImage className="ft-icon" size={72} />
        <div>
          <h2 className="ft-get-name">{G.appName}</h2>
          <p className="ft-get-sub">{G.subtitle}</p>
        </div>
      </header>
      <p className="ft-get-pitch">{G.pitch}</p>

      <div className="ft-get-cta">
        <div className="ft-get-badge"><AppStoreBadge placement="get-window" height={44} /></div>
        <div className="ft-get-qr ft-well">
          <Qr />
          <div>
            <p className="ft-get-qr-title">{G.qrHeading}</p>
            <p className="ft-get-qr-note">{G.qrNote}</p>
          </div>
        </div>
      </div>

      <ul className="ft-ticks">
        <li>{G.free}</li>
        <li>{G.noAccount}</li>
      </ul>

      <div className="ft-groupbox" role="group" aria-labelledby="ft-get-pro">
        <h3 className="ft-h3 ft-groupbox-label" id="ft-get-pro">{G.proHeading}</h3>
        <p className="ft-p">{G.proBody}</p>
        <p className="ft-small">{G.plansHeading}</p>
        <ul className="ft-prices ft-well">
          <li>{G.monthly}</li>
          <li>{G.annual}</li>
          <li>{G.lifetime}</li>
        </ul>
      </div>
    </section>
  );
}

/** The persistent bar for phones: the shell docks it under the menu bar or above the home indicator. */
export function GetBar() {
  return (
    <aside className="ft-getbar" aria-label={G.barLabel}>
      <AppIconImage size={36} />
      <div className="ft-getbar-text"><strong>{strings.aboutApp.name}</strong><span>{G.barLabel}</span></div>
      <a className="ft-getbar-btn" href={appStoreUrl('bar')} target="_blank" rel="noopener" data-placement="bar">{G.barAction}</a>
    </aside>
  );
}

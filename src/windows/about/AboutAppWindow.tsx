import { strings } from '../../content/strings.ts';
import { AppStoreBadge } from '../shared/AppStoreBadge.tsx';
import { EULA_URL, PRIVACY_URL, SUPPORT_URL } from '../shared/campaign.ts';

const A = strings.aboutApp;

/** The FocusTones menu's About: credits, what the site does with your data (nothing), and the legal links. */
export function AboutAppWindow() {
  return (
    <section className="ft-win ft-about-app" aria-label={A.title}>
      <img className="ft-icon ft-icon-lg" src="/icons/app-256.png" alt="" width="96" height="96" />
      <h2 className="ft-h2 ft-center">{A.name}</h2>
      <p className="ft-small ft-center">{A.version}</p>
      <p className="ft-p ft-center">{A.credits}</p>
      <p className="ft-p ft-center">{A.madeBy}</p>
      <div className="ft-privacy">
        <h3 className="ft-h3">{A.privacyHeading}</h3>
        <p className="ft-p" data-testid="privacy-line">{A.privacyBody}</p>
        <p className="ft-links">
          <a href={PRIVACY_URL} target="_blank" rel="noopener">{A.privacyLink}</a>
          <a href={SUPPORT_URL} target="_blank" rel="noopener">{A.supportLink}</a>
          <a href={EULA_URL} target="_blank" rel="noopener">{A.termsLink}</a>
        </p>
      </div>
      <div className="ft-center"><AppStoreBadge placement="about" height={40} /></div>
      <p className="ft-small ft-center ft-fine">{A.trademarks}</p>
    </section>
  );
}

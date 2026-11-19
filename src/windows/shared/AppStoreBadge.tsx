import { strings } from '../../content/strings.ts';
import { appStoreUrl } from './campaign.ts';

/** Apple's official black badge (self-hosted), linking to the App Store page with a per-placement campaign. */
export function AppStoreBadge({ placement, height = 40 }: { readonly placement: string; readonly height?: number }) {
  return (
    <a className="ft-badge" href={appStoreUrl(placement)} data-placement={placement} target="_blank" rel="noopener">
      <img src="/badges/app-store-black.svg" alt={strings.get.badgeAlt} height={height} width={Math.round(height * 2.9916)} />
    </a>
  );
}

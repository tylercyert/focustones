// The App Store campaign link (Apple's campaign-link rules: pt = provider token, ct = campaign, mt = media type).
// Self-contained and erasable-only: vite.config.ts also imports it to generate the QR code at build time.

export const APP_STORE_ID = '6834913847';

// TODO(owner): replace with the provider token (`pt`) from App Store Connect > Analytics > Campaigns. It is not in the
// focustones-ios docs, so links carry this placeholder until the owner supplies it; they still open the App Store page.
export const PROVIDER_TOKEN = 'TODO-owner-provider-token';

/** The App Store page with a per-placement campaign, e.g. `appStoreUrl('qr')` → `ct=focustones-co-qr`. */
export function appStoreUrl(placement: string): string {
  return `https://apps.apple.com/app/apple-store/id${APP_STORE_ID}?pt=${PROVIDER_TOKEN}&ct=focustones-co-${placement}&mt=8`;
}

export const PRIVACY_URL = 'https://tyl.sh/focustones/privacy';
export const SUPPORT_URL = 'https://tyl.sh/focustones/support';
export const EULA_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';

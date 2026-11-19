// Every visible string on the site lives here, so the owner approves one file (docs/product.md, public words).
// Later issues add their keys here. Banned words are checked over src/ (scripts/check.sh).
export interface Strings {
  readonly siteName: string;
  readonly menuBar: { readonly appMenu: string };
  readonly desktop: { readonly placeholder: string };
}

export const strings: Strings = {
  siteName: 'FocusTones',
  menuBar: { appMenu: 'FocusTones' },
  desktop: { placeholder: 'The desktop is under construction.' },
};

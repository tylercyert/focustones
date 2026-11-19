import type { Plugin } from 'vite';
import { strings } from './src/content/strings.ts';
import { APP_STORE_ID } from './src/windows/shared/campaign.ts';

export const SITE_URL = 'https://focustones.co/';

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** The values index.html's `%FT_…%` placeholders take: the copy comes from strings.ts, so the owner approves one file. */
export const headValues: Record<string, string> = {
  FT_TITLE: strings.meta.title,
  FT_DESCRIPTION: strings.meta.description,
  FT_IMAGE_ALT: strings.meta.imageAlt,
  FT_SITE_NAME: strings.siteName,
  FT_URL: SITE_URL,
  FT_IMAGE: `${SITE_URL}og.png`,
  FT_APP_ID: APP_STORE_ID,
};

/** Fills index.html's head from strings.ts; fails the build when a placeholder has no value. */
export function headMeta(): Plugin {
  return {
    name: 'head-meta',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) =>
        html.replace(/%(FT_[A-Z_]+)%/g, (_, key: string) => {
          if (!(key in headValues)) throw new Error(`index.html: no value for %${key}%`);
          return escape(headValues[key]);
        }),
    },
  };
}

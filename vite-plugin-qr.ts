import qrcode from 'qrcode-generator';
import type { Plugin } from 'vite';
import { appStoreUrl } from './src/windows/shared/campaign.ts';

/** One SVG path (unit squares, `M x y h1 v1 h-1 z` per dark module) for `text`, plus the grid size. */
export function qrPath(text: string): { size: number; path: string } {
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  const size = qr.getModuleCount();
  let path = '';
  for (let y = 0; y < size; y++) {
    let x = 0;
    while (x < size) {
      if (!qr.isDark(y, x)) { x++; continue; }
      const start = x;
      while (x < size && qr.isDark(y, x)) x++;
      path += `M${start} ${y}h${x - start}v1h-${x - start}z`;
    }
  }
  return { size, path };
}

const ID = 'virtual:campaign-qr';

/** `import qr from 'virtual:campaign-qr'`: the QR code for the campaign link, generated at build time. */
export function campaignQr(): Plugin {
  return {
    name: 'campaign-qr',
    resolveId: (id) => (id === ID ? `\0${ID}` : undefined),
    load(id) {
      if (id !== `\0${ID}`) return undefined;
      return `export default ${JSON.stringify({ ...qrPath(appStoreUrl('qr')), url: appStoreUrl('qr') })};`;
    },
  };
}

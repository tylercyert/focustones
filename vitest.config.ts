import { defineConfig } from 'vitest/config';
import { campaignQr } from './vite-plugin-qr.ts';

export default defineConfig({ plugins: [campaignQr()], test: { include: ['src/**/*.test.ts', 'scripts/**/*.test.mjs'] } });

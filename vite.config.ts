import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { campaignQr } from './vite-plugin-qr.ts'
import { headMeta } from './vite-plugin-head.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), campaignQr(), headMeta()],
})

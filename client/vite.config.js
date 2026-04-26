import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  server: {
    proxy: {
      '/ws': {
        target: 'ws://127.0.0.1:3387',
        ws: true,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    proxy: {
      '/ws': {
        target: 'ws://127.0.0.1:3387',
        ws: true,
      },
    },
  },
  plugins: [
    react(),
    nodePolyfills(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'android-chrome-192x192.png', 'android-chrome-512x512.png'],
      manifest: {
        short_name: 'MinDrop',
        name: 'MinDrop - Private Local File Sharing',
        description: 'Send files and messages directly between nearby devices with a free, private WebRTC AirDrop alternative.',
        icons: [
          {
            src: 'favicon.ico',
            sizes: '64x64 32x32 24x24 16x16',
            type: 'image/x-icon',
          },
          {
            src: 'android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
        start_url: '/',
        scope: '/',
        display: 'standalone',
        categories: ['utilities', 'productivity'],
        theme_color: '#212A37',
        background_color: '#171E28',
      },
    }),
  ],
});

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'prompt',
        injectRegister: null,
        includeAssets: [
          'icons/favicon.ico',
          'icons/favicon.svg', 
          'icons/apple-touch-icon.png',
          'icons/*.png',
          'icons/*.svg'
        ],
        manifest: {
          name: 'RaceGraph Studio',
          short_name: 'RaceGraph',
          description: 'Comprehensive Race Chart Animator — animate your data beautifully',
          theme_color: '#7c6fff',
          background_color: '#0b0b12',
          display: 'standalone',
          orientation: 'any',
          scope: '/',
          start_url: '/',
          lang: 'en',
          categories: ['productivity', 'utilities', 'data visualization'],
          icons: [
            { src: 'icons/pwa-64.png', sizes: '64x64', type: 'image/png' },
            { src: 'icons/pwa-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icons/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: 'icons/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
            { src: 'icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
          ],
          shortcuts: [
            {
              name: 'Bar Race Chart',
              short_name: 'Bar Race',
              description: 'Open Bar Race Chart mode',
              url: '/?chart=bar',
              icons: [{ src: 'icons/shortcut-bar.png', sizes: '96x96' }]
            },
            {
              name: 'New Chart',
              short_name: 'New Chart',
              description: 'Start a new race chart',
              url: '/?action=new',
              icons: [{ src: 'icons/shortcut-new.png', sizes: '96x96' }]
            }
          ],
          display_override: ['window-controls-overlay', 'standalone', 'browser'],
          file_handlers: [
            {
              action: '/',
              accept: { 'text/csv': ['.csv'], 'text/tab-separated-values': ['.tsv'] }
            }
          ],
          share_target: {
            action: '/share-target',
            method: 'POST',
            enctype: 'multipart/form-data',
            params: {
              title: 'title',
              text: 'text',
              files: [{ name: 'file', accept: ['text/csv', '.csv', '.tsv'] }]
            }
          },
          protocol_handlers: [
            { protocol: 'web+racegraph', url: '/?data=%s' }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,webmanifest}'],
          globIgnores: ['**/node_modules/**', '**/screenshots/**'],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: false,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] }
              }
            },
            {
              urlPattern: /^https:\/\/cdnjs\.cloudflare\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'cdn-cache',
                expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 90 },
                cacheableResponse: { statuses: [0, 200] }
              }
            },
            {
              urlPattern: /^https:\/\/generativelanguage\.googleapis\.com\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'gemini-api-cache',
                networkTimeoutSeconds: 10,
                expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
                cacheableResponse: { statuses: [0, 200] }
              }
            },
            {
              urlPattern: /^https?.*/,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'app-shell-cache',
                expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
                cacheableResponse: { statuses: [0, 200] }
              }
            }
          ]
        },
        devOptions: {
          enabled: true,
          type: 'module',
          navigateFallback: 'index.html'
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});

import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// The app is a plain web app, installed from its page as a PWA.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // The app registers the worker itself (src/platform/pwa.ts), and only in the production build.
      injectRegister: false,
      // A new version is fetched in the background and takes over the next time the app is opened,
      // never in the middle of an edit.
      registerType: 'prompt',
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,webmanifest}'],
        navigateFallback: 'index.html',
      },
      manifest: {
        name: 'Summoner Mobile',
        short_name: 'Summoner',
        description: "Design a champion's concept on your phone: story, identity and abilities.",
        // Relative, so it works from a site root or a project subfolder (GitHub Pages).
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#010a13',
        theme_color: '#010a13',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  // Relative asset paths: the app is served from a subfolder on GitHub Pages, not from a site root.
  base: './',
  build: { outDir: 'dist', sourcemap: false },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'node',
    // Component tests opt in with `// @vitest-environment jsdom`.
    setupFiles: ['./src/test/setup.ts'],
  },
})

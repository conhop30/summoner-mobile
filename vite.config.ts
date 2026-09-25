import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// The app is a plain web app; Capacitor wraps the built `dist` folder in an Android shell.
export default defineConfig({
  plugins: [react()],
  // Relative asset paths: the WebView serves the app from its own origin, not from a site root.
  base: './',
  build: { outDir: 'dist', sourcemap: false },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'node',
    // Component tests opt in with `// @vitest-environment jsdom`.
    setupFiles: ['./src/test/setup.ts'],
  },
})

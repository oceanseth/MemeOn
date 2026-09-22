/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { playwright } from '@vitest/browser-playwright'
import { configDefaults } from 'vitest/config'
const dirname =
  typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url))
const underVitest = Boolean(process.env.VITEST)

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
const proxy = {
  '/api': {
    target: 'http://localhost:3001',
    changeOrigin: true,
    secure: false,
  },
  '/m/': {
    target: 'http://localhost:3001',
    changeOrigin: true,
    secure: false,
  },
}
export default defineConfig(async ({ command, isPreview }) => ({
  plugins: [
    react(),
    tailwindcss(),
    ...(command === 'serve' && !isPreview && !underVitest
      ? [(await import('@popmelt.com/core/vite')).popmelt()]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(dirname, 'src'),
      // Popmelt peers lucide-react; this repo never installs that package.
      ...(!underVitest
        ? { 'lucide-react': path.resolve(dirname, 'src/popmeltLucideStub.ts') }
        : {}),
    },
  },
  optimizeDeps: {
    include: ['msw-storybook-addon/csf3'],
    ...(!underVitest ? { exclude: ['lucide-react'] } : {}),
  },
  server: {
    port: 5173,
    proxy,
  },
  preview: {
    port: 4173,
    proxy,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  test: {
    projects: [
      {
        // node environment, no plugins; the `@` alias is restated because this project does not extend the root config
        resolve: {
          alias: { '@': path.resolve(dirname, 'src') },
        },
        test: {
          name: 'unit',
          environment: 'node',
          include: [
            'src/**/*.test.ts',
            'src/**/*.test.tsx',
            '.storybook/**/*.test.ts',
            '.storybook/**/*.test.tsx',
          ],
          // *.test.tsx also matches *.runtime.test.tsx; those stay on project runtime.
          exclude: [...configDefaults.exclude, '**/*.runtime.test.tsx'],
        },
      },
      {
        extends: true,
        test: {
          name: 'runtime',
          include: ['src/**/*.runtime.test.tsx'],
          browser: {
            enabled: true,
            headless: true,
            screenshotDirectory: path.join(dirname, 'node_modules/.cache/runtime-screenshots'),
            provider: playwright({
              contextOptions: { reducedMotion: 'reduce' },
            }),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({
            configDir: path.join(dirname, '.storybook'),
          }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({
              contextOptions: { reducedMotion: 'reduce' },
            }),
            instances: [
              {
                browser: 'chromium',
              },
            ],
          },
        },
      },
    ],
  },
}))

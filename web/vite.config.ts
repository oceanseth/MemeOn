/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
const proxy = {
  '/api': {
    target: 'http://localhost:3001',
    changeOrigin: true,
    secure: false
  },
  '/m': {
    target: 'http://localhost:3001',
    changeOrigin: true,
    secure: false
  }
};
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy
  },
  preview: {
    port: 4173,
    proxy
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  test: {
    projects: [{
      test: {
        name: 'unit',
        environment: 'node',
        include: ['src/**/*.test.ts']
      }
    }, {
      extends: true,
      plugins: [
      // The plugin will run tests for the stories defined in your Storybook config
      // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
      storybookTest({
        configDir: path.join(dirname, '.storybook')
      })],
      test: {
        name: 'storybook',
        browser: {
          enabled: true,
          headless: true,
          provider: playwright({}),
          instances: [{
            browser: 'chromium'
          }]
        }
      }
    }]
  }
});
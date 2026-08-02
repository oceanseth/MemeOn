import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

// Library build: the design system ships as a real package entry so
// /design-sync bundles a genuine dist/ instead of a hand-written entry.
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: () => 'index.es.js',
    },
    rollupOptions: {
      // Consumers provide these — never bundle a second React.
      external: ['react', 'react-dom', 'react/jsx-runtime', 'react-router-dom'],
    },
    sourcemap: true,
  },
})

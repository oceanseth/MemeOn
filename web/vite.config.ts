import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

// Remote dev API so local UI works without AWS. Full local stack:
//   MEMEON_API_TARGET=http://localhost:3001 npm run dev
const apiTarget = process.env.MEMEON_API_TARGET ?? 'https://dev.memeon.ai'

const proxy = {
  '/api': {
    target: apiTarget,
    changeOrigin: true,
    secure: true,
  },
  '/m': {
    target: apiTarget,
    changeOrigin: true,
    secure: true,
  },
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Anchored so only the bare specifier is aliased — subpaths like
    // '@memeon/ui/styles.css' resolve through the package's exports map.
    alias: [
      {
        // The app consumes the design system from source — no ui build needed
        // to run or ship web. `ui`'s dist/ exists for /design-sync, not for us.
        find: /^@memeon\/ui$/,
        replacement: resolve(__dirname, '../ui/src/index.ts'),
      },
    ],
  },
  server: { port: 5173, proxy },
  preview: { port: 4173, proxy },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})

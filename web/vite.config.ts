import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const webPort = Number(process.env.WEB_PORT ?? 5173)
// Dev server talks to the deployed dev backend by default. To use a local API
// instead: API_TARGET=http://localhost:$API_PORT npm run dev:web
const apiTarget = process.env.API_TARGET ?? 'https://dev.memeon.ai'

const proxy = {
  '/api': {
    target: apiTarget,
    changeOrigin: true,
    secure: false,
  },
  // The backend owns /m/:id so share links unfurl with OG tags, but that HTML
  // points at built /assets/* bundles which don't exist under the dev server.
  // Browser navigations get the SPA instead; crawlers (Accept: */*) still proxy
  // through to the real OG page.
  '/m': {
    target: apiTarget,
    changeOrigin: true,
    secure: false,
    bypass: (req: { headers: Record<string, string | undefined> }) =>
      req.headers.accept?.includes('text/html') ? '/index.html' : undefined,
  },
}

export default defineConfig({
  plugins: [react()],
  server: { port: webPort, proxy },
  preview: { port: 4173, proxy },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})

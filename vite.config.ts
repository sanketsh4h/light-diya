import { defineConfig } from 'vitest/config'
import { loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Base path for the build. Set BASE_PATH=/light-diya/ to serve the site from a
 * sub-path (for example GitHub Pages). Defaults to the domain root.
 */
function basePath(): string {
  const raw = process.env.BASE_PATH?.trim() || '/'
  const withLead = raw.startsWith('/') ? raw : `/${raw}`
  return withLead.endsWith('/') ? withLead : `${withLead}/`
}

/**
 * Production builds carry a Content-Security-Policy meta tag that limits every
 * kind of request to the site's own origin. The one exception is Firestore,
 * for the shared count of lit diyas, and only when Firebase is configured.
 * The dev server is left alone because hot reload needs inline scripts and a
 * websocket.
 */
function csp(firestore: boolean): string {
  return [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self'",
    "img-src 'self'",
    "font-src 'self'",
    "media-src 'self'",
    firestore ? "connect-src 'self' https://firestore.googleapis.com" : "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')
}

function cspMeta(firestore: boolean): Plugin {
  return {
    name: 'csp-meta',
    apply: 'build',
    transformIndexHtml() {
      return [
        {
          tag: 'meta',
          attrs: { 'http-equiv': 'Content-Security-Policy', content: csp(firestore) },
          injectTo: 'head-prepend',
        },
      ]
    },
  }
}

export default defineConfig(({ mode }) => {
  // Load every env key, so the short names (API_KEY, PROJECT_ID) work too.
  const env = loadEnv(mode, process.cwd(), '')
  const firestore = Boolean(
    (env.API_KEY || env.VITE_FIREBASE_API_KEY) && (env.PROJECT_ID || env.VITE_FIREBASE_PROJECT_ID),
  )
  return {
    base: basePath(),
    // Expose the two Firebase settings to the site (plus the usual VITE_ prefix).
    envPrefix: ['VITE_', 'API_KEY', 'PROJECT_ID'],
    plugins: [react(), cspMeta(firestore)],
    define: {
      // Vercel Web Analytics is served by Vercel itself (/_vercel/insights), so
      // it is only switched on for builds made there (Vercel sets VERCEL=1).
      __VERCEL_ANALYTICS__: JSON.stringify(process.env.VERCEL === '1'),
    },
    build: {
      // Keep every asset as a real file so the CSP never needs to allow data: URIs.
      assetsInlineLimit: 0,
    },
    test: {
      include: ['src/**/*.test.{ts,tsx}'],
      environment: 'node',
    },
  }
})

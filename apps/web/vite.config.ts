import {defineConfig, loadEnv} from 'vite';
import react from '@vitejs/plugin-react';
import {VitePWA} from 'vite-plugin-pwa';
import tailwindcss from '@tailwindcss/vite';
import vike from 'vike/plugin';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = env.VITE_GRAPHQL_PROXY_TARGET ?? 'http://api:3000';

  const devCSP = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    "connect-src 'self' ws: http: https:",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
  ].join('; ');

  return {
    plugins: [
      vike(),
      tailwindcss(),
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
        manifest: {
          name: 'TrashScanner™',
          short_name: 'TrashScanner',
          description: 'Scan and track products',
          theme_color: '#ffffff',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
          ],
        },
      }),
    ],
    server: {
      port: 5173,
      host: true,
      headers: {
        'Content-Security-Policy': devCSP,
      },
      proxy: {
        '/graphql': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
    },
  };
});

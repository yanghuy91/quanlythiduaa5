import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig, Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

function stateStoragePlugin(): Plugin {
  return {
    name: 'state-storage-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/api/state') {
          const filePath = path.resolve(process.cwd(), 'data', 'classroom_state.json');
          if (req.method === 'GET') {
            if (fs.existsSync(filePath)) {
              try {
                const data = fs.readFileSync(filePath, 'utf-8');
                res.setHeader('Content-Type', 'application/json');
                res.end(data);
                return;
              } catch (e) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: 'Failed to read server state' }));
                return;
              }
            } else {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ initialized: false }));
              return;
            }
          }
          if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk) => { body += chunk; });
            req.on('end', () => {
              try {
                const parsed = JSON.parse(body);
                const dir = path.dirname(filePath);
                if (!fs.existsSync(dir)) {
                  fs.mkdirSync(dir, { recursive: true });
                }
                fs.writeFileSync(filePath, JSON.stringify(parsed, null, 2), 'utf-8');
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, timestamp: Date.now() }));
              } catch (e) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Invalid JSON state' }));
              }
            });
            return;
          }
        }
        next();
      });
    },
  };
}

// Prevent Vite 8 CLI from exiting when stdin closes (EOF) in non-interactive container environments
process.env.CI = 'true';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      stateStoragePlugin(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icon.svg'],
        manifest: {
          id: '/',
          name: '10A5',
          short_name: '10A5',
          description: 'Ứng dụng Quản lý Nề nếp & Thi đua Lớp 10A5 - THPT Số 2 Đức Phổ',
          theme_color: '#1e1b4b',
          background_color: '#F6F6F3',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true'
        ? null
        : {
            ignored: ['**/node_modules/**', '**/dist/**', '**/dist-single/**', '**/data/**', '**/.git/**', '**/src/assets/**'],
          },
    },
  };
});

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig, Plugin } from 'vite';

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
    plugins: [react(), tailwindcss(), stateStoragePlugin()],
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

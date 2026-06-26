import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { readFileSync } from 'fs';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'admin-mpa',
      // Dev server: intercept /admin/* and serve admin/index.html through Vite's pipeline
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          const url = req.url ?? '';
          const isAdminPath =
            url === '/admin' ||
            url === '/admin/' ||
            (url.startsWith('/admin/') && !/\.[a-zA-Z0-9]+$/.test(url.split('?')[0]));

          if (!isAdminPath) return next();

          try {
            let html = readFileSync(resolve(__dirname, 'admin/index.html'), 'utf-8');
            html = await server.transformIndexHtml('/admin/index.html', html);
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.statusCode = 200;
            res.end(html);
          } catch (e) {
            next(e);
          }
        });
      },
      // Preview server: same treatment after build
      configurePreviewServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url ?? '';
          const isAdminPath =
            url === '/admin' ||
            url === '/admin/' ||
            (url.startsWith('/admin/') && !/\.[a-zA-Z0-9]+$/.test(url.split('?')[0]));

          if (!isAdminPath) return next();

          try {
            const html = readFileSync(resolve(__dirname, 'dist/admin/index.html'), 'utf-8');
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.statusCode = 200;
            res.end(html);
          } catch (e) {
            next(e);
          }
        });
      },
    },
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      input: {
        main:  resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin/index.html'),
      },
    },
  },
  server: {
    hmr: {
      overlay: false,
    },
  },
});

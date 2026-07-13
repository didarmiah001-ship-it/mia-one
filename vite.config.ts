import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { readFileSync } from 'fs';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'admin-mpa',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          const url = req.url ?? '';
          // Redirect /admin → /admin/ so relative paths in admin/index.html
          // resolve under /admin/ instead of / (which would load the customer app).
          if (url === '/admin' || url === '/admin?') {
            res.statusCode = 301;
            res.setHeader('Location', '/admin/');
            return res.end();
          }
          const isAdminPath =
            url === '/admin/' ||
            (url.startsWith('/admin/') && !/\.[a-zA-Z0-9]+$/.test(url.split('?')[0]));
          if (!isAdminPath) return next();
          try {
            let html = readFileSync(resolve(__dirname, 'admin/index.html'), 'utf-8');
            html = await server.transformIndexHtml('/admin/index.html', html);
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.statusCode = 200;
            res.end(html);
          } catch (e) { next(e); }
        });
      },
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
          } catch (e) { next(e); }
        });
      },
    },
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    chunkSizeWarningLimit: 600,
    cssCodeSplit: true,
    rollupOptions: {
      input: {
        main:  resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin/index.html'),
      },
      output: {
        // Stable chunk names for long-term HTTP caching
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('react-dom') || id.includes('react/') || id.includes('scheduler')) {
            return 'react-vendor';
          }
          if (id.includes('@supabase')) {
            return 'supabase';
          }
          if (id.includes('lucide-react')) {
            return 'icons';
          }
          return 'vendor';
        },
      },
    },
  },
  server: {
    hmr: { overlay: false },
  },
});

// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { resolve } from "path";
import { readFileSync } from "fs";
var __vite_injected_original_dirname = "/home/project";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    {
      name: "admin-mpa",
      // Dev server: intercept /admin/* and serve admin/index.html through Vite's pipeline
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          const url = req.url ?? "";
          const isAdminPath = url === "/admin" || url === "/admin/" || url.startsWith("/admin/") && !/\.[a-zA-Z0-9]+$/.test(url.split("?")[0]);
          if (!isAdminPath) return next();
          try {
            let html = readFileSync(resolve(__vite_injected_original_dirname, "admin/index.html"), "utf-8");
            html = await server.transformIndexHtml("/admin/index.html", html);
            res.setHeader("Content-Type", "text/html; charset=utf-8");
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
          const url = req.url ?? "";
          const isAdminPath = url === "/admin" || url === "/admin/" || url.startsWith("/admin/") && !/\.[a-zA-Z0-9]+$/.test(url.split("?")[0]);
          if (!isAdminPath) return next();
          try {
            const html = readFileSync(resolve(__vite_injected_original_dirname, "dist/admin/index.html"), "utf-8");
            res.setHeader("Content-Type", "text/html; charset=utf-8");
            res.statusCode = 200;
            res.end(html);
          } catch (e) {
            next(e);
          }
        });
      }
    }
  ],
  optimizeDeps: {
    exclude: ["lucide-react"]
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      input: {
        main: resolve(__vite_injected_original_dirname, "index.html"),
        admin: resolve(__vite_injected_original_dirname, "admin/index.html")
      }
    }
  },
  server: {
    hmr: {
      overlay: false
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgeyByZXNvbHZlIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyByZWFkRmlsZVN5bmMgfSBmcm9tICdmcyc7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbXG4gICAgcmVhY3QoKSxcbiAgICB7XG4gICAgICBuYW1lOiAnYWRtaW4tbXBhJyxcbiAgICAgIC8vIERldiBzZXJ2ZXI6IGludGVyY2VwdCAvYWRtaW4vKiBhbmQgc2VydmUgYWRtaW4vaW5kZXguaHRtbCB0aHJvdWdoIFZpdGUncyBwaXBlbGluZVxuICAgICAgY29uZmlndXJlU2VydmVyKHNlcnZlcikge1xuICAgICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKGFzeW5jIChyZXEsIHJlcywgbmV4dCkgPT4ge1xuICAgICAgICAgIGNvbnN0IHVybCA9IHJlcS51cmwgPz8gJyc7XG4gICAgICAgICAgY29uc3QgaXNBZG1pblBhdGggPVxuICAgICAgICAgICAgdXJsID09PSAnL2FkbWluJyB8fFxuICAgICAgICAgICAgdXJsID09PSAnL2FkbWluLycgfHxcbiAgICAgICAgICAgICh1cmwuc3RhcnRzV2l0aCgnL2FkbWluLycpICYmICEvXFwuW2EtekEtWjAtOV0rJC8udGVzdCh1cmwuc3BsaXQoJz8nKVswXSkpO1xuXG4gICAgICAgICAgaWYgKCFpc0FkbWluUGF0aCkgcmV0dXJuIG5leHQoKTtcblxuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsZXQgaHRtbCA9IHJlYWRGaWxlU3luYyhyZXNvbHZlKF9fZGlybmFtZSwgJ2FkbWluL2luZGV4Lmh0bWwnKSwgJ3V0Zi04Jyk7XG4gICAgICAgICAgICBodG1sID0gYXdhaXQgc2VydmVyLnRyYW5zZm9ybUluZGV4SHRtbCgnL2FkbWluL2luZGV4Lmh0bWwnLCBodG1sKTtcbiAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICd0ZXh0L2h0bWw7IGNoYXJzZXQ9dXRmLTgnKTtcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gMjAwO1xuICAgICAgICAgICAgcmVzLmVuZChodG1sKTtcbiAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBuZXh0KGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9LFxuICAgICAgLy8gUHJldmlldyBzZXJ2ZXI6IHNhbWUgdHJlYXRtZW50IGFmdGVyIGJ1aWxkXG4gICAgICBjb25maWd1cmVQcmV2aWV3U2VydmVyKHNlcnZlcikge1xuICAgICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKChyZXEsIHJlcywgbmV4dCkgPT4ge1xuICAgICAgICAgIGNvbnN0IHVybCA9IHJlcS51cmwgPz8gJyc7XG4gICAgICAgICAgY29uc3QgaXNBZG1pblBhdGggPVxuICAgICAgICAgICAgdXJsID09PSAnL2FkbWluJyB8fFxuICAgICAgICAgICAgdXJsID09PSAnL2FkbWluLycgfHxcbiAgICAgICAgICAgICh1cmwuc3RhcnRzV2l0aCgnL2FkbWluLycpICYmICEvXFwuW2EtekEtWjAtOV0rJC8udGVzdCh1cmwuc3BsaXQoJz8nKVswXSkpO1xuXG4gICAgICAgICAgaWYgKCFpc0FkbWluUGF0aCkgcmV0dXJuIG5leHQoKTtcblxuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBodG1sID0gcmVhZEZpbGVTeW5jKHJlc29sdmUoX19kaXJuYW1lLCAnZGlzdC9hZG1pbi9pbmRleC5odG1sJyksICd1dGYtOCcpO1xuICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ3RleHQvaHRtbDsgY2hhcnNldD11dGYtOCcpO1xuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSAyMDA7XG4gICAgICAgICAgICByZXMuZW5kKGh0bWwpO1xuICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIG5leHQoZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgfSxcbiAgXSxcbiAgb3B0aW1pemVEZXBzOiB7XG4gICAgZXhjbHVkZTogWydsdWNpZGUtcmVhY3QnXSxcbiAgfSxcbiAgYnVpbGQ6IHtcbiAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDYwMCxcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBpbnB1dDoge1xuICAgICAgICBtYWluOiAgcmVzb2x2ZShfX2Rpcm5hbWUsICdpbmRleC5odG1sJyksXG4gICAgICAgIGFkbWluOiByZXNvbHZlKF9fZGlybmFtZSwgJ2FkbWluL2luZGV4Lmh0bWwnKSxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbiAgc2VydmVyOiB7XG4gICAgaG1yOiB7XG4gICAgICBvdmVybGF5OiBmYWxzZSxcbiAgICB9LFxuICB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXlOLFNBQVMsb0JBQW9CO0FBQ3RQLE9BQU8sV0FBVztBQUNsQixTQUFTLGVBQWU7QUFDeEIsU0FBUyxvQkFBb0I7QUFIN0IsSUFBTSxtQ0FBbUM7QUFNekMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLElBQ047QUFBQSxNQUNFLE1BQU07QUFBQTtBQUFBLE1BRU4sZ0JBQWdCLFFBQVE7QUFDdEIsZUFBTyxZQUFZLElBQUksT0FBTyxLQUFLLEtBQUssU0FBUztBQUMvQyxnQkFBTSxNQUFNLElBQUksT0FBTztBQUN2QixnQkFBTSxjQUNKLFFBQVEsWUFDUixRQUFRLGFBQ1AsSUFBSSxXQUFXLFNBQVMsS0FBSyxDQUFDLGtCQUFrQixLQUFLLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQyxDQUFDO0FBRXpFLGNBQUksQ0FBQyxZQUFhLFFBQU8sS0FBSztBQUU5QixjQUFJO0FBQ0YsZ0JBQUksT0FBTyxhQUFhLFFBQVEsa0NBQVcsa0JBQWtCLEdBQUcsT0FBTztBQUN2RSxtQkFBTyxNQUFNLE9BQU8sbUJBQW1CLHFCQUFxQixJQUFJO0FBQ2hFLGdCQUFJLFVBQVUsZ0JBQWdCLDBCQUEwQjtBQUN4RCxnQkFBSSxhQUFhO0FBQ2pCLGdCQUFJLElBQUksSUFBSTtBQUFBLFVBQ2QsU0FBUyxHQUFHO0FBQ1YsaUJBQUssQ0FBQztBQUFBLFVBQ1I7QUFBQSxRQUNGLENBQUM7QUFBQSxNQUNIO0FBQUE7QUFBQSxNQUVBLHVCQUF1QixRQUFRO0FBQzdCLGVBQU8sWUFBWSxJQUFJLENBQUMsS0FBSyxLQUFLLFNBQVM7QUFDekMsZ0JBQU0sTUFBTSxJQUFJLE9BQU87QUFDdkIsZ0JBQU0sY0FDSixRQUFRLFlBQ1IsUUFBUSxhQUNQLElBQUksV0FBVyxTQUFTLEtBQUssQ0FBQyxrQkFBa0IsS0FBSyxJQUFJLE1BQU0sR0FBRyxFQUFFLENBQUMsQ0FBQztBQUV6RSxjQUFJLENBQUMsWUFBYSxRQUFPLEtBQUs7QUFFOUIsY0FBSTtBQUNGLGtCQUFNLE9BQU8sYUFBYSxRQUFRLGtDQUFXLHVCQUF1QixHQUFHLE9BQU87QUFDOUUsZ0JBQUksVUFBVSxnQkFBZ0IsMEJBQTBCO0FBQ3hELGdCQUFJLGFBQWE7QUFDakIsZ0JBQUksSUFBSSxJQUFJO0FBQUEsVUFDZCxTQUFTLEdBQUc7QUFDVixpQkFBSyxDQUFDO0FBQUEsVUFDUjtBQUFBLFFBQ0YsQ0FBQztBQUFBLE1BQ0g7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsY0FBYztBQUFBLElBQ1osU0FBUyxDQUFDLGNBQWM7QUFBQSxFQUMxQjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsdUJBQXVCO0FBQUEsSUFDdkIsZUFBZTtBQUFBLE1BQ2IsT0FBTztBQUFBLFFBQ0wsTUFBTyxRQUFRLGtDQUFXLFlBQVk7QUFBQSxRQUN0QyxPQUFPLFFBQVEsa0NBQVcsa0JBQWtCO0FBQUEsTUFDOUM7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sS0FBSztBQUFBLE1BQ0gsU0FBUztBQUFBLElBQ1g7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K

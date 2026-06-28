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
    cssCodeSplit: true,
    rollupOptions: {
      input: {
        main: resolve(__vite_injected_original_dirname, "index.html"),
        admin: resolve(__vite_injected_original_dirname, "admin/index.html")
      },
      output: {
        // Stable chunk names for long-term HTTP caching
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("react-dom") || id.includes("react/") || id.includes("scheduler")) {
            return "react-vendor";
          }
          if (id.includes("@supabase")) {
            return "supabase";
          }
          if (id.includes("lucide-react")) {
            return "icons";
          }
          return "vendor";
        }
      }
    }
  },
  server: {
    hmr: { overlay: false }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgeyByZXNvbHZlIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyByZWFkRmlsZVN5bmMgfSBmcm9tICdmcyc7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtcbiAgICByZWFjdCgpLFxuICAgIHtcbiAgICAgIG5hbWU6ICdhZG1pbi1tcGEnLFxuICAgICAgY29uZmlndXJlU2VydmVyKHNlcnZlcikge1xuICAgICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKGFzeW5jIChyZXEsIHJlcywgbmV4dCkgPT4ge1xuICAgICAgICAgIGNvbnN0IHVybCA9IHJlcS51cmwgPz8gJyc7XG4gICAgICAgICAgY29uc3QgaXNBZG1pblBhdGggPVxuICAgICAgICAgICAgdXJsID09PSAnL2FkbWluJyB8fFxuICAgICAgICAgICAgdXJsID09PSAnL2FkbWluLycgfHxcbiAgICAgICAgICAgICh1cmwuc3RhcnRzV2l0aCgnL2FkbWluLycpICYmICEvXFwuW2EtekEtWjAtOV0rJC8udGVzdCh1cmwuc3BsaXQoJz8nKVswXSkpO1xuICAgICAgICAgIGlmICghaXNBZG1pblBhdGgpIHJldHVybiBuZXh0KCk7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGxldCBodG1sID0gcmVhZEZpbGVTeW5jKHJlc29sdmUoX19kaXJuYW1lLCAnYWRtaW4vaW5kZXguaHRtbCcpLCAndXRmLTgnKTtcbiAgICAgICAgICAgIGh0bWwgPSBhd2FpdCBzZXJ2ZXIudHJhbnNmb3JtSW5kZXhIdG1sKCcvYWRtaW4vaW5kZXguaHRtbCcsIGh0bWwpO1xuICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ3RleHQvaHRtbDsgY2hhcnNldD11dGYtOCcpO1xuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSAyMDA7XG4gICAgICAgICAgICByZXMuZW5kKGh0bWwpO1xuICAgICAgICAgIH0gY2F0Y2ggKGUpIHsgbmV4dChlKTsgfVxuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgICBjb25maWd1cmVQcmV2aWV3U2VydmVyKHNlcnZlcikge1xuICAgICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKChyZXEsIHJlcywgbmV4dCkgPT4ge1xuICAgICAgICAgIGNvbnN0IHVybCA9IHJlcS51cmwgPz8gJyc7XG4gICAgICAgICAgY29uc3QgaXNBZG1pblBhdGggPVxuICAgICAgICAgICAgdXJsID09PSAnL2FkbWluJyB8fFxuICAgICAgICAgICAgdXJsID09PSAnL2FkbWluLycgfHxcbiAgICAgICAgICAgICh1cmwuc3RhcnRzV2l0aCgnL2FkbWluLycpICYmICEvXFwuW2EtekEtWjAtOV0rJC8udGVzdCh1cmwuc3BsaXQoJz8nKVswXSkpO1xuICAgICAgICAgIGlmICghaXNBZG1pblBhdGgpIHJldHVybiBuZXh0KCk7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGh0bWwgPSByZWFkRmlsZVN5bmMocmVzb2x2ZShfX2Rpcm5hbWUsICdkaXN0L2FkbWluL2luZGV4Lmh0bWwnKSwgJ3V0Zi04Jyk7XG4gICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAndGV4dC9odG1sOyBjaGFyc2V0PXV0Zi04Jyk7XG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDIwMDtcbiAgICAgICAgICAgIHJlcy5lbmQoaHRtbCk7XG4gICAgICAgICAgfSBjYXRjaCAoZSkgeyBuZXh0KGUpOyB9XG4gICAgICAgIH0pO1xuICAgICAgfSxcbiAgICB9LFxuICBdLFxuICBvcHRpbWl6ZURlcHM6IHtcbiAgICBleGNsdWRlOiBbJ2x1Y2lkZS1yZWFjdCddLFxuICB9LFxuICBidWlsZDoge1xuICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogNjAwLFxuICAgIGNzc0NvZGVTcGxpdDogdHJ1ZSxcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBpbnB1dDoge1xuICAgICAgICBtYWluOiAgcmVzb2x2ZShfX2Rpcm5hbWUsICdpbmRleC5odG1sJyksXG4gICAgICAgIGFkbWluOiByZXNvbHZlKF9fZGlybmFtZSwgJ2FkbWluL2luZGV4Lmh0bWwnKSxcbiAgICAgIH0sXG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgLy8gU3RhYmxlIGNodW5rIG5hbWVzIGZvciBsb25nLXRlcm0gSFRUUCBjYWNoaW5nXG4gICAgICAgIG1hbnVhbENodW5rcyhpZCkge1xuICAgICAgICAgIGlmICghaWQuaW5jbHVkZXMoJ25vZGVfbW9kdWxlcycpKSByZXR1cm47XG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdyZWFjdC1kb20nKSB8fCBpZC5pbmNsdWRlcygncmVhY3QvJykgfHwgaWQuaW5jbHVkZXMoJ3NjaGVkdWxlcicpKSB7XG4gICAgICAgICAgICByZXR1cm4gJ3JlYWN0LXZlbmRvcic7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnQHN1cGFiYXNlJykpIHtcbiAgICAgICAgICAgIHJldHVybiAnc3VwYWJhc2UnO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ2x1Y2lkZS1yZWFjdCcpKSB7XG4gICAgICAgICAgICByZXR1cm4gJ2ljb25zJztcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuICd2ZW5kb3InO1xuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9LFxuICB9LFxuICBzZXJ2ZXI6IHtcbiAgICBobXI6IHsgb3ZlcmxheTogZmFsc2UgfSxcbiAgfSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF5TixTQUFTLG9CQUFvQjtBQUN0UCxPQUFPLFdBQVc7QUFDbEIsU0FBUyxlQUFlO0FBQ3hCLFNBQVMsb0JBQW9CO0FBSDdCLElBQU0sbUNBQW1DO0FBS3pDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOO0FBQUEsTUFDRSxNQUFNO0FBQUEsTUFDTixnQkFBZ0IsUUFBUTtBQUN0QixlQUFPLFlBQVksSUFBSSxPQUFPLEtBQUssS0FBSyxTQUFTO0FBQy9DLGdCQUFNLE1BQU0sSUFBSSxPQUFPO0FBQ3ZCLGdCQUFNLGNBQ0osUUFBUSxZQUNSLFFBQVEsYUFDUCxJQUFJLFdBQVcsU0FBUyxLQUFLLENBQUMsa0JBQWtCLEtBQUssSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDLENBQUM7QUFDekUsY0FBSSxDQUFDLFlBQWEsUUFBTyxLQUFLO0FBQzlCLGNBQUk7QUFDRixnQkFBSSxPQUFPLGFBQWEsUUFBUSxrQ0FBVyxrQkFBa0IsR0FBRyxPQUFPO0FBQ3ZFLG1CQUFPLE1BQU0sT0FBTyxtQkFBbUIscUJBQXFCLElBQUk7QUFDaEUsZ0JBQUksVUFBVSxnQkFBZ0IsMEJBQTBCO0FBQ3hELGdCQUFJLGFBQWE7QUFDakIsZ0JBQUksSUFBSSxJQUFJO0FBQUEsVUFDZCxTQUFTLEdBQUc7QUFBRSxpQkFBSyxDQUFDO0FBQUEsVUFBRztBQUFBLFFBQ3pCLENBQUM7QUFBQSxNQUNIO0FBQUEsTUFDQSx1QkFBdUIsUUFBUTtBQUM3QixlQUFPLFlBQVksSUFBSSxDQUFDLEtBQUssS0FBSyxTQUFTO0FBQ3pDLGdCQUFNLE1BQU0sSUFBSSxPQUFPO0FBQ3ZCLGdCQUFNLGNBQ0osUUFBUSxZQUNSLFFBQVEsYUFDUCxJQUFJLFdBQVcsU0FBUyxLQUFLLENBQUMsa0JBQWtCLEtBQUssSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDLENBQUM7QUFDekUsY0FBSSxDQUFDLFlBQWEsUUFBTyxLQUFLO0FBQzlCLGNBQUk7QUFDRixrQkFBTSxPQUFPLGFBQWEsUUFBUSxrQ0FBVyx1QkFBdUIsR0FBRyxPQUFPO0FBQzlFLGdCQUFJLFVBQVUsZ0JBQWdCLDBCQUEwQjtBQUN4RCxnQkFBSSxhQUFhO0FBQ2pCLGdCQUFJLElBQUksSUFBSTtBQUFBLFVBQ2QsU0FBUyxHQUFHO0FBQUUsaUJBQUssQ0FBQztBQUFBLFVBQUc7QUFBQSxRQUN6QixDQUFDO0FBQUEsTUFDSDtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxjQUFjO0FBQUEsSUFDWixTQUFTLENBQUMsY0FBYztBQUFBLEVBQzFCO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCx1QkFBdUI7QUFBQSxJQUN2QixjQUFjO0FBQUEsSUFDZCxlQUFlO0FBQUEsTUFDYixPQUFPO0FBQUEsUUFDTCxNQUFPLFFBQVEsa0NBQVcsWUFBWTtBQUFBLFFBQ3RDLE9BQU8sUUFBUSxrQ0FBVyxrQkFBa0I7QUFBQSxNQUM5QztBQUFBLE1BQ0EsUUFBUTtBQUFBO0FBQUEsUUFFTixhQUFhLElBQUk7QUFDZixjQUFJLENBQUMsR0FBRyxTQUFTLGNBQWMsRUFBRztBQUNsQyxjQUFJLEdBQUcsU0FBUyxXQUFXLEtBQUssR0FBRyxTQUFTLFFBQVEsS0FBSyxHQUFHLFNBQVMsV0FBVyxHQUFHO0FBQ2pGLG1CQUFPO0FBQUEsVUFDVDtBQUNBLGNBQUksR0FBRyxTQUFTLFdBQVcsR0FBRztBQUM1QixtQkFBTztBQUFBLFVBQ1Q7QUFDQSxjQUFJLEdBQUcsU0FBUyxjQUFjLEdBQUc7QUFDL0IsbUJBQU87QUFBQSxVQUNUO0FBQ0EsaUJBQU87QUFBQSxRQUNUO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixLQUFLLEVBQUUsU0FBUyxNQUFNO0FBQUEsRUFDeEI7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=

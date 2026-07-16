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
          if (url === "/admin" || url === "/admin?") {
            res.statusCode = 301;
            res.setHeader("Location", "/admin/");
            return res.end();
          }
          const isAdminPath = url === "/admin/" || url.startsWith("/admin/") && !/\.[a-zA-Z0-9]+$/.test(url.split("?")[0]);
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgeyByZXNvbHZlIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyByZWFkRmlsZVN5bmMgfSBmcm9tICdmcyc7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtcbiAgICByZWFjdCgpLFxuICAgIHtcbiAgICAgIG5hbWU6ICdhZG1pbi1tcGEnLFxuICAgICAgY29uZmlndXJlU2VydmVyKHNlcnZlcikge1xuICAgICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKGFzeW5jIChyZXEsIHJlcywgbmV4dCkgPT4ge1xuICAgICAgICAgIGNvbnN0IHVybCA9IHJlcS51cmwgPz8gJyc7XG4gICAgICAgICAgLy8gUmVkaXJlY3QgL2FkbWluIFx1MjE5MiAvYWRtaW4vIHNvIHJlbGF0aXZlIHBhdGhzIGluIGFkbWluL2luZGV4Lmh0bWxcbiAgICAgICAgICAvLyByZXNvbHZlIHVuZGVyIC9hZG1pbi8gaW5zdGVhZCBvZiAvICh3aGljaCB3b3VsZCBsb2FkIHRoZSBjdXN0b21lciBhcHApLlxuICAgICAgICAgIGlmICh1cmwgPT09ICcvYWRtaW4nIHx8IHVybCA9PT0gJy9hZG1pbj8nKSB7XG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDMwMTtcbiAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0xvY2F0aW9uJywgJy9hZG1pbi8nKTtcbiAgICAgICAgICAgIHJldHVybiByZXMuZW5kKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IGlzQWRtaW5QYXRoID1cbiAgICAgICAgICAgIHVybCA9PT0gJy9hZG1pbi8nIHx8XG4gICAgICAgICAgICAodXJsLnN0YXJ0c1dpdGgoJy9hZG1pbi8nKSAmJiAhL1xcLlthLXpBLVowLTldKyQvLnRlc3QodXJsLnNwbGl0KCc/JylbMF0pKTtcbiAgICAgICAgICBpZiAoIWlzQWRtaW5QYXRoKSByZXR1cm4gbmV4dCgpO1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsZXQgaHRtbCA9IHJlYWRGaWxlU3luYyhyZXNvbHZlKF9fZGlybmFtZSwgJ2FkbWluL2luZGV4Lmh0bWwnKSwgJ3V0Zi04Jyk7XG4gICAgICAgICAgICBodG1sID0gYXdhaXQgc2VydmVyLnRyYW5zZm9ybUluZGV4SHRtbCgnL2FkbWluL2luZGV4Lmh0bWwnLCBodG1sKTtcbiAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICd0ZXh0L2h0bWw7IGNoYXJzZXQ9dXRmLTgnKTtcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gMjAwO1xuICAgICAgICAgICAgcmVzLmVuZChodG1sKTtcbiAgICAgICAgICB9IGNhdGNoIChlKSB7IG5leHQoZSk7IH1cbiAgICAgICAgfSk7XG4gICAgICB9LFxuICAgICAgY29uZmlndXJlUHJldmlld1NlcnZlcihzZXJ2ZXIpIHtcbiAgICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZSgocmVxLCByZXMsIG5leHQpID0+IHtcbiAgICAgICAgICBjb25zdCB1cmwgPSByZXEudXJsID8/ICcnO1xuICAgICAgICAgIGNvbnN0IGlzQWRtaW5QYXRoID1cbiAgICAgICAgICAgIHVybCA9PT0gJy9hZG1pbicgfHxcbiAgICAgICAgICAgIHVybCA9PT0gJy9hZG1pbi8nIHx8XG4gICAgICAgICAgICAodXJsLnN0YXJ0c1dpdGgoJy9hZG1pbi8nKSAmJiAhL1xcLlthLXpBLVowLTldKyQvLnRlc3QodXJsLnNwbGl0KCc/JylbMF0pKTtcbiAgICAgICAgICBpZiAoIWlzQWRtaW5QYXRoKSByZXR1cm4gbmV4dCgpO1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBodG1sID0gcmVhZEZpbGVTeW5jKHJlc29sdmUoX19kaXJuYW1lLCAnZGlzdC9hZG1pbi9pbmRleC5odG1sJyksICd1dGYtOCcpO1xuICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ3RleHQvaHRtbDsgY2hhcnNldD11dGYtOCcpO1xuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSAyMDA7XG4gICAgICAgICAgICByZXMuZW5kKGh0bWwpO1xuICAgICAgICAgIH0gY2F0Y2ggKGUpIHsgbmV4dChlKTsgfVxuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgfSxcbiAgXSxcbiAgb3B0aW1pemVEZXBzOiB7XG4gICAgZXhjbHVkZTogWydsdWNpZGUtcmVhY3QnXSxcbiAgfSxcbiAgYnVpbGQ6IHtcbiAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDYwMCxcbiAgICBjc3NDb2RlU3BsaXQ6IHRydWUsXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgaW5wdXQ6IHtcbiAgICAgICAgbWFpbjogIHJlc29sdmUoX19kaXJuYW1lLCAnaW5kZXguaHRtbCcpLFxuICAgICAgICBhZG1pbjogcmVzb2x2ZShfX2Rpcm5hbWUsICdhZG1pbi9pbmRleC5odG1sJyksXG4gICAgICB9LFxuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIC8vIFN0YWJsZSBjaHVuayBuYW1lcyBmb3IgbG9uZy10ZXJtIEhUVFAgY2FjaGluZ1xuICAgICAgICBtYW51YWxDaHVua3MoaWQpIHtcbiAgICAgICAgICBpZiAoIWlkLmluY2x1ZGVzKCdub2RlX21vZHVsZXMnKSkgcmV0dXJuO1xuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygncmVhY3QtZG9tJykgfHwgaWQuaW5jbHVkZXMoJ3JlYWN0LycpIHx8IGlkLmluY2x1ZGVzKCdzY2hlZHVsZXInKSkge1xuICAgICAgICAgICAgcmV0dXJuICdyZWFjdC12ZW5kb3InO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ0BzdXBhYmFzZScpKSB7XG4gICAgICAgICAgICByZXR1cm4gJ3N1cGFiYXNlJztcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdsdWNpZGUtcmVhY3QnKSkge1xuICAgICAgICAgICAgcmV0dXJuICdpY29ucyc7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiAndmVuZG9yJztcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbiAgc2VydmVyOiB7XG4gICAgaG1yOiB7IG92ZXJsYXk6IGZhbHNlIH0sXG4gIH0sXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBeU4sU0FBUyxvQkFBb0I7QUFDdFAsT0FBTyxXQUFXO0FBQ2xCLFNBQVMsZUFBZTtBQUN4QixTQUFTLG9CQUFvQjtBQUg3QixJQUFNLG1DQUFtQztBQUt6QyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTjtBQUFBLE1BQ0UsTUFBTTtBQUFBLE1BQ04sZ0JBQWdCLFFBQVE7QUFDdEIsZUFBTyxZQUFZLElBQUksT0FBTyxLQUFLLEtBQUssU0FBUztBQUMvQyxnQkFBTSxNQUFNLElBQUksT0FBTztBQUd2QixjQUFJLFFBQVEsWUFBWSxRQUFRLFdBQVc7QUFDekMsZ0JBQUksYUFBYTtBQUNqQixnQkFBSSxVQUFVLFlBQVksU0FBUztBQUNuQyxtQkFBTyxJQUFJLElBQUk7QUFBQSxVQUNqQjtBQUNBLGdCQUFNLGNBQ0osUUFBUSxhQUNQLElBQUksV0FBVyxTQUFTLEtBQUssQ0FBQyxrQkFBa0IsS0FBSyxJQUFJLE1BQU0sR0FBRyxFQUFFLENBQUMsQ0FBQztBQUN6RSxjQUFJLENBQUMsWUFBYSxRQUFPLEtBQUs7QUFDOUIsY0FBSTtBQUNGLGdCQUFJLE9BQU8sYUFBYSxRQUFRLGtDQUFXLGtCQUFrQixHQUFHLE9BQU87QUFDdkUsbUJBQU8sTUFBTSxPQUFPLG1CQUFtQixxQkFBcUIsSUFBSTtBQUNoRSxnQkFBSSxVQUFVLGdCQUFnQiwwQkFBMEI7QUFDeEQsZ0JBQUksYUFBYTtBQUNqQixnQkFBSSxJQUFJLElBQUk7QUFBQSxVQUNkLFNBQVMsR0FBRztBQUFFLGlCQUFLLENBQUM7QUFBQSxVQUFHO0FBQUEsUUFDekIsQ0FBQztBQUFBLE1BQ0g7QUFBQSxNQUNBLHVCQUF1QixRQUFRO0FBQzdCLGVBQU8sWUFBWSxJQUFJLENBQUMsS0FBSyxLQUFLLFNBQVM7QUFDekMsZ0JBQU0sTUFBTSxJQUFJLE9BQU87QUFDdkIsZ0JBQU0sY0FDSixRQUFRLFlBQ1IsUUFBUSxhQUNQLElBQUksV0FBVyxTQUFTLEtBQUssQ0FBQyxrQkFBa0IsS0FBSyxJQUFJLE1BQU0sR0FBRyxFQUFFLENBQUMsQ0FBQztBQUN6RSxjQUFJLENBQUMsWUFBYSxRQUFPLEtBQUs7QUFDOUIsY0FBSTtBQUNGLGtCQUFNLE9BQU8sYUFBYSxRQUFRLGtDQUFXLHVCQUF1QixHQUFHLE9BQU87QUFDOUUsZ0JBQUksVUFBVSxnQkFBZ0IsMEJBQTBCO0FBQ3hELGdCQUFJLGFBQWE7QUFDakIsZ0JBQUksSUFBSSxJQUFJO0FBQUEsVUFDZCxTQUFTLEdBQUc7QUFBRSxpQkFBSyxDQUFDO0FBQUEsVUFBRztBQUFBLFFBQ3pCLENBQUM7QUFBQSxNQUNIO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLGNBQWM7QUFBQSxJQUNaLFNBQVMsQ0FBQyxjQUFjO0FBQUEsRUFDMUI7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLHVCQUF1QjtBQUFBLElBQ3ZCLGNBQWM7QUFBQSxJQUNkLGVBQWU7QUFBQSxNQUNiLE9BQU87QUFBQSxRQUNMLE1BQU8sUUFBUSxrQ0FBVyxZQUFZO0FBQUEsUUFDdEMsT0FBTyxRQUFRLGtDQUFXLGtCQUFrQjtBQUFBLE1BQzlDO0FBQUEsTUFDQSxRQUFRO0FBQUE7QUFBQSxRQUVOLGFBQWEsSUFBSTtBQUNmLGNBQUksQ0FBQyxHQUFHLFNBQVMsY0FBYyxFQUFHO0FBQ2xDLGNBQUksR0FBRyxTQUFTLFdBQVcsS0FBSyxHQUFHLFNBQVMsUUFBUSxLQUFLLEdBQUcsU0FBUyxXQUFXLEdBQUc7QUFDakYsbUJBQU87QUFBQSxVQUNUO0FBQ0EsY0FBSSxHQUFHLFNBQVMsV0FBVyxHQUFHO0FBQzVCLG1CQUFPO0FBQUEsVUFDVDtBQUNBLGNBQUksR0FBRyxTQUFTLGNBQWMsR0FBRztBQUMvQixtQkFBTztBQUFBLFVBQ1Q7QUFDQSxpQkFBTztBQUFBLFFBQ1Q7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLEtBQUssRUFBRSxTQUFTLE1BQU07QUFBQSxFQUN4QjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==

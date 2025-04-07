import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "../shared"),
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    host: true,
    hmr: {
      clientPort: 443,
    },
    // Allow connections from any host (including Replit domains)
    cors: true,
    // Allow all hosts to connect to dev server
    strictPort: false,
    // Allow any hostname to access the dev server
    allowedHosts: true,
  },
});

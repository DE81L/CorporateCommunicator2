import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// Check if theme.json exists
let themePlugins = [react()];
try {
  if (fs.existsSync(path.resolve(__dirname, '../theme.json'))) {
    const shadcnThemePlugin = require('@replit/vite-plugin-shadcn-theme-json').default;
    const themeConfig = require('../theme.json');
    themePlugins.push(shadcnThemePlugin(themeConfig));
  }
} catch (error) {
  console.warn('Theme plugin not loaded:', error.message);
}

// Web-only Vite config for Replit environment
export default defineConfig({
  plugins: themePlugins,
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    hmr: {
      clientPort: 5173
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@assets': path.resolve(__dirname, '../attached_assets'),
      '@shared': path.resolve(__dirname, '../shared'),
    }
  },
  define: {
    'process.env.ELECTRON': JSON.stringify(false),
    'import.meta.env.VITE_WEB_ONLY': JSON.stringify('true'),
    'import.meta.env.VITE_REPLIT': JSON.stringify('true'),
  }
});
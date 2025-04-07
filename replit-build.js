import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Simple logging function
const log = (message, source = 'build') => {
  console.log(`[${source}] ${message}`);
};

// Set environment variables for web-only mode
process.env.VITE_WEB_ONLY = 'true';
process.env.VITE_REPLIT = 'true';
process.env.ELECTRON = 'false';

// Ensure vite.config.noelectron.ts exists in client folder
const VITE_CONFIG_PATH = join(__dirname, 'client', 'vite.config.noelectron.ts');
if (!fs.existsSync(VITE_CONFIG_PATH)) {
  log('Creating web-compatible Vite config...', 'build');
  
  const configContent = `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
`;
  
  fs.writeFileSync(VITE_CONFIG_PATH, configContent);
  log('Web-compatible Vite config created successfully', 'build');
}

// Build client
log('Building client application...', 'build');
const buildProcess = spawn('npx', ['vite', 'build', '--config', VITE_CONFIG_PATH], {
  cwd: join(__dirname, 'client'),
  stdio: 'inherit',
  env: { ...process.env }
});

buildProcess.on('exit', (code) => {
  if (code === 0) {
    log('Client application built successfully!', 'build');
  } else {
    log(`Build process exited with code ${code}`, 'build');
    process.exit(code || 1);
  }
});
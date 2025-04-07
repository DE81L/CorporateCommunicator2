/**
 * Replit Development Integration Script
 * 
 * This script integrates the application with Replit's development and deployment environment.
 * It creates and customizes necessary configurations for running the application in Replit.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Set web-only environment variables
process.env.VITE_WEB_ONLY = 'true';
process.env.VITE_REPLIT = 'true';
process.env.ELECTRON = 'false';

// Create web-compatible Vite config if it doesn't exist
function createViteConfig() {
  const configPath = path.join(__dirname, 'client', 'vite.config.noelectron.ts');
  if (fs.existsSync(configPath)) {
    console.log('Web-compatible Vite config already exists.');
    return;
  }

  console.log('Creating web-compatible Vite config...');
  
  const configContent = `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import shadcnThemePlugin from '@replit/vite-plugin-shadcn-theme-json';
import themeConfig from '../theme.json';

// Web-only Vite config for Replit environment
export default defineConfig({
  plugins: [
    react(),
    shadcnThemePlugin(themeConfig)
  ],
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      clientPort: 5173
    },
    proxy: {
      '/api': 'http://localhost:3000'
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
  
  fs.writeFileSync(configPath, configContent);
  console.log('Web-compatible Vite config created successfully');
}

// Create or update Replit start script
function createReplitStartScript() {
  const scriptPath = path.join(__dirname, 'replit_start.sh');
  const scriptContent = `#!/bin/bash
# Replit start script
# Executes the web-friendly entry point for the application

echo "Starting application in Replit environment..."
node replit-web-entry.js
`;

  fs.writeFileSync(scriptPath, scriptContent);
  // Make executable
  fs.chmodSync(scriptPath, '755');
  console.log('Replit start script created/updated successfully');
}

// Main initialization function
function initializeReplitEnvironment() {
  console.log('Initializing Replit environment...');
  
  createViteConfig();
  createReplitStartScript();
  
  console.log('Replit environment initialization complete!');
  console.log('You can now run the application using one of these methods:');
  console.log('1. Use the "Start application" workflow (Recommended)');
  console.log('2. Run ./replit_start.sh');
  console.log('3. Run node replit-web-entry.js');
}

// Execute initialization
initializeReplitEnvironment();
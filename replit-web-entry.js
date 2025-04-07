/**
 * Replit Web Entry Point
 * 
 * This script serves as the entry point for running the application in Replit without Electron.
 * It starts both the Express server and Vite development server with appropriate configurations.
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Log startup
console.log('Starting web application in Replit environment...');

// Start the Express server
console.log('Starting Express server...');
const serverProcess = spawn('tsx', ['server/index.ts'], { 
  stdio: 'inherit'
});

// After the server starts, start the Vite development server
setTimeout(() => {
  console.log('Starting Vite development server...');
  
  const viteProcess = spawn('cd', ['client', '&&', 'cross-env', 'NODE_ENV=development', 'vite'], {
    stdio: 'inherit',
    shell: true
  });
  
  viteProcess.on('error', (err) => {
    console.error('Failed to start Vite:', err);
  });
}, 3000);

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down application...');
  serverProcess.kill();
  process.exit(0);
});
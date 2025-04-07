/**
 * This is a specialized script for Replit that starts both the simple server on port 5000
 * and the main application. This helps satisfy Replit's workflow requirements.
 */

console.log('Starting combined server for Replit environment...');

// Start the simple server on port 5000 first
require('./replit-simple-server.cjs');

// Give it a moment to start
setTimeout(() => {
  console.log('Now starting the main Express server...');
  
  // Then start the main server with tsx
  const { spawn } = require('child_process');
  const server = spawn('tsx', ['server/index.ts'], {
    stdio: 'inherit',
    env: { ...process.env }
  });
}, 2000);
/**
 * Replit Entry Point (CommonJS format)
 * This script selects the appropriate startup method based on the Replit environment
 */

console.log('Starting Replit entry point...');
const { spawn } = require('child_process');
const path = require('path');

// Run the simple server on port 5000 to satisfy Replit workflow requirements
console.log('Starting simple server for Replit workflow on port 5000...');
const simpleServer = spawn('node', ['simple-server.js'], { 
  stdio: 'inherit',
  detached: true 
});
simpleServer.unref();

// After a short delay, start the actual application
setTimeout(() => {
  console.log('Starting main application...');
  const app = spawn('node', ['replit-web-entry.js'], { 
    stdio: 'inherit'
  });
  
  app.on('error', (err) => {
    console.error('Failed to start application:', err);
  });
}, 2000);
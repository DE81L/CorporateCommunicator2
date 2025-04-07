/**
 * Replit Entry Script
 * 
 * This script starts the simple server and then runs the main application.
 * It's designed to satisfy Replit's requirement for a port to be opened within 20 seconds.
 */

const { spawn } = require('child_process');

console.log('Starting simple server on port 5000...');
const simpleServer = spawn('node', ['replit-simple-server.cjs'], { 
  stdio: 'inherit',
  detached: true 
});

// Make the server process independent of this script
simpleServer.unref();

// Give the simple server time to start up
setTimeout(() => {
  console.log('Starting main application...');
  
  // Start the main application with the appropriate command
  const mainApp = spawn('npm', ['run', 'dev'], { 
    stdio: 'inherit',
    env: { ...process.env, ELECTRON: 'false' }
  });
  
  mainApp.on('error', (err) => {
    console.error('Failed to start main application:', err);
    process.exit(1);
  });
  
  // Handle cleanup on exit
  process.on('SIGINT', () => {
    console.log('Shutting down...');
    mainApp.kill();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('Shutting down...');
    mainApp.kill();
    process.exit(0);
  });
}, 2000); // Wait 2 seconds
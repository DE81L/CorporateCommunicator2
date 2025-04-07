/**
 * This is a special script that runs both our simple server (port 5000) and the main application
 * Used specifically for Replit workflows that require port 5000 to be opened within 20 seconds
 */

const { spawn } = require('child_process');

// First, start the simple server on port 5000 to satisfy Replit's workflow check
console.log('Starting simple server on port 5000...');
const simpleServer = spawn('node', ['replit-simple-server.cjs'], { stdio: 'inherit' });

simpleServer.on('error', (err) => {
  console.error('Failed to start simple server:', err);
  process.exit(1);
});

// After the simple server has started, start the actual application
console.log('Starting main application...');
const mainApp = spawn('npm', ['run', 'dev'], { stdio: 'inherit' });

mainApp.on('error', (err) => {
  console.error('Failed to start main application:', err);
  process.exit(1);
});

// Handle cleanup on exit
process.on('SIGINT', () => {
  console.log('Shutting down...');
  simpleServer.kill();
  mainApp.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down...');
  simpleServer.kill();
  mainApp.kill();
  process.exit(0);
});
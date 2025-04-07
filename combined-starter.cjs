/**
 * This is a specialized script for Replit that starts both the simple server on port 5000
 * and the main application. This helps satisfy Replit's workflow requirements.
 */

const { spawn } = require('child_process');

console.log('Starting combined server setup for Replit...');

// Start the simple server
const simpleServer = spawn('node', ['simple-server.cjs'], { stdio: 'inherit' });

simpleServer.on('error', (err) => {
  console.error('Failed to start simple server:', err);
});

console.log('Simple server started on port 5000');

// Wait a moment to ensure the simple server is running
setTimeout(() => {
  // Start the main server
  console.log('Starting main application...');
  const mainServer = spawn('node', ['server/index.cjs'], { stdio: 'inherit' });

  mainServer.on('error', (err) => {
    console.error('Failed to start main server:', err);
  });

  // Handle cleanup
  process.on('SIGINT', () => {
    console.log('Shutting down all servers...');
    simpleServer.kill();
    mainServer.kill();
    process.exit(0);
  });
}, 2000);

console.log('Servers initialized. Check logs for details.');
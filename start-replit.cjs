/**
 * This is a special script that runs both our simple server (port 5000) and the main application
 * Used specifically for Replit workflows that require port 5000 to be opened within 20 seconds
 */

console.log("Starting the Replit workflow server setup");

// Spawn a child process to run the simple server that listens on port 5000
const { spawn } = require('child_process');
const path = require('path');

// Start the simple server
const simpleServer = spawn('node', ['replit-simple-server.cjs'], {
  stdio: 'inherit',
  env: { ...process.env, START_MAIN_APP: 'true' }
});

// Log any errors
simpleServer.on('error', (err) => {
  console.error('Failed to start simple server:', err);
  process.exit(1);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Terminating all processes...');
  simpleServer.kill();
  process.exit(0);
});
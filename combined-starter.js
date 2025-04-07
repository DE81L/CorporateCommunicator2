/**
 * This is a specialized script for Replit that starts both the simple server on port 5000
 * and the main application. This helps satisfy Replit's workflow requirements.
 */

const express = require('express');
const { spawn } = require('child_process');

// Create and start simple server on port 5000
const app = express();
const PORT = 5000;

app.get('/', (req, res) => {
  res.send('Simple server running on port 5000. The main application is running on port 3000.');
});

// Start the simple server on port 5000
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Simple server running on port ${PORT}`);

  // After the simple server has started successfully, start the main application
  console.log('Starting main application...');
  const mainApp = spawn('npm', ['run', 'dev:web'], { stdio: 'inherit' });

  mainApp.on('error', (err) => {
    console.error('Failed to start main application:', err);
    process.exit(1);
  });

  // Handle cleanup on exit
  process.on('SIGINT', () => {
    console.log('Shutting down...');
    mainApp.kill();
    server.close();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('Shutting down...');
    mainApp.kill();
    server.close();
    process.exit(0);
  });
});

server.on('error', (err) => {
  console.error('Failed to start simple server:', err);
  process.exit(1);
});
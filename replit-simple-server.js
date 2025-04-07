/**
 * Ultra-minimal Express server for Replit workflows
 * Opens port 5000 immediately and can optionally start the main app
 */

const express = require('express');
const app = express();
const PORT = 5000;

// Minimal route handler
app.get('/', (req, res) => {
  res.send('Replit simple server running');
});

// Start server immediately on port 5000
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Replit simple server running on port ${PORT}`);
  
  // If the START_MAIN_APP environment variable is set, start the main app
  if (process.env.START_MAIN_APP) {
    try {
      const { spawn } = require('child_process');
      console.log('Starting main application...');
      const mainApp = spawn('npm', ['run', 'dev'], { 
        stdio: 'inherit',
        detached: true
      });
      mainApp.unref(); // Allow this process to exit independently of the child
    } catch (err) {
      console.error('Failed to start main application:', err);
    }
  }
});

// Handle termination properly
process.on('SIGINT', () => {
  server.close(() => {
    console.log('Replit simple server shutting down');
    process.exit(0);
  });
});
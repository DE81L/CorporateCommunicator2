/**
 * Replit Entry Point
 * 
 * This script serves as the main entry point for the Replit workflow.
 * It first starts a simple Express server on port 5000 to satisfy Replit's port checking,
 * then starts the main application with npm run dev.
 */

console.log("Starting Replit entry point...");

// Import required modules
const express = require('express');
const { spawn } = require('child_process');

// Create a simple Express server
const app = express();
const PORT = 5000;

// Add basic route
app.get('/', (req, res) => {
  res.send('Replit server running on port 5000');
});

// Start the simple server immediately
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Replit simple server running on port ${PORT}`);
  
  // Start the main application after the simple server is running
  setTimeout(() => {
    console.log('Starting main application...');
    const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    // Use the original concurrently command directly
    const mainApp = spawn('concurrently', [
      "tsx server/index.ts",
      "cd client && cross-env ELECTRON=true NODE_ENV=development vite",
      "wait-on http://localhost:5173 && electron electron/main.cjs --no-sandbox"
    ], { 
      stdio: 'inherit',
      env: { ...process.env, REPLIT_WORKFLOW: 'true' },
      shell: true
    });

    mainApp.on('error', (error) => {
      console.error('Failed to start main application:', error);
    });
  }, 500);
});

// Handle termination 
process.on('SIGINT', () => {
  console.log('Shutting down Replit server...');
  server.close(() => {
    process.exit(0);
  });
});
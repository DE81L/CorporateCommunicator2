/**
 * Replit Startup Script
 * 
 * This script is specifically designed to start the application in Replit environment.
 * It first starts a simple Express server on port 5000 to satisfy Replit's port checking,
 * then starts the actual application server.
 */

const { spawn } = require('child_process');
const express = require('express');

function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${timestamp} [${type}] ${message}`);
}

function startSimpleServer() {
  log('Starting simple server on port 5000...', 'setup');
  
  const app = express();
  app.get('/', (req, res) => {
    res.send('Simple server running on port 5000');
  });
  
  return new Promise((resolve) => {
    const server = app.listen(5000, '0.0.0.0', () => {
      log('Simple server is now running', 'setup');
      resolve(server);
    });
  });
}

function startMainApplication() {
  log('Starting main application...', 'setup');
  
  // Set environment variables to skip Electron
  const env = {
    ...process.env,
    REPLIT: 'true',
    SKIP_ELECTRON: 'true'
  };
  
  // Run the server and Vite, but skip Electron
  const mainApp = spawn('concurrently', [
    'tsx server/index.ts',
    'cd client && cross-env NODE_ENV=development vite'
  ], {
    stdio: 'inherit',
    env,
    shell: true
  });
  
  mainApp.on('error', (error) => {
    log(`Failed to start main application: ${error.message}`, 'error');
  });
  
  return mainApp;
}

async function main() {
  try {
    // First start the simple server on port 5000
    const simpleServer = await startSimpleServer();
    
    // Then start the main application
    const mainApp = startMainApplication();
    
    // Handle termination
    process.on('SIGINT', () => {
      log('Shutting down servers...', 'shutdown');
      simpleServer.close();
      if (mainApp && !mainApp.killed) {
        mainApp.kill();
      }
      process.exit(0);
    });
  } catch (error) {
    log(`Error during startup: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Run the main function
main();
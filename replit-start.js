/**
 * Replit Startup Script
 * 
 * This script is specifically designed to start the application in Replit environment.
 * It first starts a simple Express server on port 5000 to satisfy Replit's port checking,
 * then starts the actual application server.
 */

const childProcess = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const SIMPLE_SERVER_PORT = 5000;
const MAIN_SERVER_PORT = 3000;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Logging utility
function log(message, type = 'info') {
  const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
  let prefix = '';
  
  switch (type) {
    case 'info':
      prefix = `${colors.blue}[INFO]${colors.reset}`;
      break;
    case 'success':
      prefix = `${colors.green}[SUCCESS]${colors.reset}`;
      break;
    case 'error':
      prefix = `${colors.red}[ERROR]${colors.reset}`;
      break;
    case 'warning':
      prefix = `${colors.yellow}[WARNING]${colors.reset}`;
      break;
    default:
      prefix = `[${type.toUpperCase()}]`;
  }
  
  console.log(`${prefix} ${timestamp} - ${message}`);
}

// Start the simple server
function startSimpleServer() {
  log('Starting simple server on port 5000...', 'info');
  
  const simpleServer = childProcess.spawn('node', ['simple-server.cjs'], {
    env: { ...process.env, PORT: SIMPLE_SERVER_PORT.toString() },
    stdio: 'pipe',
  });
  
  simpleServer.stdout.on('data', (data) => {
    console.log(`${colors.dim}[simple-server]${colors.reset} ${data.toString().trim()}`);
  });
  
  simpleServer.stderr.on('data', (data) => {
    console.error(`${colors.red}[simple-server]${colors.reset} ${data.toString().trim()}`);
  });
  
  simpleServer.on('close', (code) => {
    log(`Simple server exited with code ${code}`, code === 0 ? 'info' : 'error');
  });
  
  return simpleServer;
}

// Start the main application
function startMainApplication() {
  log('Starting main application...', 'info');
  
  // Set environment variables for main application
  const env = {
    ...process.env,
    PORT: MAIN_SERVER_PORT.toString(),
    ELECTRON: 'false',
    NODE_ENV: process.env.NODE_ENV || 'development',
  };
  
  // Start TypeScript server
  const serverProcess = childProcess.spawn('tsx', ['server/index.ts'], {
    env,
    stdio: 'pipe',
  });
  
  serverProcess.stdout.on('data', (data) => {
    console.log(`${colors.cyan}[server]${colors.reset} ${data.toString().trim()}`);
  });
  
  serverProcess.stderr.on('data', (data) => {
    console.error(`${colors.red}[server]${colors.reset} ${data.toString().trim()}`);
  });
  
  serverProcess.on('close', (code) => {
    log(`Server exited with code ${code}`, code === 0 ? 'info' : 'error');
  });
  
  // Start Vite dev server for client
  const clientProcess = childProcess.spawn('cd', ['client', '&&', 'cross-env', 'ELECTRON=false', 'NODE_ENV=development', 'vite'], {
    env,
    stdio: 'pipe',
    shell: true,
  });
  
  clientProcess.stdout.on('data', (data) => {
    console.log(`${colors.magenta}[client]${colors.reset} ${data.toString().trim()}`);
  });
  
  clientProcess.stderr.on('data', (data) => {
    console.error(`${colors.red}[client]${colors.reset} ${data.toString().trim()}`);
  });
  
  clientProcess.on('close', (code) => {
    log(`Client process exited with code ${code}`, code === 0 ? 'info' : 'error');
  });
  
  return { serverProcess, clientProcess };
}

// Main function
function main() {
  log('Starting application in Replit environment', 'info');
  
  // Start the simple server first
  const simpleServer = startSimpleServer();
  
  // Wait for simple server to start before starting main application
  setTimeout(() => {
    const mainProcesses = startMainApplication();
    
    // Handle shutdown
    process.on('SIGINT', () => {
      log('Shutting down all processes...', 'warning');
      simpleServer.kill();
      mainProcesses.serverProcess.kill();
      mainProcesses.clientProcess.kill();
      process.exit(0);
    });
  }, 2000); // Give the simple server 2 seconds to start
}

// Run the main function
main();
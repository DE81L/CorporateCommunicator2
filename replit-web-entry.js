/**
 * Replit Web Entry Point
 * 
 * This script serves as the entry point for running the application in Replit without Electron.
 * It starts both the Express server and Vite development server with appropriate configurations.
 */

import { spawn, exec } from 'child_process';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a simple express server to satisfy Replit's port 5000 requirement
const app = express();
const PORT = 5000;

// Configure the simple server
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Corporate Messaging App</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
          .container { max-width: 800px; margin: 0 auto; padding: 20px; }
          .btn { display: inline-block; background: #0066ff; color: white; padding: 10px 20px; 
                text-decoration: none; border-radius: 4px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Corporate Messaging Application</h1>
          <p>The application is running on port 3000.</p>
          <a class="btn" href="https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co" target="_blank">
            Open Main Application
          </a>
        </div>
      </body>
    </html>
  `);
});

// Start the simple server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Simple server listening on port ${PORT}`);
  
  // Launch the main application in a separate process
  console.log('Starting the main application...');
  
  // Get the commands to run from the package.json file
  const packageJsonPath = path.join(__dirname, 'package.json');
  fs.readFile(packageJsonPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading package.json:', err);
      return;
    }
    
    try {
      const packageJson = JSON.parse(data);
      
      // Start the Node.js server
      const serverProcess = spawn('tsx', ['server/index.ts'], { stdio: 'inherit' });
      
      // Start the Vite development server with ELECTRON=false
      const viteProcess = spawn('cd', ['client', '&&', 'cross-env', 'ELECTRON=false', 'NODE_ENV=development', 'vite'], 
        { shell: true, stdio: 'inherit' });
      
      // Handle cleanup on termination
      process.on('SIGINT', () => {
        console.log('Shutting down...');
        serverProcess.kill();
        viteProcess.kill();
        server.close();
        process.exit(0);
      });
      
      process.on('SIGTERM', () => {
        console.log('Shutting down...');
        serverProcess.kill();
        viteProcess.kill();
        server.close();
        process.exit(0);
      });
      
      // Handle process errors
      serverProcess.on('error', (err) => {
        console.error('Server process error:', err);
      });
      
      viteProcess.on('error', (err) => {
        console.error('Vite process error:', err);
      });
      
    } catch (err) {
      console.error('Error parsing package.json:', err);
    }
  });
});

server.on('error', (err) => {
  console.error('Server error:', err);
});
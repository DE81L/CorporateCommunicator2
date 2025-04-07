import { spawn } from 'child_process';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('🚀 Starting application without Electron...');

// Start the server
const serverProcess = spawn('tsx', ['server/index.ts'], {
  stdio: 'pipe',
  shell: true
});

serverProcess.stdout.on('data', (data) => {
  console.log(`[SERVER] ${data.toString().trim()}`);
});

serverProcess.stderr.on('data', (data) => {
  console.error(`[SERVER ERROR] ${data.toString().trim()}`);
});

// Start the client Vite server with modified config for non-Electron
const clientProcess = spawn('cd client && cross-env ELECTRON=false NODE_ENV=development vite --config vite.config.noelectron.ts --host 0.0.0.0', [], {
  stdio: 'pipe',
  shell: true
});

clientProcess.stdout.on('data', (data) => {
  console.log(`[CLIENT] ${data.toString().trim()}`);
});

clientProcess.stderr.on('data', (data) => {
  console.error(`[CLIENT ERROR] ${data.toString().trim()}`);
});

// Handle process errors
serverProcess.on('error', (error) => {
  console.error(`Server process error: ${error.message}`);
});

clientProcess.on('error', (error) => {
  console.error(`Client process error: ${error.message}`);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down processes...');
  serverProcess.kill();
  clientProcess.kill();
  process.exit(0);
});

// Keep the main process running
process.stdin.resume();
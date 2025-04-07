/**
 * Ultra-minimal server for Replit workflows
 * Opens port 5000 immediately
 */

console.log('Starting quick server on port 5000...');

const http = require('http');

// Create server
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Quick server is running on port 5000');
});

// Start server immediately
server.listen(5000, '0.0.0.0', () => {
  console.log('Quick server running on port 5000');
});
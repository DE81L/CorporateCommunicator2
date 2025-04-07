import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create Express app
const app = express();
const server = createServer(app);

// Simple logging function
function log(message, source = 'server') {
  console.log(`[${source}] ${message}`);
}

// Set port to 5000 for Replit compatibility
const PORT = 5000;

// Serve static files from client/dist
app.use(express.static(path.join(__dirname, 'client', 'dist')));

// API endpoint for testing
app.get('/api/ping', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// Catch-all route to serve the index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  log(`Replit-compatible server running on port ${PORT}`);
});
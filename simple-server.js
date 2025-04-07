/**
 * Simple Express Server
 * 
 * This is a minimal server that listens on port 5000 to satisfy Replit's requirements
 * while also serving as a compatibility layer for the application.
 */

import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create the express app
const app = express();
const PORT = process.env.PORT || 5000;

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'Simple Express server is running',
    environment: process.env.ELECTRON ? 'Electron' : 'Web (Replit)',
    time: new Date().toISOString()
  });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Simple Express server running on port ${PORT}`);
});
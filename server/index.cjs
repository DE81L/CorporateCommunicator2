const express = require('express');
const http = require('http');
const { connectToDb } = require('./db.cjs');

/**
 * Main server entry point with environment detection
 */
async function startServer() {
  const app = express();
  const server = http.createServer(app);
  
  // Configure middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Determine if we're in Electron or Replit environment
  const isElectron = process.env.ELECTRON === 'true';
  const isReplit = process.env.REPLIT_DB_URL !== undefined;
  
  console.log(`Environment: ${isElectron ? 'Electron' : 'Web'}`);
  if (isReplit) console.log('Running in Replit environment');
  
  // Connect to database
  try {
    await connectToDb();
    console.log('✅ Database connection verified');
  } catch (err) {
    console.log(`Failed to connect to database: ${err.message}`);
    // Continue anyway for testing purposes
  }
  
  // Basic endpoint to verify the server is running
  app.get('/api/status', (req, res) => {
    res.json({
      status: 'online',
      environment: isElectron ? 'electron' : (isReplit ? 'replit' : 'web'),
      time: new Date().toISOString()
    });
  });
  
  // Environment-specific routes
  if (isElectron) {
    // Electron-specific endpoints
    app.get('/api/electron-info', (req, res) => {
      res.json({
        type: 'electron',
        version: process.versions.electron || 'unknown'
      });
    });
  } else {
    // Web-specific endpoints
    app.get('/api/web-info', (req, res) => {
      res.json({
        type: 'web',
        environment: isReplit ? 'replit' : 'standard'
      });
    });
  }
  
  // Determine the port based on environment
  const PORT = isElectron 
    ? 3000 
    : (process.env.PORT 
        ? parseInt(process.env.PORT, 10) 
        : 3000);
  
  // Start the server
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
  
  // Handle termination gracefully
  const shutdown = () => {
    console.log('Shutting down server...');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  };
  
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  
  return server;
}

// Start the server if this is the main module
if (require.main === module) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

module.exports = { startServer };
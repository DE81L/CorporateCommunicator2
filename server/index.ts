import { createApp } from './app';
import http from 'http';
import { db, connectToDb } from './db';
import * as schema from '../shared/schema';

// Function to start a quick server on port 5000 for Replit environment
function startQuickServer() {
  if (process.env.REPLIT_DB_URL) {
    console.log('Starting quick server for Replit on port 5000...');
    const quickServer = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('Quick server is running on port 5000');
    });
    
    quickServer.listen(5000, '0.0.0.0', () => {
      console.log('Quick server running on port 5000');
    });
    
    return quickServer;
  }
  return null;
}

/**
 * Main server entry point with environment detection
 */
async function startServer() {
  await connectToDb();
  console.log('Connected to database');

  // Start quick server for Replit if needed
  const quickServer = startQuickServer();
  const { app, server } = await createApp();
  
  // Add health check endpoint
  app.get("/api/health", async (req, res) => {
    try {
      // Check database connection by attempting a simple query
      await db.select({ id: 1 }).from(schema.users).limit(1);
      res.json({ 
        status: "healthy",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      });
    } catch (error) {
      res.status(500).json({ 
        status: "unhealthy", 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Determine the port based on environment
  const PORT = 3000;
  
  await electronServer.setupVite()
    console.log(`Server running on http://localhost:${PORT}`);
  });
  
  // Handle termination gracefully
  const shutdown = () => {
    console.log('Shutting down server...');
    
    // Cleanup all servers
    server.close(() => {
      console.log('Server stopped');
      
      // Close the quick server if it exists
      if (quickServer) {
        quickServer.close(() => {
          console.log('Quick server closed');
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    });
  };
  
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  
  return server;
}

// Start the server if this is the main module
// Using import.meta.url for ESM modules
const isMainModule = import.meta.url.endsWith(process.argv[1].replace(/^file:\/\//, ''));
if (isMainModule) {
  startServer().catch((err) => {
    console.error('Server startup error:', err);
    process.exit(1);
  });
}

export { startServer };
import electronServer from './electron-server-implementation';

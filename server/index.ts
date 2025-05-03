import express from 'express';

import { setupAutoAuth } from './autoAuth';

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { createApp } from './app';
import http from 'http';
import { db, connectToDb, checkDatabaseAndUser } from './db'; // Updated import here
import 'dotenv-safe/config';
import cors from 'cors';
import { sql } from 'drizzle-orm';
import path from 'path';

// Import the schema, now assumed to be correctly typed
import * as schema from '../shared/schema';
import { registerRoutes } from './routes';


// Function to start a quick server on port 5000 for Replit environment
function startQuickServer(): http.Server | null {
  console.log('startQuickServer called');
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
  console.log('startServer function called');
  await connectToDb();

  console.log('Connected to database');
  await checkDatabaseAndUser();

   // Start quick server for Replit if needed
  const quickServer = startQuickServer();
  const { app, server } = await createApp();
  await registerRoutes(app, server);

  // Enable CORS for requests from FRONTEND_URL or http://localhost:5173
  app.use(
    cors({
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true,
    }));

  // Add body-parsing middleware
  // 1. Parse JSON bodies (for API clients sending JSON)
  app.use(express.json());

  
  // Add health check endpoint
  console.log('Adding health check endpoint');
  app.get("/api/health", async (req, res) => {
    try {
      // Check database connection by attempting a simple query against the users table
      await db.select({ id: sql<number>`1` }).from(schema.users).limit(1);
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

  // Catch-all route for serving the client-side application
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'public', 'index.html'));
  });

  // Determine the port based on environment
  const PORT = 3000;

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  }); 

  // // // // // // // //

  // Handle termination gracefully
  const shutdown = () => {
    console.log('shutdown function called');
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

startServer().catch(err => {
  console.error('Server startup error:', err);
  process.exit(1);
});

export { startServer };
import electronServer from './electron-server-implementation';


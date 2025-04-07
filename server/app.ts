import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { connectToDb } from './db';
import { registerRoutes } from './routes';
import { setupAuth } from './auth';
import { setupVite, serveStatic, log } from './vite';
import http from 'http';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export async function createApp() {
  const app = express();
  const isElectron = process.env.ELECTRON === 'true';
  const isReplit = process.env.REPLIT_DB_URL !== undefined;
  
  log(`Environment: ${isElectron ? 'Electron' : 'Web'}`);
  if (isReplit) log('Running in Replit environment');
  
  // Basic middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Connect to database - will use environment variables to distinguish between Electron and Replit
  try {
    await connectToDb();
    log('✅ Database connection verified');
  } catch (err) {
    log(`Failed to connect to database: ${err instanceof Error ? err.message : String(err)}`, 'error');
    // Provide fallback database behavior if needed
  }
  
  // Setup authentication
  setupAuth(app);
  
  // Environment-specific setup
  if (isElectron) {
    // Electron-specific setup
    log('Setting up for Electron environment');
    // Electron-specific routes or configuration here
    app.get('/api/environment', (req, res) => {
      res.json({
        environment: 'electron',
        version: process.env.npm_package_version || 'unknown'
      });
    });
  } else {
    // Web/Replit-specific setup
    log('Setting up for Web/Replit environment');
    // Web-specific routes or configuration here
    app.get('/api/environment', (req, res) => {
      res.json({
        environment: isReplit ? 'replit' : 'web',
        version: process.env.npm_package_version || 'unknown'
      });
    });
  }
  
  // Register API routes
  const server = await registerRoutes(app);
  
  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    log(`Error: ${err.message}`, 'error');
    res.status(err.status || 500).json({
      error: {
        message: err.message,
        status: err.status || 500
      }
    });
  });
  
  // Only setup Vite or static files if in web mode
  if (!isElectron) {
    // If in development, setup Vite middleware
    if (process.env.NODE_ENV === 'development') {
      await setupVite(app, server);
    } else {
      // If in production, serve static files
      serveStatic(app);
    }
  }
  
  return { app, server };
}
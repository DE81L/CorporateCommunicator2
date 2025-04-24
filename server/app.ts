import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { connectToDb } from './db'; // Remove .cjs if present
import { registerRoutes } from './routes';
import { setupAuth } from './auth';
import { setupVite, serveStatic, log } from './vite';
import http from 'http';
import dotenv from 'dotenv';
import WebSocket, { WebSocketServer } from 'ws';

// Load environment variables
dotenv.config();

// Log function calls with their names
export async function createApp() {
  log(`Entering function: createApp`);
  const app = express();
  const isElectron = process.env.ELECTRON === 'true';
  const isReplit = process.env.REPLIT_DB_URL !== undefined;
  app.use(
    cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    })
  );


  
  log(`Environment: ${isElectron ? 'Electron' : 'Web'}`);
  if (isReplit) log('Running in Replit environment'); // This is environment detection log
  
  // Basic middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Connect to database - will use environment variables to distinguish between Electron and Replit
  try {
    await connectToDb();
    log('✅ Database connection verified');
  } catch (err) {
    log(`Failed to connect to database: ${err instanceof Error ? err.message : String(err)}`, 'error');
    
  }
  
  // Setup authentication
  setupAuth(app);
  
  // Environment-specific setup
  if (isElectron) {
    // Electron-specific setup
    log('Setting up for Electron environment'); // This is environment detection log
    // Electron-specific routes or configuration here
    app.get('/api/environment', (req, res) => {
       
      res.json({
        environment: 'electron',
        version: process.env.npm_package_version || 'unknown'
      });
    });
  } else {
    // Web/Replit-specific setup
    log('Setting up for Web/Replit environment'); // This is environment detection log
    // Web-specific routes or configuration here
    app.get('/api/environment', (req, res) => {
      // removed log
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

    // WebSocket setup
  const wss = new WebSocketServer({ server: server as any });
  const onlineUsers = new Map<string, WebSocket>(); // Map of userId to WebSocket
  const offlineMessages = new Map<string, any[]>(); // Map of userId to offline messages

  wss.on('connection', (ws: WebSocket, request) => {
    const userId = new URL(request.url!, `http://${request.headers.host}`).searchParams.get('userId');
    log(`WebSocket connection from user: ${userId}`);

    if (!userId) {
      ws.close(1000, 'Missing user ID');
      return;
    }

    onlineUsers.set(userId, ws);
    ws.on('message', (message) => {
      const parsedMessage = JSON.parse(message.toString());
      log(`Received message: ${JSON.stringify(parsedMessage)}`);

      if (parsedMessage.type === 'chatMessage') {
        const recipientId = parsedMessage.recipientId;
        const recipientWs = onlineUsers.get(recipientId);

        if (recipientWs) {
          log(`Sending message to online user: ${recipientId}`);
          recipientWs.send(JSON.stringify(parsedMessage));
        } else {
          log(`Storing message for offline user: ${recipientId}`);
          if (!offlineMessages.has(recipientId)) {
            offlineMessages.set(recipientId, []);
          }
          offlineMessages.get(recipientId)!.push(parsedMessage);

          // Acknowledge that the message was stored offline
          const ackOffline = { type: 'ackOffline', messageId: parsedMessage.messageId, recipientId };
          ws.send(JSON.stringify(ackOffline));
        }
      } else if (parsedMessage.type === 'ackOffline') {
        const senderId = parsedMessage.senderId;
        log(`Deleting offline messages for user: ${senderId}`);

        offlineMessages.delete(senderId);
        // P2P communication initiation
        const userWs = onlineUsers.get(senderId);
        if (userWs) {
          log(`Initiating P2P communication for user: ${senderId}`);
          const initP2P = { type: 'initP2P', recipientId: userId };
          userWs.send(JSON.stringify(initP2P));
        }
      }
      // Check for offline messages for this user and send them
      else if(parsedMessage.type === "checkOffline") {
        if (offlineMessages.has(userId)) {
          log(`Sending offline messages to user: ${userId}`);
          offlineMessages.get(userId)!.forEach(msg => {
            ws.send(JSON.stringify(msg));
          });
          // offlineMessages.delete(userId);
        }
      }
    });

    ws.on('close', (code, reason) => {
      log(`WebSocket connection closed for user: ${userId} with code: ${code}, reason: ${reason}`);
      onlineUsers.delete(userId);
    });

    ws.on('error', (error) => {
      log(`WebSocket error for user: ${userId} - ${error.message}`, 'error');
      onlineUsers.delete(userId);
      
    });

      // Check for offline messages for this user and send them
      if (offlineMessages.has(userId)) {
        log(`Sending offline messages to user on connect: ${userId}`);
        ws.send(JSON.stringify({ type: 'checkOffline' }));
      }
  });
  
  // Only setup Vite or static files if in web mode
  if (!isElectron) {
    // Force development mode in Replit or if NODE_ENV is development
    if (isReplit || process.env.NODE_ENV === 'development') {
      // Ensure we're in development mode
      process.env.NODE_ENV = 'development';
      try {
        await setupVite(app, server);
      } catch (err) {
        log(`Vite setup error: ${err instanceof Error ? err.message : String(err)}`, 'error'); // This is error handling log
        
        // Provide a basic route for development
        app.get('*', (req, res) => {
          log(`Entering function: GET * (Development)`);
          if (req.path.startsWith('/api')) {
            // Let API requests pass through
            return res.status(404).json({ error: 'API endpoint not found' });
          }
          
          // Simple HTML for all other routes in development
          res.send(`
            <html>
              <head>
                <title>Development Mode</title>
                <style>
                  body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                  h1 { color: #333; }
                  .box { background-color: #f0f0f0; padding: 15px; border-radius: 5px; }
                </style>
              </head>
              <body>
                <h1>Development Mode Active</h1>
                <div class="box">
                  <p>The application is running in development mode.</p>
                  <p>Client-side Vite is available at <a href="http://localhost:5173">http://localhost:5173</a></p>
                  <p>API server is running on this instance.</p>
                </div>
              </body>
            </html>
          `);
        });
      }
    } else {
      // If in production, serve static files
      try {
        serveStatic(app);
      } catch (err) {
        log(`Static serving error: ${err instanceof Error ? err.message : String(err)}`, 'error'); // This is error handling log
        
        // Handle the error when static files aren't available
        app.get('*', (req, res) => {
          log(`Entering function: GET * (Production)`);
          if (req.path.startsWith('/api')) {
            // Let API requests pass through
            return res.status(404).json({ error: 'API endpoint not found' });
          }
          
          res.status(500).send(`
            <html>
              <head>
                <title>App Error</title>
                <style>
                  body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                  h1 { color: #c00; }
                  .box { background-color: #fff0f0; padding: 15px; border-radius: 5px; border: 1px solid #ffcccc; }
                </style>
              </head>
              <body>
                <h1>Application Error</h1>
                <div class="box">
                  <p>The application could not serve static files.</p>
                  <p>Error: ${err instanceof Error ? err.message : String(err)}</p>
                  <p>Please build the client application first.</p>
                </div>
              </body>
            </html>
          `);
        });
      }
    }
  }
  
  return { app, server };
}
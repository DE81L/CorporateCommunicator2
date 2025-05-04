import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, basename } from 'path';
import { createApp } from './app';
import { setupWebSocket } from './websocket';
import { registerRoutes } from './routes';
import { connectToDb } from './db';
import type { WebSocketHub } from './websocket';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function startServer() {
  console.log('Starting server...');
  
  await connectToDb();
  console.log('Connected to database');
  
  const { app, server } = await createApp();
  const hub: WebSocketHub = setupWebSocket(server);
  await registerRoutes(app, hub);

  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  return server;
}

const executedFile = basename(process.argv[1] || '');
const currentFile = basename(fileURLToPath(import.meta.url));

if (executedFile === currentFile) {
  startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

export { startServer };


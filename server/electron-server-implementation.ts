import { log } from 'console';
import express from 'express';
import { createServer } from 'http';
import { ElectronServerInterface } from '../shared/electron-shared/electron-server-interface';
import { connectToDb } from './db';
import { setupAuth } from './auth'; 
import { registerRoutes } from './routes';
import { setupVite, serveStatic } from './vite';



const electronServer: ElectronServerInterface = {
  connectToDb: async (): Promise<void> => {
    log('Function: connectToDb');
    await connectToDb();
  },
  setupAuth: async (app: express.Express): Promise<void> => {
    log('Function: setupAuth');
    setupAuth(app);
  },
  registerRoutes: async (app: express.Express): Promise<void> => {
    log('Function: registerRoutes');
    await registerRoutes(app);
  },
    setupVite: async (): Promise<void> => {
      log('Function: setupVite');

      const app = express();
      const server = createServer(app);
      await setupVite(app, server);

    },
    registerApp: async(): Promise<express.Express> => {
      const app = express();
      return app
    },
  serveStatic: (path: string): string => {
    log('Function: serveStatic');
    // serveStatic will return a string
    const staticPath = serveStatic(path)
    
    if (typeof staticPath !== 'string') {
        // Handle the error appropriately, e.g., throw an exception or return a default path
        console.error('serveStatic did not return a string, its returning:', staticPath)
        throw new Error('serveStatic must return a string path');
    }
    

    return staticPath
  },
};


export default electronServer;


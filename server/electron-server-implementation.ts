import { log } from 'console';

import { ElectronServerInterface } from '../shared/electron-shared/electron-server-interface';
import { connectToDb } from './db';
import { setupAuth } from './auth'; 
import { registerRoutes } from './routes';
import { setupVite, serveStatic } from './vite';

const electronServer: ElectronServerInterface = {
  connectToDb: async (): Promise<void> => {
    log('Function: connectToDb')
    await connectToDb();
  },
  setupAuth: async (): Promise<void> => {
    log('Function: setupAuth')
    await setupAuth();
  },
  registerRoutes: async (): Promise<void> => {
    log('Function: registerRoutes')
    await registerRoutes();
  },
  setupVite: async (): Promise<void> => {
    log('Function: setupVite')
    await setupVite();
  },
  serveStatic: (path: string): string => {
    log('Function: serveStatic')
    // Assuming serveStatic returns a string, replace with actual logic if needed
    return serveStatic(path) as string;
  },
};

export default electronServer;
import { ElectronServerInterface } from '../shared/electron-shared/electron-server-interface';
import { connectToDb } from './db';
import { setupAuth } from './auth';
import { registerRoutes } from './routes';
import { setupVite, serveStatic } from './vite';

const electronServer: ElectronServerInterface = {
  connectToDb: async () => {
    await connectToDb();
  },
  setupAuth: async () => {
    await setupAuth();
  },
  registerRoutes: async () => {
    await registerRoutes();
  },
  setupVite: async () => {
    await setupVite();
  },
  serveStatic: (path: string) => {
    // Assuming serveStatic returns a string, replace with actual logic if needed
    return serveStatic(path) as string; 
  },
};

export default electronServer;
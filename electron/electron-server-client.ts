import { ipcRenderer } from 'electron';
import { ElectronServerInterface } from '@shared/electron-server-interface';
import { Express } from 'express';

const electronServerClient: ElectronServerInterface = {
  connectToDb: async () => {
    await ipcRenderer.invoke('server:connectToDb');
  },
  setupAuth: async () => {
    await ipcRenderer.invoke('server:setupAuth');
  },
  registerRoutes: async () => {
    await ipcRenderer.invoke('server:registerRoutes');
  },
  setupVite: async () => {
    await ipcRenderer.invoke('server:setupVite');
  },
  serveStatic: async (path: string) => {
    return await ipcRenderer.invoke('server:serveStatic', path) as string; // Assuming serveStatic returns a string
  },
  registerApp: function (): Promise<Express> {
    throw new Error('Function not implemented.');
  }
};

export default electronServerClient;
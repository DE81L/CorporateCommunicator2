import express from 'express';

export interface ElectronServerInterface {
  connectToDb: () => Promise<void>;
  setupAuth: (app: express.Express) => Promise<void>;
  registerRoutes: (app: express.Express) => Promise<void>;
  setupVite: () => Promise<void>;
  serveStatic: (path: string) => any;
  registerApp: () => Promise<express.Express>;
}
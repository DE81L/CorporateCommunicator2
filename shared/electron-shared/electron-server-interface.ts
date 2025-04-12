export interface ElectronServerInterface {
  connectToDb: () => Promise<void>;
  setupAuth: () => Promise<void>;
  registerRoutes: () => Promise<void>;
  setupVite: () => Promise<void>;
  serveStatic: (path: string) => any;
}
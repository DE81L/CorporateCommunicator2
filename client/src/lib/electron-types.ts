export interface ElectronAPI {
  // IPC Renderer
  ipcRenderer: {
    invoke: (channel: string, ...args: any[]) => Promise<any>;
    send: (channel: string, ...args: any[]) => void;
    on: (channel: string, listener: (event: any, ...args: any[]) => void) => void;
    removeListener: (channel: string, listener: Function) => void;
  };
  // App info and control
  app: {
    getVersion: () => Promise<string>;
    getPath: (name: string) => Promise<string>;
    quit: () => Promise<void>;
  };
  // System utilities
  system: {
    isOnline: () => Promise<boolean>;
    getSystemInfo: () => Promise<{
      platform: string;
      arch: string;
      version: string;
      memory: {
        total: number;
        free: number;
      };
    }>;
  };
  // File system operations
  fs: {
    readFile: (path: string) => Promise<string>;
    writeFile: (path: string, data: string) => Promise<void>;
    fileExists: (path: string) => Promise<boolean>;
  };
  // Dialog operations
  dialog: {
    showOpenDialog: (options: any) => Promise<{
      canceled: boolean;
      filePaths: string[];
    }>;
    showSaveDialog: (options: any) => Promise<{
      canceled: boolean;
      filePath?: string;
    }>;
    showMessageBox: (options: any) => Promise<{
      response: number;
      checkboxChecked?: boolean;
    }>;
  };
  // Clipboard operations
  clipboard: {
    writeText: (text: string) => Promise<void>;
    readText: () => Promise<string>;
  };
  // Storage operations
  storage: {
    getUserData: () => Promise<any>;
    setUserData: (data: any) => Promise<void>;
    getMessages: () => Promise<any[]>;
    saveMessage: (message: any) => Promise<void>;
    deleteMessage: (id: number) => Promise<void>;
  };
}

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}

export interface ImportMetaEnv {
    [key: string]: any;
}

export {};

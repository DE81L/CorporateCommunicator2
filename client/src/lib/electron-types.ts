export interface ElectronAPI {
  app: {
    getVersion: () => Promise<string>;
  };
  window: {
    minimize: () => Promise<void>;
    maximize: () => Promise<void>;
    close: () => Promise<void>;
  };
  storage: {
    getUserData: () => Promise<any>;
    setUserData: (data: any) => Promise<void>;
    getMessages: () => Promise<any[]>;
    saveMessage: (message: any) => Promise<void>;
    deleteMessage: (id: number) => Promise<void>;
  };
  encryption: {
    generateKeyPair: () => Promise<void>;
    encryptMessage: (message: string, publicKey: string) => Promise<string>;
    decryptMessage: (encryptedMessage: string) => Promise<string>;
    getPublicKey: () => Promise<string>;
    rotateKeys: () => Promise<void>;
  };
  notification: {
    showNotification: (title: string, body: string) => Promise<void>;
  };
  system: {
    getSystemInfo: () => Promise<{
      platform: string;
      arch: string;
      version: string;
      memory: {
        total: number;
        free: number;
      };
    }>;
    isOnline: () => Promise<boolean>;
  };
}

// Augment the Window interface in the global scope
declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}

// Export a dummy constant to make this a module
export const ELECTRON_API = "electron-api";

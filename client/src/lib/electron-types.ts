export interface ElectronAPI {
  // Основные API
  ipcRenderer: {
    invoke: (channel: string, ...args: any[]) => Promise<any>;
    send: (channel: string, ...args: any[]) => void;
    on: (channel: string, listener: (event: any, ...args: any[]) => void) => void;
    removeListener: (channel: string, listener: Function) => void;
  };

  // Системные API
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

  // API приложения
  app: {
    getVersion: () => Promise<string>;
    getPath: (name: string) => Promise<string>;
    quit: () => Promise<void>;
    minimize: () => Promise<void>;
    maximize: () => Promise<void>;
    reload: () => Promise<void>;
    openDevTools: () => Promise<void>;
    openDoom: () => Promise<void>;
  };

  // Операции файловой системы
  fs: {
    readFile: (path: string) => Promise<string>;
    writeFile: (path: string, data: string) => Promise<void>;
    fileExists: (path: string) => Promise<boolean>;
  };

  // Операции диалогов
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

  // Операции буфера обмена
  clipboard: {
    writeText: (text: string) => Promise<void>;
    readText: () => Promise<string>;
  };

  // Операции хранилища
  storage: {
    getUserData: () => Promise<any>;
    setUserData: (data: any) => Promise<void>;
    getMessages: () => Promise<any[]>;
    saveMessage: (message: any) => Promise<void>;
    deleteMessage: (id: number) => Promise<void>;
  };

  // Добавляем свойство api, соответствующее структуре preload-скрипта
  api?: {
    system: {
      getSystemInfo: () => Promise<any>;
      isOnline: () => Promise<boolean>;
    };
    app: {
      getAppVersion: () => Promise<string>;
      getVersion: () => Promise<string>;
    };
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

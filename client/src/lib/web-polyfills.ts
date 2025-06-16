/**
 * Web Polyfills for Electron API
 * 
 * This file provides web-friendly alternatives to Electron-specific functionality.
 * Used when the application is running in a browser environment (e.g., Replit).
 */

import type { ElectronAPI } from './electron-types';

// Операции с файловой системой
export const fileSystem = {
  // Читаем файл – в вебе используем IndexedDB
  readFile: async (filePath: string): Promise<string> => {
    // В вебе использовали бы IndexedDB или localStorage – упрощённый пример:
    const storedData = localStorage.getItem(`file:${filePath}`);
    if (!storedData) {
      throw new Error(`File not found: ${filePath}`);
    }
    return storedData;
  },
  
  // Запись файла – в вебе используем IndexedDB
  writeFile: async (filePath: string, data: string): Promise<void> => {
    // В вебе использовали бы IndexedDB или localStorage – упрощённый пример:
    localStorage.setItem(`file:${filePath}`, data);
    return;
  },
  
  // Проверяем наличие файла – в вебе через IndexedDB
  fileExists: async (filePath: string): Promise<boolean> => {
    // In web, we'd use IndexedDB or localStorage - simplified example:
    return localStorage.getItem(`file:${filePath}`) !== null;
  }
};

// Операции диалога
export const dialog = {
  // Показать диалог открытия – в вебе используется input type="file"
  showOpenDialog: async (options: any): Promise<{canceled: boolean; filePaths: string[]}> => {
    return new Promise((resolve) => {
      // Создаем временный input для выбора файла
      const input = document.createElement('input');
      input.type = 'file';
      
      // Настраиваем атрибуты согласно опциям
      if (options.properties?.includes('openDirectory')) {
        input.setAttribute('webkitdirectory', '');
      }
      
      if (options.properties?.includes('multiSelections')) {
        input.setAttribute('multiple', '');
      }
      
      if (options.filters?.length) {
        const accept = options.filters
          .flatMap((filter: any) => filter.extensions.map((ext: string) => `.${ext}`))
          .join(',');
        input.accept = accept;
      }
      
      // Обрабатываем выбор файла
      input.onchange = (event) => {
        const files = (event.target as HTMLInputElement).files;
        if (!files || files.length === 0) {
          resolve({ canceled: true, filePaths: [] });
          return;
        }
        
        const filePaths = Array.from(files).map(file => file.name);
        resolve({ canceled: false, filePaths });
      };
      
      // Обрабатываем отмену
      input.oncancel = () => {
        resolve({ canceled: true, filePaths: [] });
      };
      
      // Запускаем диалог выбора файла
      input.click();
    });
  },
  
  // Показать диалог сохранения – в вебе просто инициируем загрузку
  showSaveDialog: async (options: any): Promise<{canceled: boolean; filePath?: string}> => {
    // В браузере просто запускаем загрузку – упрощённая реализация:
    return new Promise((resolve) => {
      const defaultPath = options.defaultPath || 'download.txt';
      // В реальной реализации показали бы модальное окно с именем файла
      
      // Симулируем успешное сохранение
      resolve({ canceled: false, filePath: defaultPath });
    });
  },
  
  // Show message dialog - uses browser alert/confirm in web environment
  showMessageBox: async (options: any): Promise<{response: number; checkboxChecked?: boolean}> => {
    if (options.type === 'question') {
      const result = window.confirm(options.message || 'Confirm?');
      return { response: result ? 0 : 1 };
    } else {
      window.alert(options.message || 'Alert');
      return { response: 0 };
    }
  }
};

// System information
export const system = {
  // Get system info - returns browser info in web environment
  getSystemInfo: async (): Promise<any> => {
    return {
      platform: 'web',
      arch: navigator.platform || 'unknown',
      version: navigator.userAgent || 'unknown',
      memory: {
        total: 0, // Can't reliably get memory info in browsers
        free: 0
      }
    };
  },
  
  // Check if online
  isOnline: async (): Promise<boolean> => {
    return navigator.onLine;
  },
  
  // Get app version
  getVersion: async (): Promise<string> => {
    return 'web-version';
  }
};

// Clipboard operations
export const clipboard = {
  // Write text to clipboard
  writeText: async (text: string): Promise<void> => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  },
  
  // Read text from clipboard
  readText: async (): Promise<string> => {
    if (navigator.clipboard && navigator.clipboard.readText) {
      return await navigator.clipboard.readText();
    }
    // No good fallback for reading clipboard in older browsers
    return '';
  }
};

// IPC Renderer operations
export const ipcRenderer = {
    // Send an event to the main process
    send: async (): Promise<void> => {
        return Promise.resolve()
    },
    
    // Receive an event from the main process
    on: async (): Promise<void> => {
        return Promise.resolve();
    },
      // Invoke a method on the main process
    invoke: async (): Promise<any> => {
        return Promise.resolve();
    },
      // Remove a listener from the main process
    removeListener: async (): Promise<void> => {
        return Promise.resolve();
    }
};

// Create a complete mock Electron API
function createMockElectronAPI(): ElectronAPI {
  return {
    app: {
      getVersion: () => Promise.resolve('1.0.0-web'),
      getPath: () => Promise.resolve(''),
      quit: () => Promise.resolve(),
      minimize: () => Promise.resolve(),
      maximize: () => Promise.resolve(),
      reload: () => {
        window.location.reload();
        return Promise.resolve();
      },
      openDevTools: () => Promise.resolve(),
      // заглушка для запуска Doom в веб-версии
      openDoom: () => Promise.resolve(),
    },
    system: {
      getSystemInfo: () => Promise.resolve({
        platform: 'web',
        arch: 'web',
        version: 'web',
        memory: {
          total: 0,
          free: 0,
        },
      }),
      isOnline: () => Promise.resolve(navigator.onLine),
    },
    storage: {
      getUserData: () => Promise.resolve({}),
      setUserData: (data: any) => {localStorage.setItem("user-data", JSON.stringify(data)); return Promise.resolve();},
      getMessages: () => Promise.resolve([]),
      saveMessage: (message: any) => { localStorage.setItem(`message-${message.id}`, JSON.stringify(message)); return Promise.resolve()},
      deleteMessage: (id: number) => { localStorage.removeItem(`message-${id}`); return Promise.resolve();},
    },
      ipcRenderer,
      fs: fileSystem,
      dialog,
      clipboard

  };
}

// Install mock Electron API if needed
export function installMockElectronAPI(): void {
  if (typeof window !== 'undefined' && !window.electron && import.meta.env.VITE_WEB_ONLY === 'true') {
    const mockAPI = createMockElectronAPI()
    window.electron = mockAPI
    console.log('Installed mock Electron API for web environment');
  }
}

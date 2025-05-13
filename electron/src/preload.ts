import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  app: {
    getVersion: () => ipcRenderer.invoke('get-app-version'),
    getPath: (name: string) => ipcRenderer.invoke('get-app-path', name),
    quit: () => ipcRenderer.invoke('app-quit'),
    minimize: () => ipcRenderer.invoke('window-minimize'),
    maximize: () => ipcRenderer.invoke('window-maximize'),
  },
  system: {
    getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
    isOnline: () => ipcRenderer.invoke('is-online'),
  },
  fs: {
    readFile: (path: string) => ipcRenderer.invoke('fs-read', path),
    writeFile: (path: string, data: string) => ipcRenderer.invoke('fs-write', path, data),
    fileExists: (path: string) => ipcRenderer.invoke('fs-exists', path),
  },
  dialog: {
    showOpenDialog: (options: any) => ipcRenderer.invoke('dialog-open', options),
    showSaveDialog: (options: any) => ipcRenderer.invoke('dialog-save', options),
    showMessageBox: (options: any) => ipcRenderer.invoke('dialog-message', options),
  },
  storage: {
    getUserData: () => ipcRenderer.invoke('storage-get-user'),
    setUserData: (data: any) => ipcRenderer.invoke('storage-set-user', data),
    getMessages: () => ipcRenderer.invoke('storage-get-messages'),
    saveMessage: (message: any) => ipcRenderer.invoke('storage-save-message', message),
    deleteMessage: (id: number) => ipcRenderer.invoke('storage-delete-message', id),
  }
});

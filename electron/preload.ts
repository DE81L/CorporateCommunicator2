// Preload script for Electron
// This provides a secure bridge between the renderer process and the main process

import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  app: {
    getVersion: async () => await ipcRenderer.invoke('app-get-version'),
  },
  window: {
    minimize: async () => await ipcRenderer.invoke('window-minimize'),
    maximize: async () => await ipcRenderer.invoke('window-maximize'),
    close: async () => await ipcRenderer.invoke('window-close'),
  },
  storage: {
    getUserData: async () => await ipcRenderer.invoke('get-user-data'),
    setUserData: async (data: any) => await ipcRenderer.invoke('set-user-data', data),
    getMessages: async () => await ipcRenderer.invoke('get-messages'),
    saveMessage: async (message: any) => await ipcRenderer.invoke('save-message', message),
    deleteMessage: async (id: number) => await ipcRenderer.invoke('delete-message', id),
  },
  encryption: {
    generateKeyPair: async () => await ipcRenderer.invoke('generate-key-pair'),
    encryptMessage: async (message: string, publicKey: string) => 
      await ipcRenderer.invoke('encrypt-message', message, publicKey),
    decryptMessage: async (encryptedMessage: string) => 
      await ipcRenderer.invoke('decrypt-message', encryptedMessage),
    getPublicKey: async () => await ipcRenderer.invoke('get-public-key'),
    rotateKeys: async () => await ipcRenderer.invoke('rotate-keys'),
  },
  notification: {
    showNotification: async (title: string, body: string) =>
      await ipcRenderer.invoke('show-notification', title, body),
  },
  system: {
    getSystemInfo: async () => await ipcRenderer.invoke('get-system-info'),
    isOnline: async () => await ipcRenderer.invoke('is-online'),
  },
});
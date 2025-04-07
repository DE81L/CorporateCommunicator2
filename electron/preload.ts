// Preload script for Electron
// This provides a secure bridge between the renderer process and the main process

import { contextBridge, ipcRenderer } from "electron";

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electron", {
  app: {
    getVersion: () => ipcRenderer.invoke("app-get-version"),
  },
  window: {
    minimize: () => ipcRenderer.invoke("window-minimize"),
    maximize: () => ipcRenderer.invoke("window-maximize"),
    close: () => ipcRenderer.invoke("window-close"),
  },
  storage: {
    getUserData: () => ipcRenderer.invoke("get-user-data"),
    setUserData: (data: any) => ipcRenderer.invoke("set-user-data", data),
    getMessages: () => ipcRenderer.invoke("get-messages"),
    saveMessage: (message: any) => ipcRenderer.invoke("save-message", message),
    deleteMessage: (id: number) => ipcRenderer.invoke("delete-message", id),
  },
  encryption: {
    generateKeyPair: () => ipcRenderer.invoke("generate-key-pair"),
    encryptMessage: (message: string, publicKey: string) =>
      ipcRenderer.invoke("encrypt-message", message, publicKey),
    decryptMessage: (encryptedMessage: string) =>
      ipcRenderer.invoke("decrypt-message", encryptedMessage),
    getPublicKey: () => ipcRenderer.invoke("get-public-key"),
    rotateKeys: () => ipcRenderer.invoke("rotate-keys"),
  },
  notification: {
    showNotification: (title: string, body: string) =>
      ipcRenderer.invoke("show-notification", title, body),
  },
  system: {
    getSystemInfo: () => ipcRenderer.invoke("get-system-info"),
    isOnline: () => ipcRenderer.invoke("is-online"),
  },
});

export {};

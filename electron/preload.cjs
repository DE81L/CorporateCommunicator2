const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'electron',
  {
    isElectron: true,
    platform: process.platform,
    // Add any specific APIs you need
    system: {
      getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
      isOnline: () => ipcRenderer.invoke('is-online'),
    },
    app: {
      getVersion: () => ipcRenderer.invoke('get-app-version'),
    },
    i18n: {
      changeLanguage: (lang) => ipcRenderer.invoke('change-language', lang),
      getCurrentLanguage: () => ipcRenderer.invoke('get-current-language')
    }

  }
);
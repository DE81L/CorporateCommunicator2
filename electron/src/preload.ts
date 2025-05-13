import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
    send:   (channel: string, ...args: any[]) => ipcRenderer.send(channel,   ...args),
    on:     (channel: string, listener: (...args: any[]) => void) => {
      ipcRenderer.on(channel, listener);
      return () => ipcRenderer.removeListener(channel, listener);
    }
  },
  app: {
    getVersion: () => ipcRenderer.invoke('get-app-version'),
    minimize: () => ipcRenderer.invoke('window-minimize'),
    maximize: () => ipcRenderer.invoke('window-maximize'),
    quit: () => ipcRenderer.invoke('window-close')
  },
  system: {
    getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
    isOnline: () => ipcRenderer.invoke('is-online')
  }
});

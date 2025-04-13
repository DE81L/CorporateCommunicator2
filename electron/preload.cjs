const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('chatAPI', {
  bootstrap: (fn) => ipcRenderer.once('bootstrap', (_event, data) => fn(data)),
  onMessage: (fn) => ipcRenderer.on('new-msg', (_event, msg) => fn(msg)),
  send: (from, text) => ipcRenderer.send('send-msg', { from, text, ts: Date.now() }),
});
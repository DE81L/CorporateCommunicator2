const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('chat', {
  send:  (msg)      => ipcRenderer.send('send-message', msg),
  onMsg: (handler)  => ipcRenderer.on('receive-message', (_e, m) => handler(m)),
});

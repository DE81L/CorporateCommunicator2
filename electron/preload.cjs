const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  sendMessage: (msg) => ipcRenderer.send("chat:send", msg),
  onMessage: (cb)   => ipcRenderer.on("chat:message", cb),
  offMessage: (cb)  => ipcRenderer.removeListener("chat:message", cb),
});

/* Tell the main process who we are */
const userId = process.argv.includes("--user2") ? "user2" : "user1";
contextBridge.exposeInMainWorld("__USER_ID__", userId);
ipcRenderer.send("chat:register", userId);
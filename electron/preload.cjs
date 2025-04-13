const { contextBridge, ipcRenderer } = require("electron");

let username = "user1"; // default – will be overwritten

ipcRenderer.on("set-username", (_e, u) => {
  username = u;
  localStorage.setItem("username", u); // make it visible to the React stub
});

contextBridge.exposeInMainWorld("chatAPI", {
  sendMessage: (msg) => ipcRenderer.send("chat-message", msg),
  onMessage: (cb) =>
    ipcRenderer.on("chat-message", (_e, msg) => cb(msg)),
  getUsername: () => username,
});
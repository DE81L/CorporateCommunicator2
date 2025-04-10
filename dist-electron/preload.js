"use strict";
// Preload script for Electron
// This provides a secure bridge between the renderer process and the main process
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
electron_1.contextBridge.exposeInMainWorld("electron", {
    app: {
        getVersion: () => electron_1.ipcRenderer.invoke("app-get-version"),
    },
    window: {
        minimize: () => electron_1.ipcRenderer.invoke("window-minimize"),
        maximize: () => electron_1.ipcRenderer.invoke("window-maximize"),
        close: () => electron_1.ipcRenderer.invoke("window-close"),
    },
    storage: {
        getUserData: () => electron_1.ipcRenderer.invoke("get-user-data"),
        setUserData: (data) => electron_1.ipcRenderer.invoke("set-user-data", data),
        getMessages: () => electron_1.ipcRenderer.invoke("get-messages"),
        saveMessage: (message) => electron_1.ipcRenderer.invoke("save-message", message),
        deleteMessage: (id) => electron_1.ipcRenderer.invoke("delete-message", id),
    },
    encryption: {
        generateKeyPair: () => electron_1.ipcRenderer.invoke("generate-key-pair"),
        encryptMessage: (message, publicKey) => electron_1.ipcRenderer.invoke("encrypt-message", message, publicKey),
        decryptMessage: (encryptedMessage) => electron_1.ipcRenderer.invoke("decrypt-message", encryptedMessage),
        getPublicKey: () => electron_1.ipcRenderer.invoke("get-public-key"),
        rotateKeys: () => electron_1.ipcRenderer.invoke("rotate-keys"),
    },
    notification: {
        showNotification: (title, body) => electron_1.ipcRenderer.invoke("show-notification", title, body),
    },
    system: {
        getSystemInfo: () => electron_1.ipcRenderer.invoke("get-system-info"),
        isOnline: () => electron_1.ipcRenderer.invoke("is-online"),
    },
});

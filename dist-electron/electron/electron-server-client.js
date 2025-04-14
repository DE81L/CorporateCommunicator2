"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const electronServerClient = {
    connectToDb: async () => {
        await electron_1.ipcRenderer.invoke('server:connectToDb');
    },
    setupAuth: async () => {
        await electron_1.ipcRenderer.invoke('server:setupAuth');
    },
    registerRoutes: async () => {
        await electron_1.ipcRenderer.invoke('server:registerRoutes');
    },
    setupVite: async () => {
        await electron_1.ipcRenderer.invoke('server:setupVite');
    },
    serveStatic: async (path) => {
        return await electron_1.ipcRenderer.invoke('server:serveStatic', path); // Assuming serveStatic returns a string
    },
    registerApp: function () {
        throw new Error('Function not implemented.');
    }
};
exports.default = electronServerClient;

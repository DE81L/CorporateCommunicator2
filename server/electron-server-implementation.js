"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("./db");
const auth_1 = require("./auth");
const routes_1 = require("./routes");
const vite_1 = require("./vite");
const electronServer = {
    connectToDb: async () => {
        await (0, db_1.connectToDb)();
    },
    setupAuth: async () => {
        await (0, auth_1.setupAuth)();
    },
    registerRoutes: async () => {
        await (0, routes_1.registerRoutes)();
    },
    setupVite: async () => {
        await (0, vite_1.setupVite)();
    },
    serveStatic: (path) => {
        // Assuming serveStatic returns a string, replace with actual logic if needed
        return (0, vite_1.serveStatic)(path);
    },
};
exports.default = electronServer;

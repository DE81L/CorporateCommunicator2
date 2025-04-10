"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = startServer;
const app_1 = require("./app");
const http_1 = __importDefault(require("http"));
const db_1 = require("./db");
const schema = __importStar(require("../shared/schema"));
// Function to start a quick server on port 5000 for Replit environment
function startQuickServer() {
    if (process.env.REPLIT_DB_URL) {
        console.log('Starting quick server for Replit on port 5000...');
        const quickServer = http_1.default.createServer((req, res) => {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('Quick server is running on port 5000');
        });
        quickServer.listen(5000, '0.0.0.0', () => {
            console.log('Quick server running on port 5000');
        });
        return quickServer;
    }
    return null;
}
/**
 * Main server entry point with environment detection
 */
async function startServer() {
    // Start quick server for Replit if needed
    const quickServer = startQuickServer();
    const { app, server } = await (0, app_1.createApp)();
    // Add health check endpoint
    app.get("/api/health", async (req, res) => {
        try {
            // Check database connection by attempting a simple query
            await db_1.db.select({ id: 1 }).from(schema.users).limit(1);
            res.json({
                status: "healthy",
                timestamp: new Date().toISOString(),
                environment: process.env.NODE_ENV || 'development'
            });
        }
        catch (error) {
            res.status(500).json({
                status: "unhealthy",
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            });
        }
    });
    // Determine the port based on environment
    const PORT = 3000;
    server.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
    // Handle termination gracefully
    const shutdown = () => {
        console.log('Shutting down server...');
        // Cleanup all servers
        server.close(() => {
            console.log('Server stopped');
            // Close the quick server if it exists
            if (quickServer) {
                quickServer.close(() => {
                    console.log('Quick server closed');
                    process.exit(0);
                });
            }
            else {
                process.exit(0);
            }
        });
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    return server;
}
// Start the server if this is the main module
// Using import.meta.url for ESM modules
const isMainModule = import.meta.url.endsWith(process.argv[1].replace(/^file:\/\//, ''));
if (isMainModule) {
    startServer().catch((err) => {
        console.error('Server startup error:', err);
        process.exit(1);
    });
}

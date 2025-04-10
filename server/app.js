"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const db_1 = require("./db");
const routes_1 = require("./routes");
const auth_1 = require("./auth");
const vite_1 = require("./vite");
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
async function createApp() {
    const app = (0, express_1.default)();
    const isElectron = process.env.ELECTRON === 'true';
    const isReplit = process.env.REPLIT_DB_URL !== undefined;
    (0, vite_1.log)(`Environment: ${isElectron ? 'Electron' : 'Web'}`);
    if (isReplit)
        (0, vite_1.log)('Running in Replit environment');
    // Basic middleware
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: true }));
    // Connect to database - will use environment variables to distinguish between Electron and Replit
    try {
        await (0, db_1.connectToDb)();
        (0, vite_1.log)('✅ Database connection verified');
    }
    catch (err) {
        (0, vite_1.log)(`Failed to connect to database: ${err instanceof Error ? err.message : String(err)}`, 'error');
        // Provide fallback database behavior if needed
    }
    // Setup authentication
    (0, auth_1.setupAuth)(app);
    // Environment-specific setup
    if (isElectron) {
        // Electron-specific setup
        (0, vite_1.log)('Setting up for Electron environment');
        // Electron-specific routes or configuration here
        app.get('/api/environment', (req, res) => {
            res.json({
                environment: 'electron',
                version: process.env.npm_package_version || 'unknown'
            });
        });
    }
    else {
        // Web/Replit-specific setup
        (0, vite_1.log)('Setting up for Web/Replit environment');
        // Web-specific routes or configuration here
        app.get('/api/environment', (req, res) => {
            res.json({
                environment: isReplit ? 'replit' : 'web',
                version: process.env.npm_package_version || 'unknown'
            });
        });
    }
    // Register API routes
    const server = await (0, routes_1.registerRoutes)(app);
    // Error handling middleware
    app.use((err, _req, res, _next) => {
        (0, vite_1.log)(`Error: ${err.message}`, 'error');
        res.status(err.status || 500).json({
            error: {
                message: err.message,
                status: err.status || 500
            }
        });
    });
    // Only setup Vite or static files if in web mode
    if (!isElectron) {
        // Force development mode in Replit or if NODE_ENV is development
        if (isReplit || process.env.NODE_ENV === 'development') {
            // Ensure we're in development mode
            process.env.NODE_ENV = 'development';
            try {
                await (0, vite_1.setupVite)(app, server);
            }
            catch (err) {
                (0, vite_1.log)(`Vite setup error: ${err instanceof Error ? err.message : String(err)}`, 'error');
                // Provide a basic route for development
                app.get('*', (req, res) => {
                    if (req.path.startsWith('/api')) {
                        // Let API requests pass through
                        return res.status(404).json({ error: 'API endpoint not found' });
                    }
                    // Simple HTML for all other routes in development
                    res.send(`
            <html>
              <head>
                <title>Development Mode</title>
                <style>
                  body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                  h1 { color: #333; }
                  .box { background-color: #f0f0f0; padding: 15px; border-radius: 5px; }
                </style>
              </head>
              <body>
                <h1>Development Mode Active</h1>
                <div class="box">
                  <p>The application is running in development mode.</p>
                  <p>Client-side Vite is available at <a href="http://localhost:5173">http://localhost:5173</a></p>
                  <p>API server is running on this instance.</p>
                </div>
              </body>
            </html>
          `);
                });
            }
        }
        else {
            // If in production, serve static files
            try {
                (0, vite_1.serveStatic)(app);
            }
            catch (err) {
                (0, vite_1.log)(`Static serving error: ${err instanceof Error ? err.message : String(err)}`, 'error');
                // Handle the error when static files aren't available
                app.get('*', (req, res) => {
                    if (req.path.startsWith('/api')) {
                        // Let API requests pass through
                        return res.status(404).json({ error: 'API endpoint not found' });
                    }
                    res.status(500).send(`
            <html>
              <head>
                <title>App Error</title>
                <style>
                  body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                  h1 { color: #c00; }
                  .box { background-color: #fff0f0; padding: 15px; border-radius: 5px; border: 1px solid #ffcccc; }
                </style>
              </head>
              <body>
                <h1>Application Error</h1>
                <div class="box">
                  <p>The application could not serve static files.</p>
                  <p>Error: ${err instanceof Error ? err.message : String(err)}</p>
                  <p>Please build the client application first.</p>
                </div>
              </body>
            </html>
          `);
                });
            }
        }
    }
    return { app, server };
}

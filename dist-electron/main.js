"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const encryption_1 = require("./encryption");
const storage_1 = require("./storage");
// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) {
    electron_1.app.quit();
}
let mainWindow = null;
let tray = null;
let isQuitting = false;
// Create the main application window
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            preload: path_1.default.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: true,
        },
        frame: false, // Frameless window for custom title bar
        icon: path_1.default.join(__dirname, 'icons', 'icon.png'),
    });
    // Determine if we’re in development
    const isDev = process.env.NODE_ENV !== 'production';
    const url = isDev
        ? 'http://localhost:5173'
        : `file://${path_1.default.join(__dirname, '..', 'dist', 'index.html')}`;
    mainWindow.loadURL(url);
    // Open DevTools in development
    if (isDev) {
        mainWindow.webContents.openDevTools();
    }
    // Handle window closing
    mainWindow.on('close', (event) => {
        if (!isQuitting) {
            event.preventDefault();
            mainWindow?.hide();
            return false;
        }
        return true;
    });
    // IPC handlers for window controls
    electron_1.ipcMain.handle('window-minimize', () => {
        mainWindow?.minimize();
    });
    electron_1.ipcMain.handle('window-maximize', () => {
        if (mainWindow?.isMaximized()) {
            mainWindow.unmaximize();
        }
        else {
            mainWindow?.maximize();
        }
    });
    electron_1.ipcMain.handle('window-close', () => {
        mainWindow?.hide();
    });
    // Handle version info
    electron_1.ipcMain.handle('app-get-version', () => {
        return electron_1.app.getVersion();
    });
    // Handle system info
    electron_1.ipcMain.handle('get-system-info', () => {
        const os = require('os');
        return {
            platform: process.platform,
            arch: process.arch,
            version: process.version,
            memory: {
                total: os.totalmem(),
                free: os.freemem()
            }
        };
    });
    // Handle connectivity check
    electron_1.ipcMain.handle('is-online', async () => {
        const dns = require('dns').promises;
        try {
            await dns.lookup('google.com');
            return true;
        }
        catch {
            return false;
        }
    });
    // Handle notifications
    electron_1.ipcMain.handle('show-notification', (_event, title, body) => {
        const notification = new electron_1.Notification({
            title,
            body,
            icon: path_1.default.join(__dirname, 'icons', 'icon.png'),
        });
        notification.show();
        return true;
    });
    // Initialize the application tray
    createTray();
    // Initialize modules
    (0, storage_1.initStorage)();
    (0, encryption_1.initEncryption)();
}
// Create the application tray icon and menu
function createTray() {
    const icon = electron_1.nativeImage.createFromPath(path_1.default.join(__dirname, 'icons', 'icon.png'));
    tray = new electron_1.Tray(icon.resize({ width: 16, height: 16 }));
    const contextMenu = electron_1.Menu.buildFromTemplate([
        {
            label: 'Open Nexus Messaging',
            click: () => {
                mainWindow?.show();
            }
        },
        { type: 'separator' },
        {
            label: 'Quit',
            click: () => {
                isQuitting = true;
                electron_1.app.quit();
            }
        },
    ]);
    tray.setToolTip('Nexus Corporate Messaging');
    tray.setContextMenu(contextMenu);
    tray.on('click', () => {
        mainWindow?.show();
    });
}
// App is ready to start
electron_1.app.whenReady().then(() => {
    // Create the main window
    createWindow();
    // On macOS, it's common to re-create a window when the dock icon is clicked
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
        else {
            mainWindow?.show();
        }
    });
});
// Quit when all windows are closed, except on macOS
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
// Handle app quitting (for tray icon)
electron_1.app.on('before-quit', () => {
    isQuitting = true;
});

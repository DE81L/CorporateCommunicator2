"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const url_1 = __importDefault(require("url"));
const encryption_1 = require("./encryption");
const storage_1 = require("./storage");
// Environment and configuration
const isDev = process.env.NODE_ENV === "development";
const i18n = require("./i18n.cjs");
let mainWindow = null;
let tray = null;
let isQuitting = false;
async function createWindow() {
    console.log('Creating Electron window...');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('isDev:', isDev);
    mainWindow = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            preload: path_1.default.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
        frame: false,
        icon: path_1.default.join(__dirname, 'icons', 'icon.png'),
    });
    // Load the app
    const startUrl = isDev
        ? 'http://localhost:5173' // Vite dev server
        : url_1.default.format({
            pathname: path_1.default.join(__dirname, '../client/dist/index.html'),
            protocol: 'file:',
            slashes: true,
        });
    console.log('Loading URL:', startUrl);
    await mainWindow.loadURL(startUrl);
    if (isDev) {
        mainWindow.webContents.openDevTools();
    }
    // Window management handlers
    electron_1.ipcMain.handle('window-minimize', () => mainWindow?.minimize());
    electron_1.ipcMain.handle('window-maximize', () => {
        if (mainWindow?.isMaximized()) {
            mainWindow.unmaximize();
        }
        else {
            mainWindow?.maximize();
        }
    });
    electron_1.ipcMain.handle('app-quit', () => { electron_1.app.quit(); });
    electron_1.ipcMain.handle('window-close', () => mainWindow?.hide());
    // System information handlers
    electron_1.ipcMain.handle('app-get-version', () => electron_1.app.getVersion());
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
    // Online status check
    electron_1.ipcMain.handle('is-online', () => {
        return require('dns').promises.lookup('google.com')
            .then(() => true)
            .catch(() => false);
    });
    // Notification handler
    electron_1.ipcMain.handle('show-notification', (_event, title, body) => {
        new electron_1.Notification({
            title,
            body,
            icon: path_1.default.join(__dirname, 'icons', 'icon.png')
        }).show();
        return true;
    });
    // Window close handler
    mainWindow.on('close', (event) => {
        if (!isQuitting) {
            event.preventDefault();
            mainWindow?.hide();
        }
    });
    console.log('Electron window created successfully');
}
function createTray() {
    console.log('Creating system tray icon...');
    const icon = electron_1.nativeImage.createFromPath(path_1.default.join(__dirname, 'icons', 'icon.png'));
    tray = new electron_1.Tray(icon.resize({ width: 16, height: 16 }));
    const contextMenu = electron_1.Menu.buildFromTemplate([
        {
            label: i18n.t('tray.open'),
            click: () => mainWindow?.show()
        },
        { type: 'separator' },
        {
            label: i18n.t('tray.quit'),
            click: () => {
                isQuitting = true;
                electron_1.app.quit();
            }
        },
    ]);
    tray.setToolTip(i18n.t('app.name'));
    tray.setContextMenu(contextMenu);
    tray.on('click', () => mainWindow?.show());
    console.log('System tray icon created successfully');
}
// App initialization
electron_1.app.whenReady().then(async () => {
    console.log('Запуск приложения...');
    // Initialize core modules
    (0, encryption_1.initEncryption)();
    (0, storage_1.initStorage)();
    // Create window and tray
    await createWindow();
    createTray();
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('before-quit', () => {
    isQuitting = true;
});

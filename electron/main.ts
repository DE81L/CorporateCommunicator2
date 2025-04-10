import { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage, Notification } from 'electron';
import path from "path";
import url from "url";
import { initEncryption } from './encryption';
import { initStorage } from './storage';
import { connectToDb } from '../server/db';
import { setupAuth } from '../server/auth';
import { registerRoutes } from '../server/routes';
import { setupVite, serveStatic } from '../server/vite';

// Environment and configuration
const isDev = process.env.NODE_ENV === "development";
const i18n = require("./i18n.cjs");

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

async function createWindow() {
  console.log('Creating Electron window...');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('isDev:', isDev);

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    frame: false,
    icon: path.join(__dirname, 'icons', 'icon.png'),
  });

  // Load the app
  const startUrl = isDev
    ? 'http://localhost:5173' // Vite dev server
    : url.format({
        pathname: path.join(__dirname, '../client/dist/index.html'),
        protocol: 'file:',
        slashes: true,
      });

  console.log('Loading URL:', startUrl);
  await mainWindow.loadURL(startUrl);
  
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Window management handlers
  ipcMain.handle('window-minimize', () => mainWindow?.minimize());
  ipcMain.handle('window-maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });
  ipcMain.handle('app-quit',    () => { app.quit(); });
  ipcMain.handle('window-close', () => mainWindow?.hide());

  // System information handlers
  ipcMain.handle('app-get-version', () => app.getVersion());
  ipcMain.handle('get-system-info', () => {
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
  ipcMain.handle('is-online', () => {
    return require('dns').promises.lookup('google.com')
      .then(() => true)
      .catch(() => false);
  });

  // Notification handler
  ipcMain.handle('show-notification', (_event, title, body) => {
    new Notification({ 
      title, 
      body,
      icon: path.join(__dirname, 'icons', 'icon.png')
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
  
  const icon = nativeImage.createFromPath(path.join(__dirname, 'icons', 'icon.png'));
  tray = new Tray(icon.resize({ width: 16, height: 16 }));
  
  const contextMenu = Menu.buildFromTemplate([
    { 
      label: i18n.t('tray.open'), 
      click: () => mainWindow?.show()
    },
    { type: 'separator' },
    { 
      label: i18n.t('tray.quit'), 
      click: () => {
        isQuitting = true;
        app.quit();
      }
    },
  ]);
  
  tray.setToolTip(i18n.t('app.name'));
  tray.setContextMenu(contextMenu);
  tray.on('click', () => mainWindow?.show());

  console.log('System tray icon created successfully');
}

// App initialization
app.whenReady().then(async () => {
  console.log('Запуск приложения...');
  
  // Initialize core modules
  initEncryption();
  initStorage();
  
  // Create window and tray
  await createWindow();
  createTray();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
});

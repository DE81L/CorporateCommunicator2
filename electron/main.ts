// Main process for Electron app

import { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage, Notification } from 'electron';
import path from 'path';
import { initEncryption } from './encryption';
import { initStorage } from './storage';

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

// Create the main application window
function createWindow() {
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
    frame: false, // Frameless window for custom title bar
    icon: path.join(__dirname, 'icons', 'icon.png'),
  });

  // Load the app URL
  const isDev = process.env.NODE_ENV !== 'production';
  const url = isDev
    ? 'http://localhost:5000'
    : `file://${path.join(__dirname, '..', 'client', 'dist', 'index.html')}`;

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
  ipcMain.handle('window-minimize', () => {
    mainWindow?.minimize();
  });

  ipcMain.handle('window-maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });

  ipcMain.handle('window-close', () => {
    mainWindow?.hide();
  });

  // Handle version info
  ipcMain.handle('app-get-version', () => {
    return app.getVersion();
  });
  
  // Handle system info
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
  
  // Handle connectivity check
  ipcMain.handle('is-online', () => {
    // Simple connectivity check - in production this would be more robust
    return require('dns').promises.lookup('google.com')
      .then(() => true)
      .catch(() => false);
  });
  
  // Handle notifications
  ipcMain.handle('show-notification', (_event, title, body) => {
    const notification = new Notification({ 
      title, 
      body,
      icon: path.join(__dirname, 'icons', 'icon.png')
    });
    notification.show();
    return true;
  });

  // Initialize the application tray
  createTray();
}

// Create the application tray icon and menu
function createTray() {
  const icon = nativeImage.createFromPath(path.join(__dirname, 'icons', 'icon.png'));
  tray = new Tray(icon.resize({ width: 16, height: 16 }));
  
  const contextMenu = Menu.buildFromTemplate([
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
        app.quit();
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
app.whenReady().then(() => {
  // Initialize encryption and storage modules
  initEncryption();
  initStorage();
  
  // Create the main window
  createWindow();

  // On macOS, it's common to re-create a window when the dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else {
      mainWindow?.show();
    }
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle app quitting (for tray icon)
app.on('before-quit', () => {
  isQuitting = true;
});
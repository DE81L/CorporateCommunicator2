/**
 * Electron Main Process
 * 
 * This file is the entry point for Electron applications running in desktop mode.
 * It contains environment detection to ensure it only runs when Electron is available.
 */

// Conditionally try to load Electron
let electron;
try {
  electron = require('electron');
  if (!electron) {
    console.error('Electron package exists but failed to load. Running in compatibility mode.');
    process.exit(0);
  }
} catch (err) {
  console.error('Electron not available. Running in compatibility mode.', err.message);
  process.exit(0);
}

// If we get here, Electron is available
const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage } = electron;
const path = require('path');
const url = require('url');
const isDev = process.env.NODE_ENV === 'development';
const i18n = require('./i18n.cjs');

// Set environment variable to inform other parts this is Electron
process.env.ELECTRON = 'true';

let mainWindow;
let tray;

function createWindow() {
  console.log('Creating Electron window...');
  console.log('Environment variables:', {
    NODE_ENV: process.env.NODE_ENV,
    ELECTRON: process.env.ELECTRON,
    isDev: isDev
  });

  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, '../generated-icon.png'),
  });

  console.log(i18n.t('startingApp'));

  // Load the app
  const startUrl = isDev
    ? 'http://localhost:5173' // Vite dev server
    : url.format({
        pathname: path.join(__dirname, '../client/dist/index.html'),
        protocol: 'file:',
        slashes: true,
      });

  console.log('Loading URL:', startUrl);

  mainWindow.loadURL(startUrl);

  // Add debugging logs
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load URL:', {
      url: startUrl,
      errorCode,
      errorDescription,
      isDev
    });
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page loaded successfully');
  });

  // Add these logs before the if statement that checks isDev
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('isDev:', isDev);

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Emitted when the window is closed
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
  
  mainWindow.once('ready-to-show', () => {
    console.log(i18n.t('windowCreated'));
  });

  console.log('Electron window created successfully');
}

function createTray() {
  console.log('Creating system tray icon...');
  
  const iconPath = path.join(__dirname, '../generated-icon.png');
  tray = new Tray(nativeImage.createFromPath(iconPath));
  
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show App', click: () => mainWindow.show() },
    { label: 'Quit', click: () => app.quit() },
  ]);
  
  tray.setToolTip('Corporate Messenger');
  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
      }
    }
  });
  
  console.log('System tray icon created successfully');
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
  try {
    console.log(i18n.t('serverRunning', { port: process.env.PORT || 3000 }));
    createWindow();
    createTray();
    
    app.on('activate', function () {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  } catch (error) {
    console.error(i18n.t('errorStarting'), error);
  }
});

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', function () {
  console.log(i18n.t('shuttingDown'));
  if (process.platform !== 'darwin') app.quit();
});

// Handle any IPC messages here
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// Platform check API
ipcMain.handle('get-platform-info', () => {
  return {
    platform: process.platform,
    arch: process.arch,
    version: process.version,
    electron: process.versions.electron,
    chrome: process.versions.chrome,
  };
});

// Add IPC handlers for i18n
ipcMain.handle('change-language', async (event, lang) => {
  await i18n.changeLanguage(lang);
  return i18n.language;
});

ipcMain.handle('get-current-language', () => {
  return i18n.language;
});
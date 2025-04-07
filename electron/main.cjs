const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, '../client/public/icon.png')
  });

  // Register IPC handlers with the names used in the renderer
  ipcMain.handle('get-app-version', () => {
    return app.getVersion();
  });

  ipcMain.handle('is-online', async () => {
    const dns = require('dns').promises;
    try {
      await dns.lookup('google.com');
      return true;
    } catch {
      return false;
    }
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../client/dist/index.html'));
  }
}

app.whenReady().then(createWindow);
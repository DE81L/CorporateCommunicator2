import { createRequire } from 'module';
import type { IpcMainEvent } from 'electron';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { app, BrowserWindow, ipcMain } = require('electron');

let mainWindow: Electron.BrowserWindow | null = null;
function createMainWindow() {
  mainWindow = new BrowserWindow({ 
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // dev‑vs‑prod загрузка
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // подписки – только ПОСЛЕ создания окна
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/** IPC пример ─ безопасно, ipcMain точно существует */
ipcMain.on('ping', (event: IpcMainEvent, msg: any) => {
  console.log('Ping from renderer:', msg);
  event.reply('pong', '🤖');
});

app.whenReady().then(createMainWindow);

// macOS / общего назначения обработчики
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createMainWindow();
});

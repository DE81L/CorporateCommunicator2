import { app, BrowserWindow, ipcMain, IpcMainEvent } from 'electron';
import path from 'node:path';

let mainWindow: Electron.BrowserWindow | null = null;
const isDev = !!process.env.VITE_DEV_SERVER_URL;
function createMainWindow() {
  // создаём окно и запоминаем его в локальной переменной
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: isDev
        ? path.join(__dirname, 'preload.ts')
        : path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // обновляем глобальную ссылку — нам нужен доступ из других мест (activate)
  mainWindow = win;

  // dev-vs-prod загрузка
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, './renderer/index.html'));
  }

  // подписка на событие закрытия
  win.on('closed', () => {
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

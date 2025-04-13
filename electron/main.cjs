const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

const users = ['user1', 'user2'];   // ← hard‑coded accounts
const windows = new Map();          // user → BrowserWindow
let chat = [];                      // [{from, text, ts}]

function createWin(username, x) {
  const win = new BrowserWindow({
    width: 400, height: 600, x, y: 50,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });
  win.loadURL(process.env.VITE_DEV_SERVER_URL || `file://${__dirname}/../dist/public/index.html`);
  win.webContents.once('did-finish-load', () => {
    win.webContents.send('bootstrap', { username, chat });
  });
  windows.set(username, win);
}

app.whenReady().then(() => {
  createWin('user1', 50);
  createWin('user2', 500);
});

ipcMain.on('send-msg', (_e, msg) => {
  chat.push(msg);                       // save in RAM
  windows.forEach(w => w.webContents.send('new-msg', msg));
});

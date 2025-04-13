const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

const windows = new Map();
let chat = [];

function createWindow(username, x) {
  const win = new BrowserWindow({
    width: 400,
    height: 600,
    x,
    y: 50,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else if (!app.isPackaged) {
    // In development: load from Vite dev server
    win.loadURL('http://localhost:5173');
  } else {
    // In production: load the index.html from the build
    win.loadFile(path.join(__dirname, '../client/dist/index.html'));
  }

  // When the page has finished loading, send the username and chat history
  win.webContents.once('did-finish-load', () => {
    win.webContents.send('bootstrap', { username, chat });
  });
  windows.set(username, win);
}

app.whenReady().then(() => { createWindow('user1', 50); createWindow('user2', 500); });

ipcMain.on('send-msg', (_event, msg) => {
  // Save message and broadcast to all windows
  chat.push(msg);
  windows.forEach((win) => win.webContents.send('new-msg', msg));
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

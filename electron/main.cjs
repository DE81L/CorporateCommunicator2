const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

let windows = [];          // keep track of every open chat window

function createChatWindow(username) {
  const win = new BrowserWindow({
    width: 1100,
    height: 700,
    title: `Nexus – ${username}`,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    }
  });

  // pass the hard‑coded user in the URL so the renderer can read it
  win.loadURL(`http://localhost:5173/?user=${username}`);

  win.on('closed', () => {
    windows = windows.filter(w => w !== win);
  });
  windows.push(win);
}

/* ---------- bootstrap ---------- */
app.whenReady().then(() => {
  createChatWindow('user1');
  createChatWindow('user2');
});

/* ---------- IPC message bus ---------- */
ipcMain.on('send-message', (_evt, payload) => {
  // broadcast to every renderer, including the sender
  windows.forEach(w => w.webContents.send('receive-message', payload));
});

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
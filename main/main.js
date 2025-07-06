import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
const isDev = !app.isPackaged;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
    
function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('save-graph', async (event, data) => {
  const { filePath } = await dialog.showSaveDialog({
    filters: [{ name: 'Graph Files', extensions: ['json', 'graph'] }],
  });
  if (filePath) {
    require('fs').writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  }
  return false;
});

ipcMain.handle('load-graph', async () => {
  const { filePaths } = await dialog.showOpenDialog({
    filters: [{ name: 'Graph Files', extensions: ['json', 'graph'] }],
    properties: ['openFile'],
  });
  if (filePaths && filePaths[0]) {
    const data = require('fs').readFileSync(filePaths[0]);
    return JSON.parse(data);
  }
  return null;
});

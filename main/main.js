import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Enable live reload for development
if (process.env.NODE_ENV === 'development') {
  try {
    require('electron-reload')(__dirname, {
      electron: path.join(__dirname, '..', 'node_modules', '.bin', 'electron'),
      hardResetMethod: 'exit'
    });
  } catch (e) {
    console.log('electron-reload not available');
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: false // Allow local file access
    },
    icon: path.join(__dirname, '../public/icon.png'), // Add icon if available
    show: false // Don't show until ready
  });

  // Show window when ready to prevent visual flash
  win.once('ready-to-show', () => {
    win.show();
    
    // Open DevTools in development
    if (process.env.NODE_ENV === 'development' || process.env.ELECTRON_ENV === 'dev') {
      win.webContents.openDevTools();
    }
  });

  // Load the appropriate URL/file
  if (process.env.ELECTRON_ENV === 'dev') {
    win.loadURL('http://localhost:5173');
    
    // Reload the window if the dev server is not ready
    win.webContents.on('did-fail-load', () => {
      setTimeout(() => {
        win.loadURL('http://localhost:5173');
      }, 1000);
    });
  } else {
    // In production, load the built files
    const indexPath = path.join(__dirname, '../dist/index.html');
    console.log('Loading file:', indexPath);
    win.loadFile(indexPath);
  }

  // Handle window closed
  win.on('closed', () => {
    // Dereference the window object
  });
}

app.whenReady().then(() => {
  createWindow();

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

// IPC handlers for file operations
ipcMain.handle('save-graph', async (event, data) => {
  try {
    const { filePath } = await dialog.showSaveDialog({
      filters: [{ name: 'Graph Files', extensions: ['json', 'graph'] }],
      defaultPath: 'graph.json'
    });
    
    if (filePath) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      return { success: true, path: filePath };
    }
    return { success: false, error: 'No file selected' };
  } catch (error) {
    console.error('Save error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('load-graph', async () => {
  try {
    const { filePaths } = await dialog.showOpenDialog({
      filters: [{ name: 'Graph Files', extensions: ['json', 'graph'] }],
      properties: ['openFile']
    });
    
    if (filePaths && filePaths[0]) {
      const data = fs.readFileSync(filePaths[0], 'utf8');
      return { success: true, data: JSON.parse(data) };
    }
    return { success: false, error: 'No file selected' };
  } catch (error) {
    console.error('Load error:', error);
    return { success: false, error: error.message };
  }
});

// Handle app ready
app.on('ready', () => {
  console.log('Electron app is ready');
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    console.log('Prevented new window creation for:', navigationUrl);
  });
});

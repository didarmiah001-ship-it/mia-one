const { app, BrowserWindow, shell, Menu, nativeTheme } = require('electron');
const path = require('path');
const Store = require('electron-store');

nativeTheme.themeSource = 'dark';

const store = new Store({
  defaults: {
    windowBounds: { width: 1440, height: 900 },
    windowMaximized: false,
  },
});

let mainWindow = null;

function getAdminPath() {
  if (app.isPackaged) {
    // In packaged app, web assets are in resources/dist/admin/
    return path.join(process.resourcesPath, 'dist', 'admin', 'index.html');
  }
  // In development, load from built dist/
  return path.join(__dirname, '..', 'dist', 'admin', 'index.html');
}

function createWindow() {
  const { width, height } = store.get('windowBounds');
  const maximized = store.get('windowMaximized');

  mainWindow = new BrowserWindow({
    width,
    height,
    minWidth: 1024,
    minHeight: 700,
    title: 'MIA Admin',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    backgroundColor: '#0A0A0F',
    // Native frame with hidden menu bar for clean look
    autoHideMenuBar: true,
    // Don't show until content is loaded (prevents white flash)
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      // Required to load local file:// URLs properly
      webSecurity: true,
      // Allow Supabase HTTPS requests from file:// origin
      allowRunningInsecureContent: false,
    },
  });

  // Remove default application menu entirely
  Menu.setApplicationMenu(null);

  const adminPath = getAdminPath();
  mainWindow.loadFile(adminPath).catch(err => {
    console.error('Failed to load admin app:', err);
    // Show error page
    mainWindow.loadURL(`data:text/html,<h1 style="font-family:sans-serif;color:#fff;background:#0A0A0F;padding:40px">
      <b>MIA Admin</b><br><br>
      Could not load the admin panel.<br><br>
      <code style="font-size:12px;color:#888">${err.message}</code><br><br>
      Run <code>npm run build</code> in the project root first.
    </h1>`);
  });

  // Show window once page is ready (no white flash)
  mainWindow.once('ready-to-show', () => {
    if (maximized) {
      mainWindow.maximize();
    }
    mainWindow.show();
    mainWindow.focus();
  });

  // Save window size/position on close
  mainWindow.on('close', () => {
    if (!mainWindow.isMaximized()) {
      store.set('windowBounds', mainWindow.getBounds());
    }
    store.set('windowMaximized', mainWindow.isMaximized());
  });

  // Open external links in default browser, not in Electron
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http') || url.startsWith('https')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Keep app title as "MIA Admin" even when page title changes
  mainWindow.webContents.on('page-title-updated', (event) => {
    event.preventDefault();
  });
}

// Single-instance lock — prevent multiple windows
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on('window-all-closed', () => {
  app.quit();
});

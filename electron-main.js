const { app, BrowserWindow, globalShortcut, Tray, Menu } = require('electron');
const path = require('path');

let mainWindow;
let tray;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false, // Start hidden to wait for hotkey
    frame: false, // Borderless window for HUD aesthetic
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    // macOS specific styling options to make it look sleek
    titleBarStyle: 'hiddenInset',
    transparent: true,
    backgroundColor: '#00000000', // Ensures transparency
    alwaysOnTop: true, // HUD should hover over everything
    skipTaskbar: true, // Do not show in the standard alt-tab / taskbar to emulate Spotlight
  });

  // Load the Next.js local server
  mainWindow.loadURL('http://localhost:3000');

  // Once ready to show, if we wanted to show it immediately we could:
  // mainWindow.once('ready-to-show', () => {
  //   mainWindow.show();
  // });

  mainWindow.on('blur', () => {
    // Hide the window when the user clicks away, similar to Raycast/Spotlight
    mainWindow.hide();
  });
}

function createTray() {
  try {
    // You would replace this with a real icon
    // Using a simple native tray icon representation
    tray = new Tray(path.join(__dirname, 'public/favicon.ico'));
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Open Command Center', click: () => showAndCenterWindow() },
      { type: 'separator' },
      { label: 'Quit', click: () => {
        app.isQuitting = true;
        app.quit();
      }}
    ]);
    tray.setToolTip('Antigravity Command Center');
    tray.setContextMenu(contextMenu);

    tray.on('click', () => showAndCenterWindow());
  } catch (e) {
    console.error("Failed to create tray (might be missing icon)", e);
  }
}

function showAndCenterWindow() {
  if (mainWindow) {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.center();
      mainWindow.show();
      mainWindow.focus();
    }
  }
}

// When Electron has finished initializing
app.whenReady().then(() => {
  createWindow();
  createTray();

  // Register a global shortcut to pop the HUD
  // Example: CommandOrControl+Shift+Space
  const ret = globalShortcut.register('CommandOrControl+Shift+Space', () => {
    showAndCenterWindow();
  });

  if (!ret) {
    console.log('Global shortcut registration failed');
  } else {
    console.log('Global shortcut [Ctrl+Shift+Space] registered successfully.');
  }

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Unregister all shortcuts before quitting
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

import { app, BrowserWindow, ipcMain, Menu, session, shell, type IpcMainInvokeEvent } from 'electron';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/** Canal IPC único que expone el proceso principal. */
const IPC_GET_APP_INFO = 'app:get-info';

const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;
const isDev = Boolean(DEV_SERVER_URL) && !app.isPackaged;

const RENDERER_INDEX = path.join(__dirname, '..', 'dist', 'index.html');
const ICON_PATH = path.join(__dirname, '..', 'build', 'icon.png');

// Las pruebas automáticas usan un perfil aislado para no mezclar partidas guardadas.
const TEST_USER_DATA = process.env.TABLA_PERIODICA_USER_DATA;
if (TEST_USER_DATA && path.isAbsolute(TEST_USER_DATA)) {
  app.setPath('userData', TEST_USER_DATA);
}

let mainWindow: BrowserWindow | null = null;

/** Solo se admite como servidor de desarrollo una URL local de Vite. */
function isAllowedDevUrl(url: string | undefined): url is string {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' && (parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost');
  } catch {
    return false;
  }
}

/** Comprueba que una URL pertenece a la propia aplicación (archivo local o servidor de desarrollo). */
function isAppUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'file:') {
      return parsed.href.startsWith(pathToFileURL(path.join(__dirname, '..', 'dist')).href);
    }
    if (isDev && isAllowedDevUrl(DEV_SERVER_URL)) {
      return parsed.origin === new URL(DEV_SERVER_URL).origin;
    }
    return false;
  } catch {
    return false;
  }
}

/** Solo se responde a mensajes IPC procedentes del marco principal de nuestra ventana. */
function isTrustedSender(event: IpcMainInvokeEvent): boolean {
  const frame = event.senderFrame;
  return Boolean(
    mainWindow &&
      event.sender === mainWindow.webContents &&
      frame &&
      frame === mainWindow.webContents.mainFrame &&
      isAppUrl(frame.url),
  );
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    title: app.getName(),
    backgroundColor: '#f6f6f3',
    icon: ICON_PATH,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      nodeIntegrationInWorker: false,
      nodeIntegrationInSubFrames: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      webviewTag: false,
      spellcheck: false,
      devTools: isDev,
    },
  });

  mainWindow.once('ready-to-show', () => mainWindow?.show());
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Ninguna navegación fuera de la aplicación ni ventanas emergentes.
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!isAppUrl(url)) event.preventDefault();
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) void shell.openExternal(url);
    return { action: 'deny' };
  });

  if (isDev && isAllowedDevUrl(DEV_SERVER_URL)) {
    void mainWindow.loadURL(DEV_SERVER_URL);
  } else {
    void mainWindow.loadFile(RENDERER_INDEX);
  }
}

function hardenSession(): void {
  // La aplicación no necesita cámara, micrófono, notificaciones ni ningún otro permiso.
  session.defaultSession.setPermissionRequestHandler((_wc, _permission, callback) => callback(false));
  session.defaultSession.setPermissionCheckHandler(() => false);

  // Bloquea cualquier petición de red externa: todo se sirve desde archivos locales.
  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    const url = details.url;
    const local =
      url.startsWith('file:') ||
      url.startsWith('data:') ||
      url.startsWith('blob:') ||
      url.startsWith('devtools:') ||
      (isDev && isAllowedDevUrl(DEV_SERVER_URL) && (url.startsWith(DEV_SERVER_URL) || url.startsWith('ws://127.0.0.1:5173')));
    callback({ cancel: !local });
  });
}

ipcMain.handle(IPC_GET_APP_INFO, (event) => {
  if (!isTrustedSender(event)) {
    throw new Error('Remitente IPC no autorizado');
  }
  return {
    name: app.getName(),
    version: app.getVersion(),
    platform: process.platform,
  };
});

app.on('web-contents-created', (_event, contents) => {
  contents.on('will-attach-webview', (event) => event.preventDefault());
});

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

  void app.whenReady().then(() => {
    if (process.platform !== 'darwin') Menu.setApplicationMenu(null);
    hardenSession();
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

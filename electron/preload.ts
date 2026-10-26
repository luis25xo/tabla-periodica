import { contextBridge, ipcRenderer } from 'electron';

/**
 * API mínima y de solo lectura expuesta al renderer.
 * No se expone ipcRenderer ni ninguna API de Node.js directamente.
 */
interface AppInfo {
  name: string;
  version: string;
  platform: string;
}

function isAppInfo(value: unknown): value is AppInfo {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.name === 'string' && typeof v.version === 'string' && typeof v.platform === 'string';
}

contextBridge.exposeInMainWorld('desktop', {
  isDesktop: true,
  getAppInfo: async (): Promise<AppInfo | null> => {
    const info: unknown = await ipcRenderer.invoke('app:get-info');
    return isAppInfo(info) ? info : null;
  },
});

/// <reference types="vite/client" />

declare const __PRODUCT_NAME__: string;
declare const __APP_VERSION__: string;

interface DesktopApi {
  isDesktop: true;
  getAppInfo: () => Promise<{ name: string; version: string; platform: string } | null>;
}

interface Window {
  /** API expuesta por electron/preload.ts (solo existe dentro de Electron). */
  desktop?: DesktopApi;
}

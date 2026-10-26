import { _electron as electron, expect, type ElectronApplication, type Locator, type Page } from '@playwright/test';
import { getElement } from '../../src/data/elements';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

export const ROOT = resolve(__dirname, '..', '..');

export interface LaunchedApp {
  app: ElectronApplication;
  page: Page;
  consoleErrors: string[];
  requests: string[];
  close: () => Promise<void>;
}

/** Lanza la aplicación compilada (dist/ y dist-electron/) con un perfil de usuario aislado. */
export async function launchApp(extraEnv: Record<string, string> = {}, userDataDir?: string): Promise<LaunchedApp> {
  const userData = userDataDir ?? mkdtempSync(join(tmpdir(), 'tabla-periodica-e2e-'));
  const env: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (v !== undefined && k !== 'VITE_DEV_SERVER_URL' && k !== 'ELECTRON_RUN_AS_NODE') env[k] = v;
  }
  Object.assign(env, { TABLA_PERIODICA_USER_DATA: userData }, extraEnv);

  const app = await electron.launch({ args: ['.'], cwd: ROOT, env });
  const page = await app.firstWindow();
  const consoleErrors: string[] = [];
  const requests: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`));
  page.on('request', (req) => requests.push(req.url()));
  await page.waitForLoadState('domcontentloaded');

  return {
    app,
    page,
    consoleErrors,
    requests,
    close: async () => {
      await app.close();
      if (!userDataDir) rmSync(userData, { recursive: true, force: true });
    },
  };
}

export async function startNewGame(page: Page) {
  await page.getByTestId('new-game-button').click();
  await page.getByTestId('placed-count').waitFor();
}

/** Ficha de la cinta completamente visible dentro del mostrador. */
export async function visibleBeltTileId(page: Page, exclude: string[] = []): Promise<string> {
  return page.evaluate((excluded) => {
    const viewport = document.querySelector('.belt-viewport')!.getBoundingClientRect();
    const tiles = Array.from(document.querySelectorAll<HTMLElement>('[data-belt-tile="true"]:not(.is-lifted)'));
    const visible = tiles
      .map((t) => ({ id: t.dataset.elementId!, r: t.getBoundingClientRect() }))
      .filter(({ id, r }) => !excluded.includes(id) && r.left > viewport.left + 60 && r.right < viewport.right - 200)
      .sort((a, b) => a.r.left - b.r.left);
    if (!visible.length) throw new Error('No hay fichas visibles');
    return visible[0].id;
  }, exclude);
}

export async function tileX(page: Page, id: string): Promise<number> {
  const box = await page.locator(`[data-belt-tile="true"][data-element-id="${id}"]`).boundingBox();
  if (!box) throw new Error(`Ficha ${id} sin caja`);
  return box.x;
}

/** La casilla muestra el símbolo químico y el nombre del elemento colocado. */
export async function expectCellFace(page: Page, cellKey: string, id: string) {
  const element = getElement(id)!;
  const cell = page.locator(`[data-cell-key="${cellKey}"]`);
  await expect(cell.locator('.cell-symbol')).toHaveText(element.symbol);
  await expect(cell.locator('.cell-name')).toHaveText(element.name);
}

/** Arrastra con el ratón (Pointer Events reales) desde una ficha del mostrador hasta una casilla. */
export async function dragTileToCell(page: Page, id: string, cellKey: string) {
  await dragLocatorToCell(page, page.locator(`[data-belt-tile="true"][data-element-id="${id}"]`), cellKey);
}

export async function dragLocatorToCell(page: Page, tile: Locator, cellKey: string) {
  const from = await tile.boundingBox();
  const to = await page.locator(`[data-cell-key="${cellKey}"]`).boundingBox();
  if (!from || !to) throw new Error('Sin cajas para arrastrar');
  const startX = from.x + from.width / 2;
  const startY = from.y + from.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  // Se saca la ficha hacia arriba; un gesto horizontal movería el mostrador.
  const liftY = startY - 40;
  await page.mouse.move(startX, startY - 20);
  await page.mouse.move(startX, liftY);
  const steps = 12;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    await page.mouse.move(startX + (to.x + to.width / 2 - startX) * t, liftY + (to.y + to.height / 2 - liftY) * t);
  }
  await page.mouse.up();
}

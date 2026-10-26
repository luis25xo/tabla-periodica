import { chromium, devices, expect, test, type Browser, type Page } from '@playwright/test';
import { preview, type PreviewServer } from 'vite';
import { ROOT } from './helpers';

/**
 * Versión web en un teléfono (Pixel 7 emulado) con el Google Chrome instalado.
 * Requiere `npm run build` previo (lo hace `npm run test:e2e`). Se omite si Chrome no está instalado.
 */
const PORT = 4180;
const URL = `http://127.0.0.1:${PORT}/`;

let server: PreviewServer | undefined;
let browser: Browser | undefined;

test.beforeAll(async () => {
  try {
    browser = await chromium.launch({ channel: 'chrome' });
  } catch {
    browser = undefined;
    return;
  }
  server = await preview({
    root: ROOT,
    configFile: `${ROOT}/vite.config.mts`,
    logLevel: 'error',
    preview: { host: '127.0.0.1', port: PORT, strictPort: true },
  });
});

test.afterAll(async () => {
  await browser?.close();
  await new Promise<void>((resolve) => (server ? server.httpServer.close(() => resolve()) : resolve()));
});

async function open(device: (typeof devices)[string]): Promise<Page> {
  test.skip(!browser, 'Google Chrome no está instalado');
  const context = await browser!.newContext({ ...device });
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: 'networkidle' });
  return page;
}

async function expectNoOverflow(page: Page) {
  const size = await page.evaluate(() => ({
    docW: document.documentElement.scrollWidth,
    docH: document.documentElement.scrollHeight,
    vw: window.innerWidth,
    vh: window.innerHeight,
  }));
  expect(size.docW).toBeLessThanOrEqual(size.vw);
  expect(size.docH).toBeLessThanOrEqual(size.vh);
}

async function expectInViewport(page: Page, selector: string) {
  const box = (await page.locator(selector).first().boundingBox())!;
  const vp = page.viewportSize()!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(vp.width + 0.5);
  expect(box.y + box.height).toBeLessThanOrEqual(vp.height + 0.5);
}

test('teléfono en vertical: nada se sale de la pantalla y se arrastra a una casilla oculta', async () => {
  const page = await open(devices['Pixel 7']);
  await expectNoOverflow(page);
  await expectInViewport(page, '[data-testid="new-game-button"]');
  await page.getByTestId('new-game-button').tap();
  await expectNoOverflow(page);
  for (const sel of ['[data-testid="pause-button"]', '[data-testid="restart-button"]', '.search-input', '[data-testid="belt-pause-button"]']) {
    await expectInViewport(page, sel);
  }

  // El helio (grupo 18) queda fuera de la vista: la tabla debe desplazarse sola al arrastrar.
  await page.getByRole('combobox', { name: /Buscar/ }).fill('helio');
  await page.keyboard.press('Enter');
  const held = page.locator('[data-holder-tile="true"]');
  await expectInViewport(page, '[data-holder-tile="true"]');
  const target = page.locator('[data-cell-key="1-18"]');
  const vp = page.viewportSize()!;
  expect((await target.boundingBox())!.x).toBeGreaterThan(vp.width);

  const from = (await held.boundingBox())!;
  const area = (await page.locator('.table-scroll').boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + from.width / 2, from.y - 30, { steps: 3 });
  const edgeY = area.y + area.height * 0.35;
  await page.mouse.move(area.x + area.width - 8, edgeY, { steps: 8 });
  await expect
    .poll(async () => (await target.boundingBox())!.x + (await target.boundingBox())!.width, { timeout: 10_000 })
    .toBeLessThanOrEqual(vp.width);
  const cell = (await target.boundingBox())!;
  await page.mouse.move(cell.x + cell.width / 2, cell.y + cell.height / 2, { steps: 6 });
  await page.mouse.up();

  await expect(page.getByTestId('placed-count')).toHaveText('1');
  await expect(target.locator('.cell-symbol')).toHaveText('He');
  await expect(target.locator('.cell-name')).toHaveText('Helio');
  await page.context().close();
});

test('teléfono en horizontal: cabecera, carrusel y tarjeta caben en la pantalla', async () => {
  const page = await open(devices['Pixel 7 landscape']);
  await expectNoOverflow(page);
  await expectInViewport(page, '[data-testid="new-game-button"]');
  await page.getByTestId('new-game-button').tap();
  await expectNoOverflow(page);
  for (const sel of ['[data-testid="pause-button"]', '.search-input', '[data-testid="belt-pause-button"]', '.belt-viewport']) {
    await expectInViewport(page, sel);
  }

  await page.getByRole('combobox', { name: /Buscar/ }).fill('carbono');
  await page.keyboard.press('Enter');
  await page.locator('[data-holder-tile="true"]').tap();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Voltear tarjeta' }).tap();
  await page.waitForTimeout(900);
  for (const sel of ['.flip-card', '.particle-counts', '.card-actions']) await expectInViewport(page, sel);

  // Colocar con toques: cerrar la tarjeta y tocar la casilla (la tabla se desplaza con el dedo).
  await page.getByRole('button', { name: 'Cerrar' }).tap();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.locator('[data-cell-key="2-14"]').scrollIntoViewIfNeeded();
  await page.locator('[data-cell-key="2-14"]').tap();
  await expect(page.getByTestId('placed-count')).toHaveText('1');
  await page.context().close();
});

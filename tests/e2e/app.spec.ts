import { expect, test } from '@playwright/test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ELEMENTS, getElement } from '../../src/data/elements';
import {
  dragLocatorToCell,
  dragTileToCell,
  expectCellFace,
  launchApp,
  startNewGame,
  tileX,
  visibleBeltTileId,
  type LaunchedApp,
} from './helpers';

const keyOf = (id: string) => `${getElement(id)!.period}-${getElement(id)!.group}`;

test.describe('aplicación de escritorio (versión de producción)', () => {
  let launched: LaunchedApp;

  test.afterEach(async () => {
    await launched?.close();
  });

  test('22–26. arranca sin errores, con seguridad activa, recursos locales y sin red', async () => {
    launched = await launchApp();
    const { app, page, consoleErrors, requests } = launched;

    await expect(page).toHaveTitle('Tabla Periódica Interactiva');
    await expect(page.getByTestId('start-screen')).toBeVisible();
    await startNewGame(page);
    await expect(page.getByTestId('placed-count')).toHaveText('0');
    await expect(page.locator('[data-belt-tile="true"]')).toHaveCount(88);
    await expect(page.locator('[data-drop-cell="true"]')).toHaveCount(88);

    // 26. Seguridad de Electron.
    // Electron no ofrece un getter de webPreferences: se verifica su efecto real.
    const sandboxed = await app.evaluate(({ app: electronApp, BrowserWindow }) => {
      const pid = BrowserWindow.getAllWindows()[0].webContents.getOSProcessId();
      return electronApp.getAppMetrics().find((m) => m.pid === pid)?.sandboxed;
    });
    expect(sandboxed).toBe(true);
    const exposure = await page.evaluate(async () => ({
      require: typeof (window as unknown as { require?: unknown }).require,
      process: typeof (window as unknown as { process?: unknown }).process,
      desktopKeys: Object.keys(window.desktop ?? {}).sort(),
      info: await window.desktop?.getAppInfo(),
      csp: document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.getAttribute('content') ?? '',
    }));
    // nodeIntegration desactivado: sin require ni process en la página.
    expect(exposure.require).toBe('undefined');
    expect(exposure.process).toBe('undefined');
    // contextBridge solo funciona con contextIsolation activo; solo se expone la API mínima.
    expect(exposure.desktopKeys).toEqual(['getAppInfo', 'isDesktop']);
    expect(exposure.info?.name).toBe('Tabla Periódica Interactiva');
    expect(exposure.csp).toContain("script-src 'self'");

    // 24. Estilos y fuentes de la versión compilada.
    const resources = await page.evaluate(async () => {
      await document.fonts.ready;
      return {
        background: getComputedStyle(document.body).backgroundColor,
        fontLoaded: Array.from(document.fonts).some((f) => f.family.includes('Inter') && f.status === 'loaded'),
        gridColumns: getComputedStyle(document.querySelector('.periodic-grid')!).gridTemplateColumns.split(' ').length,
      };
    });
    expect(resources.background).toBe('rgb(245, 245, 241)');
    expect(resources.fontLoaded).toBe(true);
    expect(resources.gridColumns).toBe(19); // columna de períodos + 18 grupos

    // 25. Todo se carga desde archivos locales.
    const external = requests.filter((u) => !/^(file|data|blob|devtools):/.test(u));
    expect(external).toEqual([]);
    const blocked = await page.evaluate(async () => {
      try {
        await fetch('https://example.com/');
        return 'permitido';
      } catch {
        return 'bloqueado';
      }
    });
    expect(blocked).toBe('bloqueado');

    // 23. Sin errores críticos (se filtra el error esperado del fetch bloqueado).
    const critical = consoleErrors.filter((e) => !/example\.com|Content Security Policy|ERR_BLOCKED/i.test(e));
    expect(critical).toEqual([]);
  });

  test('funciona sin conexión a Internet', async () => {
    launched = await launchApp();
    const { app, page } = launched;
    await app.evaluate(({ session }) => session.defaultSession.enableNetworkEmulation({ offline: true }));
    await page.reload();
    await startNewGame(page);
    await expect(page.locator('[data-belt-tile="true"]')).toHaveCount(88);
  });

  test('9–11. orden aleatorio, movimiento de derecha a izquierda, pausa y reanudación', async () => {
    launched = await launchApp();
    const { page } = launched;
    await startNewGame(page);

    const orderOf = () => page.locator('[data-belt-tile="true"]').evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.elementId));
    const first = await orderOf();
    expect(new Set(first).size).toBe(88);

    const id = await visibleBeltTileId(page);
    const x0 = await tileX(page, id);
    await page.waitForTimeout(800);
    const x1 = await tileX(page, id);
    expect(x1).toBeLessThan(x0 - 10);

    for (let i = 0; i < 4; i++) {
      await page.getByTestId('pause-button').click();
      await expect(page.getByTestId('conveyor')).toHaveAttribute('data-paused', 'true');
      const a = await tileX(page, id);
      await page.waitForTimeout(400);
      expect(Math.abs((await tileX(page, id)) - a)).toBeLessThan(0.5);
      await page.getByTestId('pause-button').click();
      await expect(page.getByTestId('conveyor')).toHaveAttribute('data-paused', 'false');
      const b = await tileX(page, id);
      await page.waitForTimeout(400);
      const c = await tileX(page, id);
      // Avanza a la izquierda o, si ha salido, reaparece por la derecha.
      expect(c < b - 5 || c > b + 500).toBe(true);
    }
    await expect(page.locator('[data-belt-tile="true"]')).toHaveCount(88);

    // Nueva partida: otro orden aleatorio.
    await page.getByTestId('restart-button').click();
    await page.getByTestId('confirm-dialog').getByRole('button', { name: 'Reiniciar' }).click();
    const second = await orderOf();
    expect(second).toHaveLength(88);
    expect(second).not.toEqual(first);
  });

  test('12–13. la tarjeta se abre, se voltea con animación 3D y se cierra', async () => {
    launched = await launchApp();
    const { page } = launched;
    await startNewGame(page);
    const id = await visibleBeltTileId(page);
    const element = getElement(id)!;

    // Clic real sobre la ficha en movimiento.
    const box = (await page.locator(`[data-belt-tile="true"][data-element-id="${id}"]`).boundingBox())!;
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: element.name })).toBeVisible();
    await expect(page.getByTestId('card-symbol')).toHaveText(element.symbol);
    await expect(page.getByTestId('card-symbol')).toBeVisible();
    await dialog.getByRole('button', { name: 'Voltear tarjeta' }).click();
    await expect(page.getByTestId('flip-card')).toHaveAttribute('data-flipped', 'true');
    await page.waitForTimeout(800);
    const transform = await page.locator('.flip-card-inner').evaluate((el) => getComputedStyle(el).transform);
    expect(transform).not.toBe('none');
    await expect(page.getByTestId('count-protons')).toHaveText(String(element.protons));
    await expect(page.getByTestId('count-neutrons')).toHaveText(String(element.neutrons));
    await expect(page.getByTestId('count-electrons')).toHaveText(String(element.electrons));

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    // El foco vuelve a la ficha seleccionada y se puede continuar.
    await expect(page.locator('[data-holder-tile="true"]')).toBeFocused();
    await expect(page.locator('[data-holder-tile="true"] .tile-name')).toHaveText(element.name);
    await expect(page.locator('[data-holder-tile="true"] .tile-symbol')).toHaveText(element.symbol);
  });

  test('las fichas muestran símbolo y nombre; mantener pulsado detiene el mostrador y permite moverlo', async () => {
    launched = await launchApp();
    const { page } = launched;
    await startNewGame(page);

    const faces = await page.locator('[data-belt-tile="true"]').evaluateAll((els) =>
      els.map((e) => ({
        id: (e as HTMLElement).dataset.elementId!,
        symbol: e.querySelector('.tile-symbol')?.textContent,
        name: e.querySelector('.tile-name')?.textContent,
      })),
    );
    expect(faces).toHaveLength(88);
    for (const f of faces) expect([f.symbol, f.name]).toEqual([getElement(f.id)!.symbol, getElement(f.id)!.name]);

    const id = await visibleBeltTileId(page);
    const box = (await page.locator(`[data-belt-tile="true"][data-element-id="${id}"]`).boundingBox())!;
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;

    // Pulsar sin soltar: la cinta se detiene.
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    const held = await tileX(page, id);
    await page.waitForTimeout(600);
    expect(Math.abs((await tileX(page, id)) - held)).toBeLessThan(0.5);

    // Arrastrar en horizontal: la cinta sigue al puntero en ambos sentidos.
    for (let i = 1; i <= 10; i++) await page.mouse.move(cx - i * 20, cy + 2);
    await page.waitForTimeout(100);
    expect((await tileX(page, id)) - held).toBeCloseTo(-200, -1);
    for (let i = 1; i <= 15; i++) await page.mouse.move(cx - 200 + i * 20, cy + 2);
    expect((await tileX(page, id)) - held).toBeCloseTo(100, -1);
    await page.waitForTimeout(500);
    expect((await tileX(page, id)) - held).toBeCloseTo(100, -1);

    // Al soltar: no se abre ninguna tarjeta, no se saca ninguna ficha y la cinta reanuda.
    await page.mouse.up();
    await page.waitForTimeout(150);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.locator('[data-holder-tile="true"]')).toHaveCount(0);
    await expect(page.getByTestId('placed-count')).toHaveText('0');
    await expect(page.getByTestId('errors-count')).toHaveText('0');
    await expect(page.locator('[data-belt-tile="true"]')).toHaveCount(88);
    await expect(page.getByTestId('conveyor')).toHaveAttribute('data-paused', 'false');
    const released = await tileX(page, id);
    await page.waitForTimeout(600);
    expect(await tileX(page, id)).toBeLessThan(released - 10);

    // Un clic simple (pulsar y soltar sin mover) sigue abriendo la tarjeta.
    const id2 = await visibleBeltTileId(page);
    const b2 = (await page.locator(`[data-belt-tile="true"][data-element-id="${id2}"]`).boundingBox())!;
    await page.mouse.click(b2.x + b2.width / 2, b2.y + b2.height / 2);
    await expect(page.getByRole('dialog').getByRole('heading', { name: getElement(id2)!.name })).toBeVisible();
  });

  test('el buscador encuentra un elemento y se arrastra a su casilla, que muestra símbolo y nombre', async () => {
    launched = await launchApp();
    const { page } = launched;
    await startNewGame(page);

    const input = page.getByRole('combobox', { name: /Buscar elemento/ });
    await input.fill('mercurio');
    await expect(page.getByRole('option').first()).toContainText('Mercurio');
    await page.keyboard.press('Enter');
    const held = page.locator('[data-holder-tile="true"]');
    await expect(held.locator('.tile-symbol')).toHaveText('Hg');
    await expect(page.locator('[data-belt-tile="true"][data-element-id="mercurio"]')).toHaveCount(0);

    await dragLocatorToCell(page, held, keyOf('mercurio'));
    await expect(page.getByTestId('placed-count')).toHaveText('1');
    await expectCellFace(page, keyOf('mercurio'), 'mercurio');

    // Por símbolo y con el ratón.
    await input.fill('Na');
    await page.getByRole('option').first().click();
    await expect(held.locator('.tile-name')).toHaveText('Sodio');

    // El botón del propio carrusel lo detiene y lo reanuda.
    const id = await visibleBeltTileId(page);
    await page.getByTestId('belt-pause-button').click();
    await expect(page.getByTestId('conveyor')).toHaveAttribute('data-paused', 'true');
    const x = await tileX(page, id);
    await page.waitForTimeout(500);
    expect(Math.abs((await tileX(page, id)) - x)).toBeLessThan(0.5);
    await page.getByTestId('belt-pause-button').click();
    await expect(page.getByTestId('conveyor')).toHaveAttribute('data-paused', 'false');
    await page.waitForTimeout(500);
    expect(await tileX(page, id)).toBeLessThan(x - 10);
  });

  test('14–19. arrastrar y soltar: acierto, error, devolución y casilla ocupada', async () => {
    launched = await launchApp();
    const { page } = launched;
    await startNewGame(page);

    // Correcta (con la cinta en movimiento).
    const good = await visibleBeltTileId(page);
    await dragTileToCell(page, good, keyOf(good));
    await expect(page.getByTestId('placed-count')).toHaveText('1');
    await expectCellFace(page, keyOf(good), good);
    await expect(page.locator(`[data-belt-tile="true"][data-element-id="${good}"]`)).toHaveCount(0);
    await expect(page.locator('[data-belt-tile="true"]')).toHaveCount(87);

    // Incorrecta: se rechaza y vuelve al mostrador.
    const bad = await visibleBeltTileId(page);
    const wrong = ELEMENTS.find((e) => e.id !== bad && e.id !== good)!;
    await dragTileToCell(page, bad, keyOf(wrong.id));
    await expect(page.getByTestId('errors-count')).toHaveText('1');
    await expect(page.getByTestId('placed-count')).toHaveText('1');
    await expect(page.locator(`[data-cell-key="${keyOf(wrong.id)}"]`)).toHaveAttribute('data-filled', 'false');
    await expect(page.locator(`[data-belt-tile="true"][data-element-id="${bad}"]`)).toHaveCount(1);
    await expect(page.locator(`[data-belt-tile="true"][data-element-id="${bad}"]`)).not.toHaveClass(/is-lifted/);
    await expect(page.locator('[data-belt-tile="true"]')).toHaveCount(87);
    await expect(page.getByTestId('drag-ghost')).toHaveCount(0);

    // Ocupada: no reemplaza al elemento colocado.
    const other = await visibleBeltTileId(page);
    await dragTileToCell(page, other, keyOf(good));
    await expectCellFace(page, keyOf(good), good);
    await expect(page.getByTestId('feedback')).toContainText('ocupada');
    await expect(page.getByTestId('placed-count')).toHaveText('1');
    await expect(page.locator('[data-belt-tile="true"]')).toHaveCount(87);
  });

  test('20–21. completa los 88 elementos con el teclado y reinicia', async () => {
    test.setTimeout(240_000);
    launched = await launchApp();
    const { page } = launched;
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await startNewGame(page);

    const ids = await page.locator('[data-belt-tile="true"]').evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.elementId!));
    expect(ids).toHaveLength(88);
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      await page.locator(`[data-belt-tile="true"][data-element-id="${id}"]`).focus();
      await page.keyboard.press('Enter');
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.keyboard.press('Escape');
      await page.getByRole('button', { name: 'Colocar', exact: true }).click();
      await page.locator(`[data-cell-key="${keyOf(id)}"]`).click();
      await expect(page.getByTestId('placed-count')).toHaveText(String(i + 1));
      if (i < 87) await expect(page.getByTestId('completion-screen')).toHaveCount(0);
    }
    await expect(page.getByTestId('completion-screen')).toBeVisible();
    await expect(page.getByTestId('completion-screen')).toContainText('88');
    await expect(page.getByTestId('conveyor')).toHaveAttribute('data-paused', 'true');
    await expect(page.locator('.cell-name')).toHaveCount(88);

    await page.getByTestId('completion-new-game').click();
    await expect(page.getByTestId('placed-count')).toHaveText('0');
    await expect(page.locator('.cell-name')).toHaveCount(0);
    await expect(page.locator('[data-belt-tile="true"]')).toHaveCount(88);
  });

  test('guarda el progreso y permite continuar la partida', async () => {
    const userData = mkdtempSync(join(tmpdir(), 'tabla-periodica-persist-'));
    try {
      launched = await launchApp({}, userData);
      let page = launched.page;
      await startNewGame(page);
      const id = await visibleBeltTileId(page);
      await dragTileToCell(page, id, keyOf(id));
      await expect(page.getByTestId('placed-count')).toHaveText('1');
      await launched.close();

      launched = await launchApp({}, userData);
      page = launched.page;
      await expect(page.getByTestId('continue-button')).toContainText('1 de 88');
      await page.getByTestId('continue-button').click();
      await expect(page.getByTestId('placed-count')).toHaveText('1');
      await expectCellFace(page, keyOf(id), id);
      await expect(page.locator('[data-belt-tile="true"]')).toHaveCount(87);
    } finally {
      await launched.close();
      launched = undefined as unknown as LaunchedApp;
      rmSync(userData, { recursive: true, force: true });
    }
  });
});

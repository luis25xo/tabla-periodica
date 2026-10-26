import { expect, test } from '@playwright/test';
import { createServer, type ViteDevServer } from 'vite';
import { ROOT, launchApp, startNewGame, type LaunchedApp } from './helpers';

test.describe('modo de desarrollo', () => {
  let server: ViteDevServer | undefined;
  let launched: LaunchedApp | undefined;

  test.afterAll(async () => {
    await launched?.close();
    await server?.close();
  });

  test('22. la aplicación se inicia con el servidor de desarrollo de Vite', async () => {
    server = await createServer({ root: ROOT, configFile: `${ROOT}/vite.config.mts`, logLevel: 'error' });
    await server.listen();
    launched = await launchApp({ VITE_DEV_SERVER_URL: 'http://127.0.0.1:5173' });
    const { page, consoleErrors } = launched;

    expect(page.url()).toBe('http://127.0.0.1:5173/');
    await startNewGame(page);
    await expect(page.locator('[data-belt-tile="true"]')).toHaveCount(88);
    await expect(page.getByTestId('periodic-table')).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });
});

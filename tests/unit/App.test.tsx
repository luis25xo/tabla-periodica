import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../src/App';
import { ELEMENTS, getElement } from '../../src/data/elements';
import { STORAGE_KEY } from '../../src/utils/persistence';

function mockReducedMotion(reduce: boolean) {
  vi.stubGlobal(
    'matchMedia',
    (query: string) =>
      ({
        matches: reduce && query.includes('reduce'),
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

const beltTiles = () => Array.from(document.querySelectorAll<HTMLButtonElement>('[data-belt-tile="true"]'));
const beltNames = () => beltTiles().map((t) => t.querySelector('.tile-name')?.textContent);
const cell = (key: string) => document.querySelector<HTMLButtonElement>(`[data-cell-key="${key}"]`)!;
/** Símbolo y nombre visibles en una casilla colocada. */
const cellFace = (key: string) => ({
  symbol: cell(key).querySelector('.cell-symbol')?.textContent ?? null,
  name: cell(key).querySelector('.cell-name')?.textContent ?? null,
});
const placedCount = () => screen.getByTestId('placed-count').textContent;
const errorsCount = () => screen.getByTestId('errors-count').textContent;
const keyOf = (id: string) => `${getElement(id)!.period}-${getElement(id)!.group}`;

function startNewGame() {
  const view = render(<App />);
  fireEvent.click(screen.getByTestId('new-game-button'));
  return view;
}

function tileFor(id: string) {
  return document.querySelector<HTMLButtonElement>(`[data-belt-tile="true"][data-element-id="${id}"]`)!;
}

/** Selecciona una ficha (abre su tarjeta) y cierra la tarjeta al instante. */
function selectAndCloseCard(id: string) {
  fireEvent.click(tileFor(id));
  fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });
}

describe('interfaz de la partida', () => {
  it('muestra la tabla vacía, el progreso y las 88 fichas con símbolo y nombre', () => {
    startNewGame();
    expect(placedCount()).toBe('0');
    expect(screen.getByTestId('total-count').textContent).toBe('88');
    expect(screen.getByText(/Elementos colocados:/)).toBeInTheDocument();
    expect(beltTiles()).toHaveLength(88);
    expect(new Set(beltNames())).toEqual(new Set(ELEMENTS.map((e) => e.name)));
    for (const tile of beltTiles()) {
      const element = getElement(tile.dataset.elementId!)!;
      expect(tile.querySelector('.tile-symbol')?.textContent).toBe(element.symbol);
      expect(tile.querySelector('.tile-name')?.textContent).toBe(element.name);
    }
    expect(document.querySelectorAll('[data-drop-cell="true"]')).toHaveLength(88);
    expect(document.querySelectorAll('.cell-name')).toHaveLength(0);
    // Ni lantánidos ni actínidos en ningún lugar.
    expect(document.body.textContent).not.toMatch(/Lantano|Actinio|Uranio/);
  });

  it('12/13. abre la tarjeta del elemento, la voltea y la cierra con Escape sin perder la ficha', async () => {
    startNewGame();
    fireEvent.click(tileFor('carbono'));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'Carbono' })).toBeInTheDocument();
    expect(screen.getByTestId('card-symbol').textContent).toBe('C');
    expect(screen.getByTestId('flip-card').dataset.flipped).toBe('false');

    fireEvent.click(within(dialog).getByRole('button', { name: 'Voltear tarjeta' }));
    expect(screen.getByTestId('flip-card').dataset.flipped).toBe('true');
    expect(screen.getByTestId('count-protons').textContent).toBe('6');
    expect(screen.getByTestId('count-neutrons').textContent).toBe('6');
    expect(screen.getByTestId('count-electrons').textContent).toBe('6');
    expect(dialog.querySelectorAll('[data-particle="proton"]')).toHaveLength(6);
    expect(dialog.querySelectorAll('[data-particle="neutron"]')).toHaveLength(6);
    expect(dialog.querySelectorAll('[data-particle="electron"]')).toHaveLength(6);
    // Solo los tres datos permitidos.
    expect(dialog.querySelectorAll('dt')).toHaveLength(3);
    expect(dialog.textContent).not.toMatch(/masa|número atómico|configuración|valencia/i);

    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByTestId('holder').textContent).toContain('Carbono');
    expect(placedCount()).toBe('0');
  });

  it('14–19. valida colocaciones correctas, incorrectas y casillas ocupadas', () => {
    mockReducedMotion(true);
    startNewGame();

    // Incorrecta mediante el modo de colocación.
    selectAndCloseCard('carbono');
    fireEvent.click(screen.getByRole('button', { name: 'Colocar' }));
    fireEvent.click(cell('2-15'));
    expect(placedCount()).toBe('0');
    expect(errorsCount()).toBe('1');
    expect(screen.getByTestId('feedback').textContent).toMatch(/no es su casilla/i);
    expect(screen.getByTestId('feedback').textContent).not.toMatch(/grupo|período|14/i);
    expect(beltNames()).toContain('Carbono');
    expect(beltTiles()).toHaveLength(88);

    // Correcta con clic directo sobre la casilla.
    selectAndCloseCard('carbono');
    fireEvent.click(cell('2-14'));
    expect(placedCount()).toBe('1');
    expect(screen.getByTestId('hits-count').textContent).toBe('1');
    expect(cellFace('2-14')).toEqual({ symbol: 'C', name: 'Carbono' });
    expect(beltNames()).not.toContain('Carbono');
    expect(beltTiles()).toHaveLength(87);
    expect(screen.getByTestId('feedback').textContent).toMatch(/correcto/i);

    // Ocupada.
    selectAndCloseCard('nitrogeno');
    fireEvent.click(cell('2-14'));
    expect(cellFace('2-14')).toEqual({ symbol: 'C', name: 'Carbono' });
    expect(placedCount()).toBe('1');
    expect(errorsCount()).toBe('1');
    expect(screen.getByTestId('feedback').textContent).toMatch(/ocupada/i);
    expect(beltNames()).toContain('Nitrógeno');
  });

  it('permite colocar con el teclado usando las flechas e Intro', async () => {
    mockReducedMotion(true);
    const user = userEvent.setup();
    startNewGame();
    selectAndCloseCard('helio');
    await user.click(screen.getByRole('button', { name: 'Colocar' }));
    await waitFor(() => expect(document.activeElement?.getAttribute('data-cell-key')).toBe('1-1'));
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement?.getAttribute('data-cell-key')).toBe('1-18');
    await user.keyboard('{Enter}');
    expect(placedCount()).toBe('1');
    expect(cellFace('1-18')).toEqual({ symbol: 'He', name: 'Helio' });
  });

  it('el buscador encuentra un elemento (sin tildes ni mayúsculas, o por símbolo) y lo deja listo para colocar', () => {
    mockReducedMotion(true);
    startNewGame();
    const input = screen.getByRole('combobox', { name: /Buscar elemento/ });

    fireEvent.change(input, { target: { value: 'oxigeno' } });
    expect(screen.getByRole('listbox').textContent).toContain('Oxígeno');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByTestId('holder').querySelector('.tile-name')?.textContent).toBe('Oxígeno');
    expect(beltNames()).not.toContain('Oxígeno');
    expect((input as HTMLInputElement).value).toBe('');

    // Se coloca en su casilla desde el soporte.
    fireEvent.click(cell('2-16'));
    expect(cellFace('2-16')).toEqual({ symbol: 'O', name: 'Oxígeno' });
    expect(placedCount()).toBe('1');

    // Por símbolo, con el ratón; los ya colocados aparecen como tales y no se pueden elegir.
    fireEvent.change(input, { target: { value: 'fe' } });
    const option = screen.getAllByRole('option')[0];
    expect(option.textContent).toContain('Hierro');
    fireEvent.mouseDown(option);
    expect(screen.getByTestId('holder').querySelector('.tile-symbol')?.textContent).toBe('Fe');

    fireEvent.change(input, { target: { value: 'O' } });
    const placedOption = screen.getAllByRole('option').find((o) => o.textContent?.includes('Oxígeno'))!;
    expect(placedOption).toHaveAttribute('aria-disabled', 'true');
    expect(placedOption.textContent).toContain('Colocado');
    fireEvent.mouseDown(placedOption);
    expect(screen.getByTestId('holder').querySelector('.tile-name')?.textContent).toBe('Hierro');

    fireEvent.change(input, { target: { value: 'zzz' } });
    expect(screen.getByRole('listbox').textContent).toContain('Ningún elemento coincide');
  });

  it('el botón del carrusel lo detiene y lo reanuda, sincronizado con el de la barra superior', () => {
    startNewGame();
    const conveyor = screen.getByTestId('conveyor');
    const beltButton = screen.getByTestId('belt-pause-button');
    expect(beltButton.textContent).toContain('Detener');
    fireEvent.click(beltButton);
    expect(conveyor.dataset.paused).toBe('true');
    expect(beltButton.textContent).toContain('Reanudar');
    expect(screen.getByTestId('pause-button').textContent).toMatch(/Reanudar/);
    fireEvent.click(screen.getByTestId('pause-button'));
    expect(conveyor.dataset.paused).toBe('false');
    expect(beltButton.textContent).toContain('Detener');
  });

  it('11. pausa y reanuda el mostrador', () => {
    startNewGame();
    const conveyor = screen.getByTestId('conveyor');
    const button = screen.getByTestId('pause-button');
    expect(conveyor.dataset.paused).toBe('false');
    fireEvent.click(button);
    expect(conveyor.dataset.paused).toBe('true');
    expect(button.textContent).toMatch(/Reanudar/);
    fireEvent.click(button);
    expect(conveyor.dataset.paused).toBe('false');
    expect(button.textContent).toMatch(/Pausar/);
  });

  it('20. el reinicio pide confirmación y restaura el estado inicial', () => {
    mockReducedMotion(true);
    startNewGame();
    selectAndCloseCard('litio');
    fireEvent.click(cell(keyOf('litio')));
    expect(placedCount()).toBe('1');

    fireEvent.click(screen.getByTestId('restart-button'));
    const confirm = screen.getByTestId('confirm-dialog');
    fireEvent.click(within(confirm).getByRole('button', { name: 'Cancelar' }));
    expect(placedCount()).toBe('1');

    fireEvent.click(screen.getByTestId('restart-button'));
    fireEvent.click(within(screen.getByTestId('confirm-dialog')).getByRole('button', { name: 'Reiniciar' }));
    expect(placedCount()).toBe('0');
    expect(errorsCount()).toBe('0');
    expect(beltTiles()).toHaveLength(88);
    expect(document.querySelectorAll('.cell-name')).toHaveLength(0);
  });

  it('continúa una partida guardada localmente', () => {
    mockReducedMotion(true);
    const view = startNewGame();
    selectAndCloseCard('sodio');
    fireEvent.click(cell(keyOf('sodio')));
    expect(window.localStorage.getItem(STORAGE_KEY)).toContain('sodio');

    view.unmount();
    render(<App />);
    const cont = screen.getByTestId('continue-button');
    expect(cont.textContent).toContain('1 de 88');
    fireEvent.click(cont);
    expect(placedCount()).toBe('1');
    expect(cellFace(keyOf('sodio'))).toEqual({ symbol: 'Na', name: 'Sodio' });
    expect(beltNames()).not.toContain('Sodio');
  });

  it('21. termina exactamente al colocar los 88 elementos', async () => {
    mockReducedMotion(true);
    startNewGame();
    const ids = beltTiles().map((t) => t.dataset.elementId!);
    expect(ids).toHaveLength(88);
    for (let i = 0; i < ids.length; i++) {
      expect(screen.queryByTestId('completion-screen')).toBeNull();
      selectAndCloseCard(ids[i]);
      fireEvent.click(cell(keyOf(ids[i])));
      expect(placedCount()).toBe(String(i + 1));
    }
    expect(screen.getByTestId('completion-screen').textContent).toContain('88');
    expect(screen.getByTestId('conveyor').dataset.paused).toBe('true');
    expect(beltTiles()).toHaveLength(0);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();

    await act(async () => {
      fireEvent.click(screen.getByTestId('completion-new-game'));
    });
    expect(placedCount()).toBe('0');
    expect(beltTiles()).toHaveLength(88);
  }, 30_000);
});

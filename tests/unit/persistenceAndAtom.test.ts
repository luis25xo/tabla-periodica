import { describe, expect, it } from 'vitest';
import { ALL_ELEMENT_IDS, ELEMENTS } from '../../src/data/elements';
import { computeAtomLayout } from '../../src/utils/atomLayout';
import { STORAGE_KEY, clearSavedGame, loadSavedGame, parseSavedGame, saveGame } from '../../src/utils/persistence';
import { shuffle } from '../../src/utils/shuffle';

describe('persistencia', () => {
  it('guarda y recupera solo el estado necesario', () => {
    const order = shuffle(ALL_ELEMENT_IDS);
    saveGame({ order, placed: ['hidrogeno'], errors: 2 });
    const raw = JSON.parse(window.localStorage.getItem(STORAGE_KEY)!);
    expect(Object.keys(raw).sort()).toEqual(['errors', 'order', 'placed', 'version']);
    expect(loadSavedGame()).toEqual({ version: 1, order, placed: ['hidrogeno'], errors: 2 });
    clearSavedGame();
    expect(loadSavedGame()).toBeNull();
  });

  it('descarta datos corruptos o incoherentes', () => {
    expect(parseSavedGame('{no es json')).toBeNull();
    expect(parseSavedGame(JSON.stringify({ version: 2, order: [], placed: [] }))).toBeNull();
    const order = shuffle(ALL_ELEMENT_IDS);
    expect(parseSavedGame(JSON.stringify({ version: 1, order: order.slice(1), placed: [], errors: 0 }))).toBeNull();
    expect(parseSavedGame(JSON.stringify({ version: 1, order, placed: ['lantano'], errors: 0 }))).toBeNull();
    expect(parseSavedGame(JSON.stringify({ version: 1, order, placed: [], errors: -4 }))?.errors).toBe(0);
  });
});

describe('modelo atómico', () => {
  it('dibuja exactamente los protones, neutrones y electrones de cada elemento', () => {
    for (const e of ELEMENTS) {
      const layout = computeAtomLayout(e.protons, e.neutrons, e.shells);
      expect(layout.nucleons.filter((n) => n.kind === 'proton')).toHaveLength(e.protons);
      expect(layout.nucleons.filter((n) => n.kind === 'neutron')).toHaveLength(e.neutrons);
      expect(layout.shells.map((s) => s.electrons.length)).toEqual(e.shells);
      // Los niveles quedan fuera del núcleo y dentro del lienzo, en orden creciente.
      layout.shells.forEach((s, i) => {
        expect(s.radius).toBeGreaterThan(layout.nucleusRadius);
        expect(s.radius).toBeLessThanOrEqual(layout.size / 2);
        if (i > 0) expect(s.radius).toBeGreaterThan(layout.shells[i - 1].radius);
      });
      for (const n of layout.nucleons) {
        expect(Math.hypot(n.x - layout.center, n.y - layout.center)).toBeLessThanOrEqual(layout.nucleusRadius + 0.001);
      }
    }
  });

  it('es determinista', () => {
    expect(computeAtomLayout(26, 30, [2, 8, 14, 2])).toEqual(computeAtomLayout(26, 30, [2, 8, 14, 2]));
  });
});

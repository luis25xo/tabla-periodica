import { describe, expect, it } from 'vitest';
import { ALL_ELEMENT_IDS, ELEMENTS, EXCLUDED_ATOMIC_NUMBERS, TOTAL_ELEMENTS } from '../../src/data/elements';
import { shellDistribution } from '../../src/utils/electronConfiguration';

const byName = (name: string) => {
  const el = ELEMENTS.find((e) => e.name === name);
  if (!el) throw new Error(`No existe ${name}`);
  return el;
};

describe('conjunto de datos de elementos', () => {
  it('1. contiene exactamente 88 elementos jugables', () => {
    expect(TOTAL_ELEMENTS).toBe(88);
    expect(ELEMENTS).toHaveLength(88);
  });

  it('2. todos los identificadores y nombres son únicos', () => {
    expect(new Set(ALL_ELEMENT_IDS).size).toBe(88);
    expect(new Set(ELEMENTS.map((e) => e.name)).size).toBe(88);
    expect(new Set(ELEMENTS.map((e) => e.protons)).size).toBe(88);
    for (const id of ALL_ELEMENT_IDS) expect(id).toMatch(/^[a-z]+$/);
  });

  it('3. no incluye lantánidos (57–71) ni actínidos (89–103)', () => {
    expect(EXCLUDED_ATOMIC_NUMBERS).toHaveLength(30);
    const protons = new Set(ELEMENTS.map((e) => e.protons));
    for (let z = 57; z <= 71; z++) expect(protons.has(z)).toBe(false);
    for (let z = 89; z <= 103; z++) expect(protons.has(z)).toBe(false);
    for (const name of ['Lantano', 'Cerio', 'Lutecio', 'Actinio', 'Torio', 'Uranio', 'Plutonio', 'Laurencio']) {
      expect(ELEMENTS.some((e) => e.name === name)).toBe(false);
    }
  });

  it('incluye todos los demás números atómicos del 1 al 118', () => {
    const expected = Array.from({ length: 118 }, (_, i) => i + 1).filter((z) => !EXCLUDED_ATOMIC_NUMBERS.includes(z));
    expect(ELEMENTS.map((e) => e.protons).sort((a, b) => a - b)).toEqual(expected);
  });

  it('5. asigna grupo y período reales a cada elemento', () => {
    const groupOf = (z: number): [number, number] => {
      if (z === 1) return [1, 1];
      if (z === 2) return [18, 1];
      if (z <= 10) return [z <= 4 ? z - 2 : z + 8, 2];
      if (z <= 18) return [z <= 12 ? z - 10 : z, 3];
      if (z <= 36) return [z - 18, 4];
      if (z <= 54) return [z - 36, 5];
      if (z <= 56) return [z - 54, 6];
      if (z <= 86) return [z - 68, 6];
      if (z <= 88) return [z - 86, 7];
      return [z - 100, 7];
    };
    for (const e of ELEMENTS) {
      expect([e.group, e.period], e.name).toEqual(groupOf(e.protons));
      expect(e.cell).toEqual({ period: e.period, group: e.group });
    }
  });

  it('asigna bloques s, p y d coherentes', () => {
    expect(byName('Hidrógeno').block).toBe('s');
    expect(byName('Helio').block).toBe('s');
    expect(byName('Calcio').block).toBe('s');
    expect(byName('Hierro').block).toBe('d');
    expect(byName('Copernicio').block).toBe('d');
    expect(byName('Carbono').block).toBe('p');
    expect(byName('Oganesón').block).toBe('p');
    expect(ELEMENTS.filter((e) => e.block === 'd')).toHaveLength(38);
    expect(ELEMENTS.filter((e) => e.block === 's')).toHaveLength(14);
    expect(ELEMENTS.filter((e) => e.block === 'p')).toHaveLength(36);
  });

  it('8. protones, neutrones y electrones son coherentes con el isótopo de referencia', () => {
    for (const e of ELEMENTS) {
      expect(e.electrons, e.name).toBe(e.protons);
      expect(e.protons + e.neutrons, e.name).toBe(e.isotope.massNumber);
      expect(e.neutrons, e.name).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(e.neutrons)).toBe(true);
      expect(e.isotope.key).toBe(`Z${e.protons}-A${e.isotope.massNumber}`);
      expect(['estable-mas-abundante', 'mayor-semivida']).toContain(e.isotope.basis);
    }
  });

  it('usa isótopos de referencia documentados (comprobación puntual)', () => {
    const expected: Record<string, [number, number]> = {
      Hidrógeno: [1, 0],
      Helio: [2, 2],
      Carbono: [6, 6],
      Oxígeno: [8, 8],
      Cloro: [17, 18],
      Hierro: [26, 30],
      Cobre: [29, 34],
      Tecnecio: [43, 54],
      Estaño: [50, 70],
      Oro: [79, 118],
      Plomo: [82, 126],
      Radón: [86, 136],
      Radio: [88, 138],
      Seaborgio: [106, 161],
      Hasio: [108, 163],
      Flerovio: [114, 175],
      Oganesón: [118, 176],
    };
    for (const [name, [p, n]] of Object.entries(expected)) {
      const e = byName(name);
      expect([e.protons, e.neutrons], name).toEqual([p, n]);
    }
    expect(byName('Tecnecio').isotope.basis).toBe('mayor-semivida');
    expect(byName('Hierro').isotope.basis).toBe('estable-mas-abundante');
  });

  it('reparte los electrones por niveles según el estado fundamental', () => {
    const expected: Record<string, number[]> = {
      Hidrógeno: [1],
      Sodio: [2, 8, 1],
      Argón: [2, 8, 8],
      Hierro: [2, 8, 14, 2],
      Cromo: [2, 8, 13, 1],
      Cobre: [2, 8, 18, 1],
      Paladio: [2, 8, 18, 18],
      Plata: [2, 8, 18, 18, 1],
      Bario: [2, 8, 18, 18, 8, 2],
      Hafnio: [2, 8, 18, 32, 10, 2],
      Platino: [2, 8, 18, 32, 17, 1],
      Oro: [2, 8, 18, 32, 18, 1],
      Radón: [2, 8, 18, 32, 18, 8],
      Rutherfordio: [2, 8, 18, 32, 32, 10, 2],
      Oganesón: [2, 8, 18, 32, 32, 18, 8],
    };
    for (const [name, shells] of Object.entries(expected)) expect(byName(name).shells, name).toEqual(shells);
    for (const e of ELEMENTS) {
      expect(e.shells.reduce((a, b) => a + b, 0), e.name).toBe(e.electrons);
      e.shells.forEach((count, i) => expect(count).toBeLessThanOrEqual(2 * (i + 1) ** 2));
      // El paladio ([Kr] 4d10) es la única excepción: no tiene electrones en el nivel 5.
      expect(e.shells.length, e.name).toBe(e.id === 'paladio' ? 4 : e.period);
    }
  });

  it('rechaza números de electrones fuera de rango', () => {
    expect(() => shellDistribution(0)).toThrow();
    expect(() => shellDistribution(119)).toThrow();
  });

  it('cada elemento tiene un símbolo químico válido y único', () => {
    expect(new Set(ELEMENTS.map((e) => e.symbol)).size).toBe(88);
    for (const e of ELEMENTS) expect(e.symbol, e.name).toMatch(/^[A-Z][a-z]?$/);
    expect(byName('Hierro').symbol).toBe('Fe');
    expect(byName('Wolframio').symbol).toBe('W');
    expect(byName('Hasio').symbol).toBe('Hs');
    expect(byName('Oganesón').symbol).toBe('Og');
  });
});

import { describe, expect, it } from 'vitest';
import { ELEMENTS } from '../../src/data/elements';
import {
  CELL_BY_KEY,
  GRID,
  GROUPS,
  PERIODS,
  PLAYABLE_CELLS,
  RESERVED_F_BLOCK_CELLS,
  cellKey,
  neighborPlayableCell,
  parseCellKey,
} from '../../src/utils/periodicTable';

describe('distribución de la cuadrícula', () => {
  it('4. tiene exactamente 7 períodos × 18 grupos, sin filas separadas para series f', () => {
    expect(PERIODS).toBe(7);
    expect(GROUPS).toBe(18);
    expect(GRID).toHaveLength(126);
    expect(Math.max(...GRID.map((c) => c.period))).toBe(7);
    expect(new Set(GRID.map((c) => c.period)).size).toBe(7);
  });

  it('tiene 88 casillas jugables', () => {
    expect(PLAYABLE_CELLS).toHaveLength(88);
  });

  it('reserva y deja vacías las posiciones del grupo 3 en los períodos 6 y 7', () => {
    for (const coord of RESERVED_F_BLOCK_CELLS) {
      const cell = CELL_BY_KEY.get(cellKey(coord))!;
      expect(cell.kind).toBe('reserved');
      expect(cell.elementId).toBeNull();
    }
    expect(GRID.filter((c) => c.kind === 'reserved')).toHaveLength(2);
  });

  it('6. cada elemento tiene una coordenada válida y jugable', () => {
    for (const e of ELEMENTS) {
      expect(e.cell.period).toBeGreaterThanOrEqual(1);
      expect(e.cell.period).toBeLessThanOrEqual(7);
      expect(e.cell.group).toBeGreaterThanOrEqual(1);
      expect(e.cell.group).toBeLessThanOrEqual(18);
      expect(CELL_BY_KEY.get(cellKey(e.cell))?.elementId).toBe(e.id);
    }
  });

  it('7. no hay dos elementos en la misma posición', () => {
    expect(new Set(ELEMENTS.map((e) => cellKey(e.cell))).size).toBe(88);
  });

  it('respeta la forma real de la tabla (huecos de los períodos 1 a 3)', () => {
    const playable = (p: number, g: number) => CELL_BY_KEY.get(`${p}-${g}`)!.kind === 'playable';
    expect(playable(1, 1) && playable(1, 18)).toBe(true);
    for (let g = 2; g <= 17; g++) expect(playable(1, g)).toBe(false);
    for (const p of [2, 3]) {
      for (let g = 3; g <= 12; g++) expect(playable(p, g)).toBe(false);
      for (const g of [1, 2, 13, 14, 15, 16, 17, 18]) expect(playable(p, g)).toBe(true);
    }
    for (const p of [4, 5]) for (let g = 1; g <= 18; g++) expect(playable(p, g)).toBe(true);
    for (const p of [6, 7]) for (let g = 1; g <= 18; g++) expect(playable(p, g)).toBe(g !== 3);
  });

  it('cuenta los elementos por período: 2, 8, 8, 18, 18, 17, 17', () => {
    const counts = [1, 2, 3, 4, 5, 6, 7].map((p) => ELEMENTS.filter((e) => e.period === p).length);
    expect(counts).toEqual([2, 8, 8, 18, 18, 17, 17]);
  });

  it('interpreta y genera claves de casilla', () => {
    expect(parseCellKey('6-4')).toEqual({ period: 6, group: 4 });
    expect(parseCellKey('8-1')).toBeNull();
    expect(parseCellKey('1-19')).toBeNull();
    expect(parseCellKey('x')).toBeNull();
  });

  it('navega por teclado saltando huecos y casillas reservadas', () => {
    expect(neighborPlayableCell({ period: 1, group: 1 }, 0, 1)).toEqual({ period: 1, group: 18 });
    expect(neighborPlayableCell({ period: 6, group: 2 }, 0, 1)).toEqual({ period: 6, group: 4 });
    expect(neighborPlayableCell({ period: 5, group: 3 }, 1, 0)).toBeNull();
    expect(neighborPlayableCell({ period: 7, group: 18 }, 0, 1)).toBeNull();
  });
});

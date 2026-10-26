import { ELEMENTS } from '../data/elements';
import type { ElementId, GridCoord } from '../data/types';

export const GROUPS = 18;
export const PERIODS = 7;

/**
 * Tipos de posición de la cuadrícula:
 * - `playable`: casilla de destino de un elemento jugable.
 * - `reserved`: grupo 3 de los períodos 6 y 7, reservado a las series f excluidas. Vacía y no interactiva.
 * - `gap`: hueco natural de la tabla periódica (p. ej. entre H y He).
 */
export type CellKind = 'playable' | 'reserved' | 'gap';

export interface GridCell extends GridCoord {
  key: string;
  kind: CellKind;
  /** Elemento que corresponde a esta casilla (solo para validación interna). */
  elementId: ElementId | null;
}

export function cellKey(coord: GridCoord): string {
  return `${coord.period}-${coord.group}`;
}

export function parseCellKey(key: string): GridCoord | null {
  const match = /^(\d)-(\d{1,2})$/.exec(key);
  if (!match) return null;
  const period = Number(match[1]);
  const group = Number(match[2]);
  if (period < 1 || period > PERIODS || group < 1 || group > GROUPS) return null;
  return { period, group };
}

/** Posiciones reservadas a lantánidos y actínidos (se mantienen vacías). */
export const RESERVED_F_BLOCK_CELLS: readonly GridCoord[] = [
  { period: 6, group: 3 },
  { period: 7, group: 3 },
];

const elementByCell = new Map<string, ElementId>(ELEMENTS.map((e) => [cellKey(e.cell), e.id]));
const reservedKeys = new Set(RESERVED_F_BLOCK_CELLS.map(cellKey));

/** Cuadrícula completa de 7 períodos × 18 grupos, en orden de lectura. */
export const GRID: readonly GridCell[] = (() => {
  const cells: GridCell[] = [];
  for (let period = 1; period <= PERIODS; period++) {
    for (let group = 1; group <= GROUPS; group++) {
      const key = cellKey({ period, group });
      const elementId = elementByCell.get(key) ?? null;
      const kind: CellKind = elementId ? 'playable' : reservedKeys.has(key) ? 'reserved' : 'gap';
      cells.push({ period, group, key, kind, elementId });
    }
  }
  return cells;
})();

export const PLAYABLE_CELLS: readonly GridCell[] = GRID.filter((c) => c.kind === 'playable');

export const CELL_BY_KEY: ReadonlyMap<string, GridCell> = new Map(GRID.map((c) => [c.key, c]));

export function isPlayableCell(coord: GridCoord): boolean {
  return CELL_BY_KEY.get(cellKey(coord))?.kind === 'playable';
}

/**
 * Casilla jugable vecina en la dirección indicada, para la navegación por teclado.
 * Salta huecos y casillas reservadas; devuelve null si no hay ninguna.
 */
export function neighborPlayableCell(from: GridCoord, dPeriod: number, dGroup: number): GridCoord | null {
  let { period, group } = from;
  for (;;) {
    period += dPeriod;
    group += dGroup;
    if (period < 1 || period > PERIODS || group < 1 || group > GROUPS) return null;
    if (isPlayableCell({ period, group })) return { period, group };
  }
}

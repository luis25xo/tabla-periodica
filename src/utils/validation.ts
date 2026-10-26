import { getElement } from '../data/elements';
import type { ElementId, GridCoord } from '../data/types';
import { cellKey, isPlayableCell } from './periodicTable';

export type PlacementResult =
  /** El elemento pertenece a esa casilla. */
  | 'correct'
  /** Casilla jugable libre, pero no corresponde al elemento. */
  | 'incorrect'
  /** La casilla ya contiene un elemento colocado. */
  | 'occupied'
  /** Destino no jugable o elemento desconocido/ya colocado: se ignora. */
  | 'invalid';

/**
 * Validación única usada por todas las modalidades (arrastre, clic y teclado).
 * Se basa en el identificador interno y las coordenadas, nunca en el nombre visible.
 */
export function validatePlacement(
  elementId: ElementId,
  target: GridCoord,
  occupiedCells: ReadonlySet<string>,
  placedIds: ReadonlySet<ElementId>,
): PlacementResult {
  const element = getElement(elementId);
  if (!element || placedIds.has(elementId)) return 'invalid';
  if (!isPlayableCell(target)) return 'invalid';
  if (occupiedCells.has(cellKey(target))) return 'occupied';
  return element.cell.period === target.period && element.cell.group === target.group ? 'correct' : 'incorrect';
}

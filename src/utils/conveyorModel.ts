import type { ElementId } from '../data/types';

export interface BeltTile {
  id: ElementId;
  /** Posición horizontal (px) del borde izquierdo de la ficha respecto a la cinta. */
  x: number;
  /**
   * Ficha que entró por la derecha dejando un hueco mayor que un paso (pocas fichas en la cinta).
   * No se acerca a la anterior: avanza con la cinta para no "acelerar".
   */
  detached: boolean;
}

/** Ritmo con el que se cierran los huecos al retirar una ficha (1/s). */
const GAP_RELAX_RATE = 7;
/** Ritmo con el que se aplica un desplazamiento manual (1/s). */
const SHIFT_RATE = 10;

/**
 * Modelo de un mostrador transportador circular.
 *
 * - Las fichas forman una cola ordenada; la primera es la situada más a la izquierda.
 * - Todas avanzan hacia la izquierda (x decrece). Cuando una sale completamente por la
 *   izquierda pasa al final de la cola y reaparece por la derecha, fuera de la vista,
 *   por lo que no hay saltos visibles.
 * - Cada ficha existe una sola vez: nunca hay duplicados lógicos ni visuales.
 * - Al retirar una ficha, las siguientes cierran el hueco suavemente (espaciado constante).
 * - Las fichas devueltas se incorporan al final de la cola, por la derecha.
 */
export class ConveyorModel {
  tiles: BeltTile[] = [];
  private pendingShift = 0;

  constructor(
    /** Paso entre fichas: ancho de ficha + separación. */
    public readonly slot: number,
    /** Ancho visible de la cinta. */
    public viewport: number,
  ) {}

  get ids(): ElementId[] {
    return this.tiles.map((t) => t.id);
  }

  /** Sincroniza el contenido con la lista de fichas que deben estar en la cinta. */
  sync(ids: readonly ElementId[]): void {
    const wanted = new Set(ids);
    if (this.tiles.length === 0) {
      this.tiles = ids.map((id, i) => ({ id, x: i * this.slot, detached: false }));
      return;
    }
    this.tiles = this.tiles.filter((t) => wanted.has(t.id));
    const present = new Set(this.tiles.map((t) => t.id));
    for (const id of ids) {
      if (!present.has(id)) {
        this.appendAtEnd(id);
        present.add(id);
      }
    }
  }

  private appendAtEnd(id: ElementId): void {
    const last = this.tiles[this.tiles.length - 1];
    const natural = last ? last.x + this.slot : 0;
    const x = Math.max(natural, this.viewport);
    this.tiles.push({ id, x, detached: x > natural + 0.5 });
  }

  /** Desplazamiento manual suave (px). Negativo: hacia la izquierda. */
  nudge(dx: number): void {
    this.pendingShift += dx;
  }

  /**
   * Desplazamiento inmediato que sigue al puntero cuando el usuario arrastra la cinta.
   * Negativo: hacia la izquierda. Las fichas que salen por un extremo entran por el otro.
   */
  dragBy(dx: number): void {
    if (this.tiles.length === 0 || dx === 0) return;
    this.pendingShift = 0;
    for (const t of this.tiles) t.x += dx;
    this.wrap();
  }

  /** Programa el desplazamiento necesario para que una ficha quede visible. */
  ensureVisible(id: ElementId, margin = this.slot * 0.5): void {
    const tile = this.tiles.find((t) => t.id === id);
    if (!tile) return;
    const projected = tile.x + this.pendingShift;
    const minX = margin;
    const maxX = Math.max(minX, this.viewport - this.slot - margin);
    if (projected < minX) this.pendingShift += minX - projected;
    else if (projected > maxX) this.pendingShift += maxX - projected;
  }

  /**
   * Avanza la simulación.
   * @param dt segundos transcurridos
   * @param speed velocidad de la cinta en px/s (0 = en pausa)
   */
  step(dt: number, speed: number): void {
    const n = this.tiles.length;
    if (n === 0) {
      this.pendingShift = 0;
      return;
    }
    const delta = Math.min(Math.max(dt, 0), 0.1);

    let shift = -speed * delta;
    if (this.pendingShift !== 0) {
      const applied = Math.abs(this.pendingShift) < 0.5 ? this.pendingShift : this.pendingShift * (1 - Math.exp(-delta * SHIFT_RATE));
      shift += applied;
      this.pendingShift -= applied;
    }
    for (const t of this.tiles) t.x += shift;

    // Mantiene el espaciado constante cerrando huecos y evitando solapamientos.
    const decay = Math.exp(-delta * GAP_RELAX_RATE);
    for (let k = 1; k < n; k++) {
      const prev = this.tiles[k - 1];
      const tile = this.tiles[k];
      const target = prev.x + this.slot;
      const dev = tile.x - target;
      if (dev < 0 || !tile.detached) {
        tile.x = Math.abs(dev) < 0.25 ? target : target + dev * decay;
        tile.detached = false;
      }
    }

    this.wrap();
  }

  private wrap(): void {
    // Hacia delante: la ficha que sale por la izquierda reaparece por la derecha.
    let guard = this.tiles.length;
    while (guard-- > 0 && this.tiles.length > 0 && this.tiles[0].x < -this.slot) {
      const tile = this.tiles.shift()!;
      this.appendAtEnd(tile.id);
    }
    // Hacia atrás (desplazamiento manual): la última ficha oculta pasa al principio.
    guard = this.tiles.length;
    while (guard-- > 0 && this.tiles.length > 1) {
      const first = this.tiles[0];
      const last = this.tiles[this.tiles.length - 1];
      if (first.x <= 0 || last.x < this.viewport) break;
      this.tiles.pop();
      this.tiles.unshift({ id: last.id, x: first.x - this.slot, detached: false });
    }
  }

  positionOf(id: ElementId): number | undefined {
    return this.tiles.find((t) => t.id === id)?.x;
  }

  /** Vecina en el orden de la cinta (para la navegación con flechas). */
  neighbor(id: ElementId, direction: 1 | -1): ElementId | undefined {
    const i = this.tiles.findIndex((t) => t.id === id);
    if (i < 0 || this.tiles.length === 0) return undefined;
    return this.tiles[(i + direction + this.tiles.length) % this.tiles.length].id;
  }

  /** Primera ficha visible por la izquierda. */
  firstVisible(): ElementId | undefined {
    return (this.tiles.find((t) => t.x >= -this.slot / 2) ?? this.tiles[0])?.id;
  }
}

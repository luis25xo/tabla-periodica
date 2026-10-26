/** Identificador interno, estable y único de un elemento (no se muestra al usuario). */
export type ElementId = string;

export type Block = 's' | 'p' | 'd';

/**
 * Criterio de selección del isótopo de referencia.
 * - `estable-mas-abundante`: isótopo natural de mayor abundancia (IUPAC/CIAAW).
 * - `mayor-semivida`: elemento sin isótopos estables; se usa el isótopo más estable conocido.
 */
export type IsotopeBasis = 'estable-mas-abundante' | 'mayor-semivida';

export interface ReferenceIsotope {
  /** Identificación interna del isótopo, p. ej. "Z6-A12". No se muestra en la interfaz. */
  key: string;
  /** Número de masa A = protones + neutrones. */
  massNumber: number;
  basis: IsotopeBasis;
  /** Nota interna sobre la elección cuando hay ambigüedad. */
  note?: string;
}

/** Coordenadas de la casilla en la cuadrícula de 18 grupos × 7 períodos. */
export interface GridCoord {
  /** Período (fila), de 1 a 7. */
  period: number;
  /** Grupo (columna), de 1 a 18. */
  group: number;
}

export interface ChemicalElement {
  id: ElementId;
  /** Nombre en español. */
  name: string;
  /** Símbolo químico (visible en las fichas del mostrador). */
  symbol: string;
  protons: number;
  electrons: number;
  neutrons: number;
  isotope: ReferenceIsotope;
  group: number;
  period: number;
  block: Block;
  cell: GridCoord;
  /** Electrones por nivel de energía (n = 1, 2, …) del estado fundamental usado en el modelo. */
  shells: number[];
}

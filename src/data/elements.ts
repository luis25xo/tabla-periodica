import type { Block, ChemicalElement, IsotopeBasis } from './types';
import { shellDistribution } from '../utils/electronConfiguration';

/**
 * Fuente de datos local de los 88 elementos jugables.
 *
 * Se excluyen por completo los lantánidos (Z 57–71) y los actínidos (Z 89–103).
 *
 * Isótopos de referencia (ver docs/DATOS-CIENTIFICOS.md):
 * - Elementos con isótopos estables (o primordiales): isótopo natural más abundante
 *   según las abundancias isotópicas de IUPAC/CIAAW.
 * - Elementos sin isótopos estables: isótopo más estable conocido, cuyo número másico
 *   es el que aparece entre corchetes en las tablas de referencia (Wikipedia, «List of
 *   chemical elements», consultada el 25-10-2026). Los valores de los superpesados pueden
 *   revisarse con nuevos experimentos.
 *
 * Neutrones = número másico del isótopo de referencia − protones (nunca a partir de la
 * masa atómica decimal).
 */

type Row = [
  z: number,
  id: string,
  name: string,
  group: number,
  period: number,
  massNumber: number,
  basis?: IsotopeBasis,
  note?: string,
];

const S: IsotopeBasis = 'estable-mas-abundante';
const R: IsotopeBasis = 'mayor-semivida';

const ROWS: readonly Row[] = [
  // Período 1
  [1, 'hidrogeno', 'Hidrógeno', 1, 1, 1],
  [2, 'helio', 'Helio', 18, 1, 4],
  // Período 2
  [3, 'litio', 'Litio', 1, 2, 7],
  [4, 'berilio', 'Berilio', 2, 2, 9],
  [5, 'boro', 'Boro', 13, 2, 11],
  [6, 'carbono', 'Carbono', 14, 2, 12],
  [7, 'nitrogeno', 'Nitrógeno', 15, 2, 14],
  [8, 'oxigeno', 'Oxígeno', 16, 2, 16],
  [9, 'fluor', 'Flúor', 17, 2, 19],
  [10, 'neon', 'Neón', 18, 2, 20],
  // Período 3
  [11, 'sodio', 'Sodio', 1, 3, 23],
  [12, 'magnesio', 'Magnesio', 2, 3, 24],
  [13, 'aluminio', 'Aluminio', 13, 3, 27],
  [14, 'silicio', 'Silicio', 14, 3, 28],
  [15, 'fosforo', 'Fósforo', 15, 3, 31],
  [16, 'azufre', 'Azufre', 16, 3, 32],
  [17, 'cloro', 'Cloro', 17, 3, 35],
  [18, 'argon', 'Argón', 18, 3, 40],
  // Período 4
  [19, 'potasio', 'Potasio', 1, 4, 39],
  [20, 'calcio', 'Calcio', 2, 4, 40],
  [21, 'escandio', 'Escandio', 3, 4, 45],
  [22, 'titanio', 'Titanio', 4, 4, 48],
  [23, 'vanadio', 'Vanadio', 5, 4, 51],
  [24, 'cromo', 'Cromo', 6, 4, 52],
  [25, 'manganeso', 'Manganeso', 7, 4, 55],
  [26, 'hierro', 'Hierro', 8, 4, 56],
  [27, 'cobalto', 'Cobalto', 9, 4, 59],
  [28, 'niquel', 'Níquel', 10, 4, 58],
  [29, 'cobre', 'Cobre', 11, 4, 63],
  [30, 'zinc', 'Zinc', 12, 4, 64],
  [31, 'galio', 'Galio', 13, 4, 69],
  [32, 'germanio', 'Germanio', 14, 4, 74],
  [33, 'arsenico', 'Arsénico', 15, 4, 75],
  [34, 'selenio', 'Selenio', 16, 4, 80],
  [35, 'bromo', 'Bromo', 17, 4, 79],
  [36, 'kripton', 'Kriptón', 18, 4, 84],
  // Período 5
  [37, 'rubidio', 'Rubidio', 1, 5, 85],
  [38, 'estroncio', 'Estroncio', 2, 5, 88],
  [39, 'itrio', 'Itrio', 3, 5, 89],
  [40, 'circonio', 'Circonio', 4, 5, 90],
  [41, 'niobio', 'Niobio', 5, 5, 93],
  [42, 'molibdeno', 'Molibdeno', 6, 5, 98],
  [43, 'tecnecio', 'Tecnecio', 7, 5, 97, R, 'Sin isótopos estables; Tc-97 (≈4,2 millones de años).'],
  [44, 'rutenio', 'Rutenio', 8, 5, 102],
  [45, 'rodio', 'Rodio', 9, 5, 103],
  [46, 'paladio', 'Paladio', 10, 5, 106],
  [47, 'plata', 'Plata', 11, 5, 107],
  [48, 'cadmio', 'Cadmio', 12, 5, 114],
  [49, 'indio', 'Indio', 13, 5, 115, S, 'In-115 es primordial (semivida ≈ 4,4·10¹⁴ años) y el más abundante.'],
  [50, 'estano', 'Estaño', 14, 5, 120],
  [51, 'antimonio', 'Antimonio', 15, 5, 121],
  [52, 'telurio', 'Telurio', 16, 5, 130, S, 'Te-130 (34,1 %) es primordial y el más abundante.'],
  [53, 'yodo', 'Yodo', 17, 5, 127],
  [54, 'xenon', 'Xenón', 18, 5, 132],
  // Período 6 (sin lantánidos 57–71: la casilla del grupo 3 queda reservada y vacía)
  [55, 'cesio', 'Cesio', 1, 6, 133],
  [56, 'bario', 'Bario', 2, 6, 138],
  [72, 'hafnio', 'Hafnio', 4, 6, 180],
  [73, 'tantalio', 'Tantalio', 5, 6, 181],
  [74, 'wolframio', 'Wolframio', 6, 6, 184],
  [75, 'renio', 'Renio', 7, 6, 187, S, 'Re-187 es primordial (semivida ≈ 4·10¹⁰ años) y el más abundante.'],
  [76, 'osmio', 'Osmio', 8, 6, 192],
  [77, 'iridio', 'Iridio', 9, 6, 193],
  [78, 'platino', 'Platino', 10, 6, 195],
  [79, 'oro', 'Oro', 11, 6, 197],
  [80, 'mercurio', 'Mercurio', 12, 6, 202],
  [81, 'talio', 'Talio', 13, 6, 205],
  [82, 'plomo', 'Plomo', 14, 6, 208],
  [83, 'bismuto', 'Bismuto', 15, 6, 209, S, 'Bi-209 es prácticamente estable (semivida ≈ 2·10¹⁹ años) y el único natural.'],
  [84, 'polonio', 'Polonio', 16, 6, 209, R],
  [85, 'astato', 'Astato', 17, 6, 210, R],
  [86, 'radon', 'Radón', 18, 6, 222, R],
  // Período 7 (sin actínidos 89–103: la casilla del grupo 3 queda reservada y vacía)
  [87, 'francio', 'Francio', 1, 7, 223, R],
  [88, 'radio', 'Radio', 2, 7, 226, R],
  [104, 'rutherfordio', 'Rutherfordio', 4, 7, 267, R],
  [105, 'dubnio', 'Dubnio', 5, 7, 268, R],
  [106, 'seaborgio', 'Seaborgio', 6, 7, 267, R],
  [107, 'bohrio', 'Bohrio', 7, 7, 270, R],
  [108, 'hasio', 'Hasio', 8, 7, 271, R],
  [109, 'meitnerio', 'Meitnerio', 9, 7, 278, R],
  [110, 'darmstatio', 'Darmstatio', 10, 7, 281, R],
  [111, 'roentgenio', 'Roentgenio', 11, 7, 282, R],
  [112, 'copernicio', 'Copernicio', 12, 7, 285, R],
  [113, 'nihonio', 'Nihonio', 13, 7, 286, R],
  [114, 'flerovio', 'Flerovio', 14, 7, 289, R],
  [115, 'moscovio', 'Moscovio', 15, 7, 290, R],
  [116, 'livermorio', 'Livermorio', 16, 7, 293, R],
  [117, 'teneso', 'Teneso', 17, 7, 294, R],
  [118, 'oganeson', 'Oganesón', 18, 7, 294, R],
];

/** Lantánidos y actínidos: excluidos del juego. */
export const EXCLUDED_ATOMIC_NUMBERS: readonly number[] = [
  ...Array.from({ length: 15 }, (_, i) => 57 + i),
  ...Array.from({ length: 15 }, (_, i) => 89 + i),
];

/** Símbolos químicos oficiales (IUPAC) por número atómico. Se muestran en las fichas del mostrador. */
const SYMBOLS: Readonly<Record<number, string>> = {
  1: 'H', 2: 'He', 3: 'Li', 4: 'Be', 5: 'B', 6: 'C', 7: 'N', 8: 'O', 9: 'F', 10: 'Ne',
  11: 'Na', 12: 'Mg', 13: 'Al', 14: 'Si', 15: 'P', 16: 'S', 17: 'Cl', 18: 'Ar',
  19: 'K', 20: 'Ca', 21: 'Sc', 22: 'Ti', 23: 'V', 24: 'Cr', 25: 'Mn', 26: 'Fe', 27: 'Co', 28: 'Ni',
  29: 'Cu', 30: 'Zn', 31: 'Ga', 32: 'Ge', 33: 'As', 34: 'Se', 35: 'Br', 36: 'Kr',
  37: 'Rb', 38: 'Sr', 39: 'Y', 40: 'Zr', 41: 'Nb', 42: 'Mo', 43: 'Tc', 44: 'Ru', 45: 'Rh', 46: 'Pd',
  47: 'Ag', 48: 'Cd', 49: 'In', 50: 'Sn', 51: 'Sb', 52: 'Te', 53: 'I', 54: 'Xe',
  55: 'Cs', 56: 'Ba', 72: 'Hf', 73: 'Ta', 74: 'W', 75: 'Re', 76: 'Os', 77: 'Ir', 78: 'Pt', 79: 'Au',
  80: 'Hg', 81: 'Tl', 82: 'Pb', 83: 'Bi', 84: 'Po', 85: 'At', 86: 'Rn',
  87: 'Fr', 88: 'Ra', 104: 'Rf', 105: 'Db', 106: 'Sg', 107: 'Bh', 108: 'Hs', 109: 'Mt', 110: 'Ds',
  111: 'Rg', 112: 'Cn', 113: 'Nh', 114: 'Fl', 115: 'Mc', 116: 'Lv', 117: 'Ts', 118: 'Og',
};

function blockFor(z: number, group: number): Block {
  if (z === 2 || group <= 2) return 's';
  if (group <= 12) return 'd';
  return 'p';
}

export const ELEMENTS: readonly ChemicalElement[] = Object.freeze(
  ROWS.map(([z, id, name, group, period, massNumber, basis = S, note]) =>
    Object.freeze<ChemicalElement>({
      id,
      name,
      symbol: SYMBOLS[z],
      protons: z,
      electrons: z,
      neutrons: massNumber - z,
      isotope: { key: `Z${z}-A${massNumber}`, massNumber, basis, ...(note ? { note } : {}) },
      group,
      period,
      block: blockFor(z, group),
      cell: { period, group },
      shells: shellDistribution(z),
    }),
  ),
);

export const TOTAL_ELEMENTS = ELEMENTS.length;

export const ELEMENTS_BY_ID: ReadonlyMap<string, ChemicalElement> = new Map(ELEMENTS.map((e) => [e.id, e]));

export const ALL_ELEMENT_IDS: readonly string[] = ELEMENTS.map((e) => e.id);

export function getElement(id: string): ChemicalElement | undefined {
  return ELEMENTS_BY_ID.get(id);
}

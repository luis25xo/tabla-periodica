/**
 * Distribución de electrones por niveles de energía (modelo didáctico de capas).
 *
 * Se parte del orden de llenado de Madelung (regla n + l) y se aplican las excepciones
 * conocidas del estado fundamental para los elementos incluidos en el juego. Para los
 * elementos superpesados (104–118) se usa la configuración predicha habitual, que coincide
 * con la regla de Madelung.
 */

type Subshell = { n: number; l: number };

const L_CAPACITY = [2, 6, 10, 14];

/** Orden de llenado de Madelung hasta 7p. */
export const MADELUNG_ORDER: readonly Subshell[] = (() => {
  const list: Subshell[] = [];
  for (let n = 1; n <= 7; n++) {
    for (let l = 0; l < Math.min(n, 4); l++) list.push({ n, l });
  }
  return list.sort((a, b) => a.n + a.l - (b.n + b.l) || a.n - b.n);
})();

/**
 * Excepciones del estado fundamental (configuraciones experimentales, NIST ASD) que afectan
 * al reparto por niveles. Se expresan como ajustes sobre la configuración de Madelung:
 * clave = "n,l" y valor = electrones finales en esa subcapa.
 */
const EXCEPTIONS: Record<number, Record<string, number>> = {
  24: { '3,2': 5, '4,0': 1 }, // Cromo: [Ar] 3d5 4s1
  29: { '3,2': 10, '4,0': 1 }, // Cobre: [Ar] 3d10 4s1
  41: { '4,2': 4, '5,0': 1 }, // Niobio: [Kr] 4d4 5s1
  42: { '4,2': 5, '5,0': 1 }, // Molibdeno: [Kr] 4d5 5s1
  44: { '4,2': 7, '5,0': 1 }, // Rutenio: [Kr] 4d7 5s1
  45: { '4,2': 8, '5,0': 1 }, // Rodio: [Kr] 4d8 5s1
  46: { '4,2': 10, '5,0': 0 }, // Paladio: [Kr] 4d10
  47: { '4,2': 10, '5,0': 1 }, // Plata: [Kr] 4d10 5s1
  78: { '5,2': 9, '6,0': 1 }, // Platino: [Xe] 4f14 5d9 6s1
  79: { '5,2': 10, '6,0': 1 }, // Oro: [Xe] 4f14 5d10 6s1
};

/** Ocupación de cada subcapa ("n,l" → electrones) para un átomo neutro con Z electrones. */
export function subshellOccupancy(electrons: number): Map<string, number> {
  if (!Number.isInteger(electrons) || electrons < 1 || electrons > 118) {
    throw new RangeError(`Número de electrones no válido: ${electrons}`);
  }
  const occ = new Map<string, number>();
  let remaining = electrons;
  for (const { n, l } of MADELUNG_ORDER) {
    if (remaining <= 0) break;
    const take = Math.min(L_CAPACITY[l], remaining);
    occ.set(`${n},${l}`, take);
    remaining -= take;
  }
  const exception = EXCEPTIONS[electrons];
  if (exception) {
    for (const [key, value] of Object.entries(exception)) occ.set(key, value);
  }
  return occ;
}

/** Electrones por nivel de energía n = 1…7 (sin niveles vacíos al final). */
export function shellDistribution(electrons: number): number[] {
  const shells = [0, 0, 0, 0, 0, 0, 0];
  for (const [key, count] of subshellOccupancy(electrons)) {
    const n = Number(key.split(',')[0]);
    shells[n - 1] += count;
  }
  while (shells.length > 0 && shells[shells.length - 1] === 0) shells.pop();
  return shells;
}

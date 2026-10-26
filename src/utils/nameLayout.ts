/**
 * Ajuste del nombre de un elemento dentro de su casilla: una línea si cabe con un tamaño
 * legible; si no, dos líneas partidas por una frontera silábica aproximada del español.
 */

const VOWELS = new Set('aeiouáéíóúü');
/** Grupos consonánticos que no se separan en español (más "th" de nombres como Rutherfordio). */
const INSEPARABLE = new Set(['bl', 'br', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr', 'pl', 'pr', 'tr', 'ch', 'll', 'rr', 'th']);

/** Anchura media de un carácter en em (Inter, peso 600). */
const CHAR_EM = 0.6;
const MIN_ONE_LINE_PX = 9;

const isVowel = (c: string) => VOWELS.has(c.toLowerCase());

/** Divide un nombre en dos partes por la frontera silábica más cercana al centro. */
export function splitName(name: string): [string, string] | null {
  const lower = name.toLowerCase();
  let best: number | null = null;
  for (let i = 2; i <= lower.length - 3; i++) {
    const prev = lower[i - 1];
    const cur = lower[i];
    const next = lower[i + 1];
    // V|CV
    const vcv = isVowel(prev) && !isVowel(cur) && isVowel(next);
    // VC|CV, salvo grupos inseparables
    const vccv = !isVowel(prev) && i >= 2 && isVowel(lower[i - 2]) && !isVowel(cur) && isVowel(next) && !INSEPARABLE.has(prev + cur);
    // VCC|CV (p. ej. Roent-genio)
    const vcccv =
      i >= 3 && isVowel(lower[i - 3]) && !isVowel(lower[i - 2]) && !isVowel(prev) && !isVowel(cur) && isVowel(next) && !INSEPARABLE.has(prev + cur);
    if ((vcv || vccv || vcccv) &&(best === null || Math.abs(i - lower.length / 2) < Math.abs(best - lower.length / 2))) best = i;
  }
  return best === null ? null : [name.slice(0, best), name.slice(best)];
}

export interface NameLayout {
  lines: string[];
  fontSize: number;
}

export function layoutName(name: string, cellSize: number): NameLayout {
  const available = cellSize - 8;
  // El nombre comparte la casilla con el símbolo químico, que ocupa la parte superior.
  const maxSize = Math.min(cellSize * 0.15, 14);
  const oneLine = Math.min(maxSize, available / (name.length * CHAR_EM));
  if (oneLine >= MIN_ONE_LINE_PX) return { lines: [name], fontSize: oneLine };
  const parts = splitName(name);
  if (!parts) return { lines: [name], fontSize: oneLine };
  const longest = Math.max(parts[0].length + 1, parts[1].length);
  const twoLines = Math.min(maxSize, available / (longest * CHAR_EM));
  return twoLines > oneLine ? { lines: parts, fontSize: twoLines } : { lines: [name], fontSize: oneLine };
}

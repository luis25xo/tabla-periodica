import { ELEMENTS } from '../data/elements';
import type { ElementId } from '../data/types';

/** Minúsculas y sin tildes, para que "oxigeno" encuentre "Oxígeno". */
export function normalize(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}

const INDEX = ELEMENTS.map((e) => ({ id: e.id, name: e.name, symbol: normalize(e.symbol), key: normalize(e.name) }));

/**
 * Busca elementos por nombre o símbolo. Orden de relevancia:
 * símbolo exacto, nombre que empieza por la búsqueda, símbolo que empieza por ella y nombre que la contiene.
 */
export function searchElements(query: string, limit = 8): ElementId[] {
  const q = normalize(query);
  if (!q) return [];
  const scored: { id: ElementId; name: string; score: number }[] = [];
  for (const e of INDEX) {
    const score = e.symbol === q ? 0 : e.key.startsWith(q) ? 1 : e.symbol.startsWith(q) ? 2 : e.key.includes(q) ? 3 : -1;
    if (score >= 0) scored.push({ id: e.id, name: e.name, score });
  }
  scored.sort((a, b) => a.score - b.score || a.name.localeCompare(b.name, 'es'));
  return scored.slice(0, limit).map((s) => s.id);
}

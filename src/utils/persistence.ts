import type { ElementId } from '../data/types';
import { isValidOrder, isValidPlacedList } from '../state/gameReducer';

/**
 * Solo se guarda lo imprescindible para restaurar la partida: el orden del mostrador,
 * los elementos colocados y el número de errores. Todo lo demás (progreso, casillas
 * ocupadas, aciertos) se deriva de esos datos y así no puede quedar incoherente.
 */
export interface SavedGame {
  version: 1;
  order: ElementId[];
  placed: ElementId[];
  errors: number;
}

export const STORAGE_KEY = 'tabla-periodica:partida';

function storage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function parseSavedGame(raw: string | null): SavedGame | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Partial<SavedGame>;
    if (data.version !== 1 || !Array.isArray(data.order) || !Array.isArray(data.placed)) return null;
    if (!data.order.every((x) => typeof x === 'string') || !data.placed.every((x) => typeof x === 'string')) return null;
    if (!isValidOrder(data.order) || !isValidPlacedList(data.placed)) return null;
    const errors = typeof data.errors === 'number' && Number.isFinite(data.errors) && data.errors >= 0 ? Math.floor(data.errors) : 0;
    return { version: 1, order: data.order, placed: data.placed, errors };
  } catch {
    return null;
  }
}

export function loadSavedGame(): SavedGame | null {
  const s = storage();
  if (!s) return null;
  try {
    return parseSavedGame(s.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

export function saveGame(game: Omit<SavedGame, 'version'>): void {
  const s = storage();
  if (!s) return;
  try {
    s.setItem(STORAGE_KEY, JSON.stringify({ version: 1, ...game } satisfies SavedGame));
  } catch {
    // Sin almacenamiento disponible: la partida sigue funcionando sin persistencia.
  }
}

export function clearSavedGame(): void {
  try {
    storage()?.removeItem(STORAGE_KEY);
  } catch {
    // Ignorado.
  }
}

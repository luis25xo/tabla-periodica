import { ALL_ELEMENT_IDS, ELEMENTS_BY_ID, TOTAL_ELEMENTS } from '../data/elements';
import type { ElementId, GridCoord } from '../data/types';
import { cellKey } from '../utils/periodicTable';
import { validatePlacement, type PlacementResult } from '../utils/validation';

export type Phase = 'start' | 'playing' | 'completed';

export interface Feedback {
  kind: Exclude<PlacementResult, 'invalid'>;
  cellKey: string;
  elementId: ElementId;
  /** Secuencia creciente para relanzar animaciones aunque se repita la casilla. */
  seq: number;
}

export interface CardState {
  elementId: ElementId;
  flipped: boolean;
}

export interface GameState {
  phase: Phase;
  /** Orden aleatorio de las 88 fichas para esta partida. */
  order: ElementId[];
  /** Elementos colocados correctamente, en el orden en que se acertaron (registro de aciertos). */
  placed: ElementId[];
  /** Ficha seleccionada (fuera de la cinta, en el soporte de selección). */
  selectedId: ElementId | null;
  /** Ficha que se está arrastrando. */
  draggingId: ElementId | null;
  card: CardState | null;
  /** Modo de colocación accesible (clic o teclado sobre las casillas). */
  placementMode: boolean;
  errors: number;
  paused: boolean;
  feedback: Feedback | null;
}

export type GameAction =
  | { type: 'NEW_GAME'; order: ElementId[]; paused?: boolean }
  | { type: 'RESTORE'; order: ElementId[]; placed: ElementId[]; errors: number; paused?: boolean }
  | { type: 'SELECT'; id: ElementId }
  | { type: 'DESELECT' }
  | { type: 'OPEN_CARD'; id: ElementId }
  | { type: 'FLIP_CARD' }
  | { type: 'CLOSE_CARD' }
  | { type: 'START_DRAG'; id: ElementId }
  | { type: 'CANCEL_DRAG' }
  | { type: 'SET_PLACEMENT_MODE'; active: boolean }
  | { type: 'ATTEMPT_PLACEMENT'; id: ElementId; target: GridCoord }
  | { type: 'SET_PAUSED'; paused: boolean }
  | { type: 'TOGGLE_PAUSE' };

export const initialGameState: GameState = {
  phase: 'start',
  order: [],
  placed: [],
  selectedId: null,
  draggingId: null,
  card: null,
  placementMode: false,
  errors: 0,
  paused: false,
  feedback: null,
};

/** Comprueba que el orden es una permutación exacta de los 88 identificadores. */
export function isValidOrder(order: readonly ElementId[]): boolean {
  if (order.length !== TOTAL_ELEMENTS) return false;
  const set = new Set(order);
  return set.size === TOTAL_ELEMENTS && ALL_ELEMENT_IDS.every((id) => set.has(id));
}

export function isValidPlacedList(placed: readonly ElementId[]): boolean {
  return new Set(placed).size === placed.length && placed.every((id) => ELEMENTS_BY_ID.has(id));
}

function isAvailable(state: GameState, id: ElementId): boolean {
  return state.phase === 'playing' && ELEMENTS_BY_ID.has(id) && !state.placed.includes(id);
}

/** Fichas aún no colocadas, en el orden de la partida. */
export function selectAvailable(order: readonly ElementId[], placed: readonly ElementId[]): ElementId[] {
  const placedSet = new Set(placed);
  return order.filter((id) => !placedSet.has(id));
}

export function selectOccupiedCells(placed: readonly ElementId[]): Set<string> {
  const keys = new Set<string>();
  for (const id of placed) {
    const element = ELEMENTS_BY_ID.get(id);
    if (element) keys.add(cellKey(element.cell));
  }
  return keys;
}

let feedbackSeq = 0;

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'NEW_GAME': {
      if (!isValidOrder(action.order)) return state;
      return { ...initialGameState, phase: 'playing', order: action.order.slice(), paused: action.paused ?? false };
    }

    case 'RESTORE': {
      if (!isValidOrder(action.order) || !isValidPlacedList(action.placed)) return state;
      const complete = action.placed.length === TOTAL_ELEMENTS;
      return {
        ...initialGameState,
        phase: complete ? 'completed' : 'playing',
        order: action.order.slice(),
        placed: action.placed.slice(),
        errors: Math.max(0, Math.floor(action.errors) || 0),
        paused: complete ? true : (action.paused ?? false),
      };
    }

    case 'SELECT': {
      if (!isAvailable(state, action.id) || state.draggingId) return state;
      return { ...state, selectedId: action.id, placementMode: false };
    }

    case 'DESELECT':
      return { ...state, selectedId: null, placementMode: false, card: null };

    case 'OPEN_CARD': {
      if (!isAvailable(state, action.id) || state.draggingId) return state;
      return { ...state, selectedId: action.id, placementMode: false, card: { elementId: action.id, flipped: false } };
    }

    case 'FLIP_CARD':
      return state.card ? { ...state, card: { ...state.card, flipped: !state.card.flipped } } : state;

    case 'CLOSE_CARD':
      return state.card ? { ...state, card: null } : state;

    case 'START_DRAG': {
      if (!isAvailable(state, action.id) || state.card) return state;
      return {
        ...state,
        draggingId: action.id,
        selectedId: state.selectedId === action.id ? null : state.selectedId,
        placementMode: false,
      };
    }

    case 'CANCEL_DRAG':
      return state.draggingId ? { ...state, draggingId: null } : state;

    case 'SET_PLACEMENT_MODE': {
      if (action.active && (!state.selectedId || state.phase !== 'playing')) return state;
      return { ...state, placementMode: action.active, card: action.active ? null : state.card };
    }

    case 'ATTEMPT_PLACEMENT': {
      if (state.phase !== 'playing') return state;
      const placedSet = new Set(state.placed);
      const result = validatePlacement(action.id, action.target, selectOccupiedCells(state.placed), placedSet);
      // La ficha implicada sale siempre de la mano: se coloca o vuelve a la cinta.
      const released: GameState = {
        ...state,
        draggingId: state.draggingId === action.id ? null : state.draggingId,
        selectedId: state.selectedId === action.id ? null : state.selectedId,
        placementMode: false,
        card: null,
      };
      if (result === 'invalid') return released;

      const feedback: Feedback = { kind: result, cellKey: cellKey(action.target), elementId: action.id, seq: ++feedbackSeq };

      if (result === 'correct') {
        const placed = [...state.placed, action.id];
        const complete = placed.length === TOTAL_ELEMENTS;
        return {
          ...released,
          placed,
          feedback,
          phase: complete ? 'completed' : 'playing',
          paused: complete ? true : state.paused,
        };
      }
      // Incorrecta: suma un error. Casilla ocupada: se rechaza sin penalizar.
      return { ...released, feedback, errors: result === 'incorrect' ? state.errors + 1 : state.errors };
    }

    case 'SET_PAUSED':
      return state.phase === 'playing' || !action.paused ? { ...state, paused: action.paused } : state;

    case 'TOGGLE_PAUSE':
      return state.phase === 'playing' ? { ...state, paused: !state.paused } : state;

    default:
      return state;
  }
}

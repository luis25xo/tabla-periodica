import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { ALL_ELEMENT_IDS, TOTAL_ELEMENTS } from '../data/elements';
import type { ElementId } from '../data/types';
import { gameReducer, initialGameState, selectAvailable, selectOccupiedCells, type GameState } from '../state/gameReducer';
import { clearSavedGame, loadSavedGame, saveGame, type SavedGame } from '../utils/persistence';
import { shuffle } from '../utils/shuffle';
import { prefersReducedMotion } from './useReducedMotion';

/**
 * Estado centralizado de la partida: reductor puro + persistencia local + datos derivados.
 */
export function useGame() {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  const [savedGame, setSavedGame] = useState<SavedGame | null>(() => loadSavedGame());

  // Referencia siempre actualizada para validar de forma síncrona durante el arrastre.
  const stateRef = useRef<GameState>(state);
  stateRef.current = state;

  useEffect(() => {
    if (state.phase === 'playing') {
      saveGame({ order: state.order, placed: state.placed, errors: state.errors });
    } else if (state.phase === 'completed') {
      clearSavedGame();
    }
  }, [state.phase, state.order, state.placed, state.errors]);

  const newGame = useCallback(() => {
    clearSavedGame();
    setSavedGame(null);
    dispatch({ type: 'NEW_GAME', order: shuffle(ALL_ELEMENT_IDS), paused: prefersReducedMotion() });
  }, []);

  const continueGame = useCallback(() => {
    if (!savedGame) return;
    dispatch({ type: 'RESTORE', ...savedGame, paused: prefersReducedMotion() });
    setSavedGame(null);
  }, [savedGame]);

  const available = useMemo(() => selectAvailable(state.order, state.placed), [state.order, state.placed]);
  const occupiedCells = useMemo(() => selectOccupiedCells(state.placed), [state.placed]);
  const placedSet = useMemo(() => new Set<ElementId>(state.placed), [state.placed]);
  /** Fichas que se dibujan en la cinta: disponibles salvo la seleccionada (está en el soporte). */
  const beltIds = useMemo(() => available.filter((id) => id !== state.selectedId), [available, state.selectedId]);

  return {
    state,
    stateRef,
    dispatch,
    savedGame,
    newGame,
    continueGame,
    available,
    beltIds,
    occupiedCells,
    placedSet,
    placedCount: state.placed.length,
    total: TOTAL_ELEMENTS,
  };
}

export type GameApi = ReturnType<typeof useGame>;

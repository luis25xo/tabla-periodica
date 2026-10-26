import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ELEMENTS_BY_ID, getElement } from './data/elements';
import type { ChemicalElement, ElementId, GridCoord } from './data/types';
import { useDragAndDrop } from './hooks/useDragAndDrop';
import { useGame } from './hooks/useGame';
import { useReducedMotion } from './hooks/useReducedMotion';
import { selectOccupiedCells } from './state/gameReducer';
import { cellKey } from './utils/periodicTable';
import { validatePlacement } from './utils/validation';
import { CompletionScreen } from './components/CompletionScreen';
import { ConfirmDialog } from './components/ConfirmDialog';
import { DragGhost } from './components/DragGhost';
import { ElementCard } from './components/ElementCard';
import { ElementConveyor } from './components/ElementConveyor';
import { ElementSearch } from './components/ElementSearch';
import { FeedbackToast } from './components/FeedbackToast';
import { GameControls } from './components/GameControls';
import { PeriodicTable } from './components/PeriodicTable';
import { ProgressIndicator } from './components/ProgressIndicator';
import { SelectedTileHolder } from './components/SelectedTileHolder';
import { StartScreen } from './components/StartScreen';

export function App() {
  const game = useGame();
  const { state, stateRef, dispatch, beltIds, placedCount, total } = game;
  const reducedMotion = useReducedMotion();
  const [confirmingRestart, setConfirmingRestart] = useState(false);
  const conveyorRef = useRef<HTMLElement>(null);

  useEffect(() => {
    document.title = __PRODUCT_NAME__;
  }, []);

  const playing = state.phase === 'playing';
  const modalOpen = state.card !== null || confirmingRestart || state.phase !== 'playing';
  const interactive = playing && !modalOpen;

  const placedByCell = useMemo(() => {
    const map = new Map<string, ChemicalElement>();
    for (const id of state.placed) {
      const element = ELEMENTS_BY_ID.get(id);
      if (element) map.set(cellKey(element.cell), element);
    }
    return map;
  }, [state.placed]);

  // ---- Arrastrar y soltar -------------------------------------------------------------
  const { ghost, ghostRef, beginPointer } = useDragAndDrop({
    enabled: interactive,
    reducedMotion,
    getFace: (id) => {
      const element = getElement(id);
      return { name: element?.name ?? '', symbol: element?.symbol ?? '' };
    },
    onDragStart: (id) => dispatch({ type: 'START_DRAG', id }),
    onDragCancel: () => dispatch({ type: 'CANCEL_DRAG' }),
    onDrop: (id, target) => {
      const current = stateRef.current;
      const result = validatePlacement(id, target, selectOccupiedCells(current.placed), new Set(current.placed));
      dispatch({ type: 'ATTEMPT_PLACEMENT', id, target });
      return result;
    },
    getReturnRect: () => conveyorRef.current?.getBoundingClientRect() ?? null,
  });

  // ---- Acciones -----------------------------------------------------------------------
  const openCard = useCallback((id: ElementId) => dispatch({ type: 'OPEN_CARD', id }), [dispatch]);
  const flipCard = useCallback(() => dispatch({ type: 'FLIP_CARD' }), [dispatch]);
  const closeCard = useCallback(() => dispatch({ type: 'CLOSE_CARD' }), [dispatch]);
  const releaseSelection = useCallback(() => dispatch({ type: 'DESELECT' }), [dispatch]);
  const togglePause = useCallback(() => dispatch({ type: 'TOGGLE_PAUSE' }), [dispatch]);
  const togglePlacement = useCallback(
    () => dispatch({ type: 'SET_PLACEMENT_MODE', active: !stateRef.current.placementMode }),
    [dispatch, stateRef],
  );
  const exitPlacement = useCallback(() => dispatch({ type: 'SET_PLACEMENT_MODE', active: false }), [dispatch]);

  // El elemento encontrado sale del mostrador y queda en el soporte, listo para arrastrarlo o colocarlo.
  const pickFromSearch = useCallback(
    (id: ElementId) => {
      dispatch({ type: 'SELECT', id });
      requestAnimationFrame(() => document.querySelector<HTMLElement>('[data-holder-tile="true"]')?.focus());
    },
    [dispatch],
  );

  const onCellActivate = useCallback(
    (coord: GridCoord) => {
      const current = stateRef.current;
      if (current.phase !== 'playing' || current.card || !current.selectedId) return;
      dispatch({ type: 'ATTEMPT_PLACEMENT', id: current.selectedId, target: coord });
    },
    [dispatch, stateRef],
  );

  const confirmRestart = useCallback(() => {
    setConfirmingRestart(false);
    game.newGame();
  }, [game]);

  // Escape cancela el modo de colocación aunque el foco no esté en la tabla.
  useEffect(() => {
    if (!state.placementMode) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') exitPlacement();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state.placementMode, exitPlacement]);

  const cardElement = state.card ? getElement(state.card.elementId) : undefined;
  const selectedName = state.selectedId ? getElement(state.selectedId)?.name : undefined;

  return (
    <div className={`app${reducedMotion ? ' reduce-motion' : ''}`}>
      <div className="app-shell" inert={modalOpen}>
        <header className="topbar">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true" />
            <div>
              <h1 className="brand-title">Tabla periódica</h1>
              <p className="brand-subtitle">Coloca cada elemento en su casilla</p>
            </div>
          </div>
          <ProgressIndicator placed={placedCount} total={total} errors={state.errors} />
          <ElementSearch placedSet={game.placedSet} selectedId={state.selectedId} disabled={!interactive} onPick={pickFromSearch} />
          <GameControls
            paused={state.paused}
            disabled={!playing}
            onTogglePause={togglePause}
            onRestart={() => setConfirmingRestart(true)}
          />
        </header>

        <main className="table-area">
          <p className="rotate-hint">Desliza la tabla para ver todos los grupos, o gira el teléfono para verla más grande.</p>
          {state.placementMode && selectedName && (
            <p className="placement-banner" role="status">
              Elige la casilla de <strong>{selectedName}</strong>: haz clic o usa las flechas e Intro. Escape para cancelar.
            </p>
          )}
          <PeriodicTable
            placedByCell={placedByCell}
            feedback={state.feedback}
            targetable={interactive && state.selectedId !== null}
            placementMode={interactive && state.placementMode}
            completed={state.phase === 'completed'}
            onCellActivate={onCellActivate}
            onExitPlacementMode={exitPlacement}
          />
        </main>

        <footer className="dock" ref={conveyorRef}>
          <SelectedTileHolder
            selectedId={state.selectedId}
            placementMode={state.placementMode}
            interactive={interactive}
            onOpenCard={openCard}
            onTogglePlacement={togglePlacement}
            onRelease={releaseSelection}
            onTilePointerDown={beginPointer}
          />
          <ElementConveyor
            beltIds={beltIds}
            liftedId={state.draggingId}
            paused={state.paused || !playing}
            interactive={interactive}
            onOpen={openCard}
            onTogglePause={togglePause}
            onTilePointerDown={beginPointer}
          />
        </footer>
      </div>

      <FeedbackToast feedback={state.feedback} />
      <DragGhost ghost={ghost} ghostRef={ghostRef} />

      {cardElement && state.card && (
        <ElementCard
          key={cardElement.id}
          element={cardElement}
          flipped={state.card.flipped}
          reducedMotion={reducedMotion}
          onFlip={flipCard}
          onClose={closeCard}
        />
      )}

      {confirmingRestart && (
        <ConfirmDialog
          title="¿Reiniciar la partida?"
          message="Se borrará el progreso actual y las fichas se mezclarán de nuevo."
          confirmLabel="Reiniciar"
          onConfirm={confirmRestart}
          onCancel={() => setConfirmingRestart(false)}
        />
      )}

      {state.phase === 'start' && (
        <StartScreen
          savedPlaced={game.savedGame ? game.savedGame.placed.length : null}
          total={total}
          onNewGame={game.newGame}
          onContinue={game.continueGame}
        />
      )}

      {state.phase === 'completed' && (
        <CompletionScreen total={total} errors={state.errors} reducedMotion={reducedMotion} onNewGame={game.newGame} />
      )}
    </div>
  );
}

import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type RefObject,
} from 'react';
import type { ChemicalElement, GridCoord } from '../data/types';
import type { Feedback } from '../state/gameReducer';
import { GRID, GROUPS, PERIODS, PLAYABLE_CELLS, cellKey, neighborPlayableCell } from '../utils/periodicTable';
import { ElementCell } from './ElementCell';

interface Props {
  /** Casilla → elemento colocado en ella. */
  placedByCell: ReadonlyMap<string, ChemicalElement>;
  feedback: Feedback | null;
  /** Hay una ficha seleccionada que puede colocarse con clic. */
  targetable: boolean;
  placementMode: boolean;
  completed: boolean;
  onCellActivate: (coord: GridCoord) => void;
  onExitPlacementMode: () => void;
}

const MIN_CELL = 52;
/** En pantallas pequeñas (teléfonos) se permiten casillas algo menores; la tabla se desplaza. */
const MIN_CELL_COMPACT = 44;

function minCellSize(): number {
  return window.innerWidth < 900 || window.innerHeight < 560 ? MIN_CELL_COMPACT : MIN_CELL;
}
const MAX_CELL = 104;
const GAP = 4;

/** Calcula el lado de casilla que cabe en el área disponible sin deformar la cuadrícula. */
function useCellSize(ref: RefObject<HTMLElement | null>): number {
  const [size, setSize] = useState(64);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const width = el.clientWidth - 24;
      const height = el.clientHeight - 16;
      // 18 grupos + columna de períodos (0,5) y 7 períodos + fila de grupos (0,5).
      const byWidth = (width - GAP * GROUPS) / (GROUPS + 0.5);
      const byHeight = (height - GAP * PERIODS) / (PERIODS + 0.5);
      const next = Math.floor(Math.max(minCellSize(), Math.min(MAX_CELL, byWidth, byHeight)));
      setSize((prev) => (prev === next ? prev : next));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

const NAV_KEYS: Record<string, [number, number]> = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
};

/** Cuadrícula de 18 grupos × 7 períodos, sin filas de lantánidos ni actínidos. */
export const PeriodicTable = memo(function PeriodicTable({
  placedByCell,
  feedback,
  targetable,
  placementMode,
  completed,
  onCellActivate,
  onExitPlacementMode,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const cellSize = useCellSize(scrollRef);
  const [activeKey, setActiveKey] = useState<string>(PLAYABLE_CELLS[0].key);

  const focusCell = useCallback((key: string) => {
    setActiveKey(key);
    gridRef.current?.querySelector<HTMLElement>(`[data-cell-key="${key}"]`)?.focus();
  }, []);

  // Al activar el modo de colocación se enfoca la primera casilla libre (o la última usada si sigue libre).
  useEffect(() => {
    if (!placementMode) return;
    const current = placedByCell.has(activeKey) ? null : activeKey;
    const firstFree = current ?? PLAYABLE_CELLS.find((c) => !placedByCell.has(c.key))?.key;
    if (firstFree) requestAnimationFrame(() => focusCell(firstFree));
    // Solo al entrar en el modo; no debe recolocar el foco tras cada acierto.
  }, [placementMode]);

  const onNavigate = useCallback(
    (coord: GridCoord, event: KeyboardEvent<HTMLButtonElement>) => {
      if (!placementMode) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        onExitPlacementMode();
        return;
      }
      const dir = NAV_KEYS[event.key];
      if (dir) {
        event.preventDefault();
        const next = neighborPlayableCell(coord, dir[0], dir[1]);
        if (next) focusCell(cellKey(next));
        return;
      }
      if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault();
        const list = event.key === 'Home' ? PLAYABLE_CELLS : [...PLAYABLE_CELLS].reverse();
        focusCell(list[0].key);
      }
    },
    [placementMode, onExitPlacementMode, focusCell],
  );

  const onActivate = useCallback(
    (coord: GridCoord) => {
      setActiveKey(cellKey(coord));
      onCellActivate(coord);
    },
    [onCellActivate],
  );

  const style = useMemo(() => ({ '--cell': `${cellSize}px`, '--gap': `${GAP}px` }) as CSSProperties, [cellSize]);

  return (
    <div className="table-scroll" ref={scrollRef}>
      <div
        ref={gridRef}
        className={`periodic-grid${placementMode ? ' is-placing' : ''}${completed ? ' is-complete' : ''}`}
        style={style}
        role="group"
        aria-label="Tabla periódica: 18 grupos y 7 períodos, sin lantánidos ni actínidos"
        data-testid="periodic-table"
      >
        {Array.from({ length: GROUPS }, (_, i) => (
          <div key={`g${i}`} className="axis-label axis-label--group" style={{ gridRow: 1, gridColumn: i + 2 }} aria-hidden="true">
            {i + 1}
          </div>
        ))}
        {Array.from({ length: PERIODS }, (_, i) => (
          <div key={`p${i}`} className="axis-label axis-label--period" style={{ gridRow: i + 2, gridColumn: 1 }} aria-hidden="true">
            {i + 1}
          </div>
        ))}
        {GRID.map((cell) => {
          const placed = placedByCell.get(cell.key);
          const fb = feedback && feedback.cellKey === cell.key ? feedback : null;
          return (
            <ElementCell
              key={cell.key}
              cell={cell}
              cellSize={cellSize}
              placedName={placed?.name ?? null}
              placedSymbol={placed?.symbol ?? null}
              feedbackKind={fb ? fb.kind : null}
              feedbackSeq={fb ? fb.seq : 0}
              targetable={targetable}
              tabbable={placementMode && cell.key === activeKey}
              onActivate={onActivate}
              onNavigate={onNavigate}
            />
          );
        })}
      </div>
    </div>
  );
});

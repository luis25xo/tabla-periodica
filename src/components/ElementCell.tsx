import { memo, type CSSProperties, type KeyboardEvent } from 'react';
import type { GridCoord } from '../data/types';
import type { Feedback } from '../state/gameReducer';
import { layoutName } from '../utils/nameLayout';
import type { GridCell } from '../utils/periodicTable';

interface Props {
  cell: GridCell;
  /** Lado de la casilla en px, para ajustar el nombre. */
  cellSize: number;
  /** Nombre del elemento colocado, o null si la casilla está vacía. */
  placedName: string | null;
  /** Símbolo químico del elemento colocado, o null si la casilla está vacía. */
  placedSymbol: string | null;
  feedbackKind: Feedback['kind'] | null;
  feedbackSeq: number;
  /** Hay una ficha seleccionada que se puede colocar con clic. */
  targetable: boolean;
  /** Recibe el foco del teclado en el modo de colocación. */
  tabbable: boolean;
  onActivate: (coord: GridCoord) => void;
  onNavigate: (coord: GridCoord, event: KeyboardEvent<HTMLButtonElement>) => void;
}

/**
 * Contenido de una casilla colocada: símbolo químico destacado y, debajo, el nombre ajustado
 * a la casilla (una línea o dos partidas por sílaba; el guion es decorativo).
 */
function CellContent({ name, symbol, cellSize }: { name: string; symbol: string; cellSize: number }) {
  const { lines, fontSize } = layoutName(name, cellSize);
  const symbolSize = Math.min(cellSize * 0.3, 28);
  return (
    <span className="cell-content">
      <span className="cell-symbol" style={{ fontSize: `${symbolSize.toFixed(2)}px` }}>
        {symbol}
      </span>
      <span className="cell-name" lang="es" style={{ fontSize: `${fontSize.toFixed(2)}px` }}>
        {lines.map((line, i) => (
          <span key={i} className={`cell-name-line${i < lines.length - 1 ? ' cell-name-line--hyphen' : ''}`}>
            {line}
          </span>
        ))}
      </span>
    </span>
  );
}

/** Casilla individual de la tabla periódica (zona de destino). */
export const ElementCell = memo(function ElementCell({
  cell,
  cellSize,
  placedName,
  placedSymbol,
  feedbackKind,
  feedbackSeq,
  targetable,
  tabbable,
  onActivate,
  onNavigate,
}: Props) {
  const style = { gridRow: cell.period + 1, gridColumn: cell.group + 1 } as CSSProperties;

  if (cell.kind !== 'playable') {
    return <div className={`cell cell--${cell.kind}`} style={style} aria-hidden="true" />;
  }

  const filled = placedName !== null;
  const classes = ['cell', 'cell--playable'];
  if (filled) classes.push('cell--filled');
  if (targetable && !filled) classes.push('cell--targetable');
  if (feedbackKind) classes.push(`cell--${feedbackKind}-${feedbackSeq % 2}`);

  const label = filled
    ? `${placedName} (${placedSymbol}), colocado en el período ${cell.period}, grupo ${cell.group}`
    : `Casilla vacía, período ${cell.period}, grupo ${cell.group}`;

  return (
    <button
      type="button"
      className={classes.join(' ')}
      style={style}
      data-drop-cell="true"
      data-cell-key={cell.key}
      data-filled={filled ? 'true' : 'false'}
      aria-label={label}
      aria-disabled={!targetable || filled}
      tabIndex={tabbable ? 0 : -1}
      onClick={() => onActivate(cell)}
      onKeyDown={(event) => onNavigate(cell, event)}
    >
      {filled && <CellContent name={placedName} symbol={placedSymbol ?? ''} cellSize={cellSize} />}
      {feedbackKind && <span key={feedbackSeq} className={`cell-flash cell-flash--${feedbackKind}`} aria-hidden="true" />}
    </button>
  );
});

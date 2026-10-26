import type { RefObject } from 'react';
import type { GhostState } from '../hooks/useDragAndDrop';
import { TileFace } from './TileFace';

interface Props {
  ghost: GhostState | null;
  ghostRef: RefObject<HTMLDivElement | null>;
}

/** Copia visual de la ficha que sigue al puntero mientras se arrastra. */
export function DragGhost({ ghost, ghostRef }: Props) {
  if (!ghost) return null;
  return (
    <div
      key={ghost.seq}
      ref={ghostRef}
      className="tile tile--ghost"
      style={{ width: ghost.width, height: ghost.height }}
      aria-hidden="true"
      data-testid="drag-ghost"
    >
      <TileFace symbol={ghost.symbol} name={ghost.name} />
    </div>
  );
}

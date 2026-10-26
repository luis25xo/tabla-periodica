import { memo, type PointerEvent } from 'react';
import { getElement } from '../data/elements';
import type { ElementId } from '../data/types';
import { TileFace } from './TileFace';

interface Props {
  selectedId: ElementId | null;
  placementMode: boolean;
  interactive: boolean;
  onOpenCard: (id: ElementId) => void;
  onTogglePlacement: () => void;
  onRelease: () => void;
  onTilePointerDown: (id: ElementId, event: PointerEvent<HTMLElement>) => void;
}

/** Soporte donde queda la ficha seleccionada, fuera del movimiento de la cinta. */
export const SelectedTileHolder = memo(function SelectedTileHolder({
  selectedId,
  placementMode,
  interactive,
  onOpenCard,
  onTogglePlacement,
  onRelease,
  onTilePointerDown,
}: Props) {
  const element = selectedId ? getElement(selectedId) : undefined;

  return (
    <section className={`holder${element ? '' : ' holder--empty'}`} aria-label="Ficha seleccionada" data-testid="holder">
      {element ? (
        <>
          <button
            type="button"
            className="tile tile--held"
            data-holder-tile="true"
            data-element-id={element.id}
            aria-label={`${element.name} (${element.symbol}), ficha seleccionada. Arrástrala a la tabla o pulsa Intro para ver su tarjeta`}
            disabled={!interactive}
            onClick={() => onOpenCard(element.id)}
            onPointerDown={(e) => onTilePointerDown(element.id, e)}
          >
            <TileFace symbol={element.symbol} name={element.name} />
          </button>
          <div className="holder-actions">
            <button type="button" className="btn btn--small" onClick={() => onOpenCard(element.id)} disabled={!interactive}>
              Ver tarjeta
            </button>
            <button
              type="button"
              className={`btn btn--small${placementMode ? ' btn--active' : ''}`}
              aria-pressed={placementMode}
              onClick={onTogglePlacement}
              disabled={!interactive}
            >
              {placementMode ? 'Cancelar colocación' : 'Colocar'}
            </button>
            <button type="button" className="btn btn--small btn--ghost" onClick={onRelease} disabled={!interactive}>
              Devolver
            </button>
          </div>
        </>
      ) : (
        <p className="holder-hint">
          Haz clic en una ficha para estudiarla o arrástrala hacia arriba hasta su casilla. Mantén pulsado el mostrador para
          detenerlo y moverlo.
        </p>
      )}
    </section>
  );
});

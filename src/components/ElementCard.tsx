import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChemicalElement } from '../data/types';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { AtomVisualization } from './AtomVisualization';

interface Props {
  element: ChemicalElement;
  flipped: boolean;
  reducedMotion: boolean;
  onFlip: () => void;
  onClose: () => void;
}

const CLOSE_MS = 220;

/** Tarjeta informativa con efecto de volteo 3D sobre el eje vertical. */
export function ElementCard({ element, flipped, reducedMotion, onFlip, onClose }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const flipButtonRef = useRef<HTMLButtonElement>(null);
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef<number | undefined>(undefined);

  const requestClose = useCallback(() => {
    if (closing) return;
    if (reducedMotion) {
      onClose();
      return;
    }
    setClosing(true);
    closeTimer.current = window.setTimeout(onClose, CLOSE_MS);
  }, [closing, onClose, reducedMotion]);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  useFocusTrap(dialogRef, true, {
    onEscape: requestClose,
    initialFocus: flipButtonRef,
    restoreFallback: '[data-holder-tile]',
  });

  return (
    <div className={`overlay card-overlay${closing ? ' is-closing' : ''}`} role="presentation">
      <div
        ref={dialogRef}
        className="card-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="card-title"
        aria-describedby="card-help"
        tabIndex={-1}
      >
        <p id="card-help" className="visually-hidden">
          Tarjeta del elemento. Usa el botón Voltear para ver su estructura atómica y Cerrar o Escape para volver.
        </p>
        <div
          className={`flip-card${flipped ? ' is-flipped' : ''}`}
          onClick={onFlip}
          data-testid="flip-card"
          data-flipped={flipped ? 'true' : 'false'}
        >
          <div className="flip-card-inner">
            <section className="flip-face flip-face--front" aria-hidden={flipped}>
              <p className="card-symbol" data-testid="card-symbol" aria-label={`Símbolo químico: ${element.symbol}`}>
                {element.symbol}
              </p>
              <h2 id="card-title" className="card-name">
                {element.name}
              </h2>
            </section>
            <section className="flip-face flip-face--back" aria-hidden={!flipped} aria-label={`Estructura atómica de ${element.name}`}>
              <AtomVisualization element={element} />
              <dl className="particle-counts">
                <div className="count count--proton">
                  <dt>Protones:</dt>
                  <dd data-testid="count-protons">{element.protons}</dd>
                </div>
                <div className="count count--neutron">
                  <dt>Neutrones:</dt>
                  <dd data-testid="count-neutrons">{element.neutrons}</dd>
                </div>
                <div className="count count--electron">
                  <dt>Electrones:</dt>
                  <dd data-testid="count-electrons">{element.electrons}</dd>
                </div>
              </dl>
            </section>
          </div>
        </div>
        <div className="card-actions">
          <button ref={flipButtonRef} type="button" className="btn btn--primary" onClick={onFlip}>
            {flipped ? 'Ver nombre' : 'Voltear tarjeta'}
          </button>
          <button type="button" className="btn" onClick={requestClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

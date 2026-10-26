import { useMemo, useRef, type CSSProperties } from 'react';
import { Dialog } from './Dialog';

interface Props {
  total: number;
  errors: number;
  reducedMotion: boolean;
  onNewGame: () => void;
}

/** Pantalla de felicitación al completar los 88 elementos. */
export function CompletionScreen({ total, errors, reducedMotion, onNewGame }: Props) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  // Animación discreta de partículas (posiciones deterministas).
  const sparks = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        left: `${(i * 37) % 100}%`,
        delay: `${(i % 6) * 0.35}s`,
        duration: `${3.2 + (i % 5) * 0.4}s`,
        hue: i % 3,
      })),
    [],
  );

  return (
    <>
      {!reducedMotion && (
        <div className="sparks" aria-hidden="true">
          {sparks.map((s, i) => (
            <span
              key={i}
              className={`spark spark--${s.hue}`}
              style={{ left: s.left, animationDelay: s.delay, animationDuration: s.duration } as CSSProperties}
            />
          ))}
        </div>
      )}
      <Dialog title="¡Enhorabuena!" titleId="complete-title" className="dialog--complete" initialFocus={buttonRef} testId="completion-screen">
        <div className="complete-atom" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <p className="dialog-text dialog-text--big">
          Has completado los <strong>{total}</strong> elementos de la tabla periódica.
        </p>
        <p className="dialog-text">
          {errors === 0 ? 'Sin ningún error. ¡Impecable!' : `Errores cometidos durante la partida: ${errors}.`}
        </p>
        <div className="dialog-actions">
          <button ref={buttonRef} type="button" className="btn btn--primary" onClick={onNewGame} data-testid="completion-new-game">
            Nueva partida
          </button>
        </div>
      </Dialog>
    </>
  );
}

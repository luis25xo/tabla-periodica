import { memo } from 'react';

interface Props {
  placed: number;
  total: number;
  errors: number;
}

export const ProgressIndicator = memo(function ProgressIndicator({ placed, total, errors }: Props) {
  const percent = total > 0 ? Math.round((placed / total) * 100) : 0;
  return (
    <div className="progress" data-testid="progress">
      <p className="progress-label">
        <span className="progress-label-long">Elementos colocados:</span>
        <span className="progress-label-short">Colocados:</span> <strong data-testid="placed-count">{placed}</strong> de{' '}
        <span data-testid="total-count">{total}</span>
      </p>
      <div
        className="progress-bar"
        role="progressbar"
        aria-label="Progreso de la partida"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={placed}
        aria-valuetext={`${placed} de ${total} elementos colocados`}
      >
        <div className="progress-fill" style={{ transform: `scaleX(${percent / 100})` }} />
      </div>
      <p className="progress-stats">
        <span>
          Aciertos: <strong data-testid="hits-count">{placed}</strong>
        </span>
        <span>
          Errores: <strong data-testid="errors-count">{errors}</strong>
        </span>
      </p>
    </div>
  );
});

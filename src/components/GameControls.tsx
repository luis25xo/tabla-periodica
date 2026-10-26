import { memo } from 'react';

interface Props {
  paused: boolean;
  disabled: boolean;
  onTogglePause: () => void;
  onRestart: () => void;
}

export const GameControls = memo(function GameControls({ paused, disabled, onTogglePause, onRestart }: Props) {
  return (
    <div className="controls" role="toolbar" aria-label="Controles de la partida">
      <button
        type="button"
        className="btn btn--control"
        onClick={onTogglePause}
        disabled={disabled}
        aria-pressed={paused}
        aria-label={paused ? 'Reanudar mostrador' : 'Pausar mostrador'}
        data-testid="pause-button"
      >
        <span className="btn-icon" aria-hidden="true">
          {paused ? '▶' : '❚❚'}
        </span>
        <span className="btn-label">
          {paused ? 'Reanudar' : 'Pausar'}
          <span className="btn-label-extra"> mostrador</span>
        </span>
      </button>
      <button
        type="button"
        className="btn btn--control"
        onClick={onRestart}
        disabled={disabled}
        aria-label="Reiniciar"
        data-testid="restart-button"
      >
        <span className="btn-icon" aria-hidden="true">
          ↺
        </span>
        <span className="btn-label">Reiniciar</span>
      </button>
    </div>
  );
});

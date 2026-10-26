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
        className="btn"
        onClick={onTogglePause}
        disabled={disabled}
        aria-pressed={paused}
        data-testid="pause-button"
      >
        <span className="btn-icon" aria-hidden="true">
          {paused ? '▶' : '❚❚'}
        </span>
        {paused ? 'Reanudar' : 'Pausar'}
        <span className="btn-label-extra"> mostrador</span>
      </button>
      <button type="button" className="btn" onClick={onRestart} disabled={disabled} data-testid="restart-button">
        <span className="btn-icon" aria-hidden="true">
          ↺
        </span>
        Reiniciar
      </button>
    </div>
  );
});

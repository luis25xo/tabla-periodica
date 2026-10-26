import { Dialog } from './Dialog';

interface Props {
  savedPlaced: number | null;
  total: number;
  onNewGame: () => void;
  onContinue: () => void;
}

/** Pantalla inicial con instrucciones y, si existe, la opción de continuar la partida guardada. */
export function StartScreen({ savedPlaced, total, onNewGame, onContinue }: Props) {
  const hasSaved = savedPlaced !== null;
  return (
    <Dialog title="Completa la tabla periódica" titleId="start-title" className="dialog--start" testId="start-screen">
      <p className="dialog-text">
        Coloca cada uno de los {total} elementos en su casilla. Los lantánidos y los actínidos no forman parte de este juego.
      </p>
      <ol className="instructions">
        <li>Las fichas avanzan por el mostrador inferior. Haz clic en una para ver su tarjeta y estudiar su átomo.</li>
        <li>
          Mantén pulsado el mostrador para detenerlo y arrástralo hacia los lados para moverlo a tu gusto. Al soltarlo, sigue
          avanzando.
        </li>
        <li>Para colocar una ficha, arrástrala hacia arriba hasta la casilla que creas correcta.</li>
        <li>
          Si prefieres no arrastrar, selecciona la ficha, pulsa <strong>Colocar</strong> y elige la casilla con un clic o con las flechas
          e Intro.
        </li>
      </ol>
      <div className="dialog-actions">
        {hasSaved && (
          <button type="button" className="btn btn--primary" onClick={onContinue} data-testid="continue-button">
            Continuar partida ({savedPlaced} de {total})
          </button>
        )}
        <button type="button" className={`btn${hasSaved ? '' : ' btn--primary'}`} onClick={onNewGame} data-testid="new-game-button">
          Nueva partida
        </button>
      </div>
    </Dialog>
  );
}

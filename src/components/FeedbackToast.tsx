import { memo } from 'react';
import { getElement } from '../data/elements';
import type { Feedback } from '../state/gameReducer';

interface Props {
  feedback: Feedback | null;
}

function message(feedback: Feedback): string {
  switch (feedback.kind) {
    case 'correct':
      return `¡Correcto! ${getElement(feedback.elementId)?.name ?? 'El elemento'} está en su casilla.`;
    case 'incorrect':
      // No se revela la casilla correcta ni se dan pistas de posición.
      return 'Esa no es su casilla. La ficha vuelve al mostrador; inténtalo de nuevo.';
    case 'occupied':
      return 'Esa casilla ya está ocupada. La ficha vuelve al mostrador.';
  }
}

/** Mensaje breve tras cada intento, anunciado también a los lectores de pantalla. */
export const FeedbackToast = memo(function FeedbackToast({ feedback }: Props) {
  return (
    <div className="toast-region" role="status" aria-live="polite" data-testid="feedback">
      {feedback && (
        <p key={feedback.seq} className={`toast toast--${feedback.kind}`} data-kind={feedback.kind}>
          {message(feedback)}
        </p>
      )}
    </div>
  );
});

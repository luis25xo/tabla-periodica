import { useRef, type ReactNode, type RefObject } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface Props {
  title: string;
  titleId: string;
  className?: string;
  onEscape?: () => void;
  initialFocus?: RefObject<HTMLElement | null>;
  children: ReactNode;
  testId?: string;
}

/** Diálogo modal genérico: bloquea el fondo y mantiene el foco dentro. */
export function Dialog({ title, titleId, className = '', onEscape, initialFocus, children, testId }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, true, { onEscape, initialFocus });
  return (
    <div className="overlay" role="presentation">
      <div
        ref={ref}
        className={`dialog ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        data-testid={testId}
      >
        <h2 id={titleId} className="dialog-title">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}

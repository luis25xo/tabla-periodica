import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface Options {
  onEscape?: () => void;
  /** Elemento que recibe el foco al abrir. Por defecto, el primero enfocable. */
  initialFocus?: RefObject<HTMLElement | null>;
  /** Selector alternativo para restaurar el foco si el elemento original ya no existe. */
  restoreFallback?: string;
}

/**
 * Mantiene el foco dentro de un diálogo mientras está abierto, cierra con Escape
 * y devuelve el foco al elemento que lo tenía antes al cerrarse.
 */
export function useFocusTrap(container: RefObject<HTMLElement | null>, active: boolean, options: Options = {}): void {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (!active) return;
    const previous = document.activeElement as HTMLElement | null;
    const root = container.current;

    const focusables = (): HTMLElement[] =>
      root ? Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => !el.closest('[aria-hidden="true"]')) : [];

    const initial = optionsRef.current.initialFocus?.current ?? focusables()[0] ?? root;
    initial?.focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (optionsRef.current.onEscape) {
          event.preventDefault();
          event.stopPropagation();
          optionsRef.current.onEscape();
        }
        return;
      }
      if (event.key !== 'Tab' || !root) return;
      const items = focusables();
      if (items.length === 0) {
        event.preventDefault();
        root.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement as HTMLElement | null;
      if (event.shiftKey && (current === first || !root.contains(current))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (current === last || !root.contains(current))) {
        event.preventDefault();
        first.focus();
      }
    };

    // Si el foco escapa (p. ej. con el ratón), se recupera.
    const onFocusIn = (event: FocusEvent) => {
      if (root && event.target instanceof Node && !root.contains(event.target)) {
        (focusables()[0] ?? root).focus({ preventScroll: true });
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('focusin', onFocusIn);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('focusin', onFocusIn);
      // Se restaura tras el desmontaje para que el destino ya exista en el DOM.
      const fallback = optionsRef.current.restoreFallback;
      requestAnimationFrame(() => {
        if (previous && previous.isConnected && previous !== document.body) {
          previous.focus({ preventScroll: true });
        } else if (fallback) {
          document.querySelector<HTMLElement>(fallback)?.focus({ preventScroll: true });
        }
      });
    };
  }, [active, container]);
}

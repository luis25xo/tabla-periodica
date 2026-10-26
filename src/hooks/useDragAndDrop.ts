import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import type { ElementId, GridCoord } from '../data/types';
import { parseCellKey } from '../utils/periodicTable';
import type { PlacementResult } from '../utils/validation';

/** Distancia mínima (px) para distinguir un arrastre de un clic. */
export const DRAG_THRESHOLD = 6;
const HOVER_CLASS = 'is-drop-hover';

/**
 * Un gesto claramente horizontal sobre el mostrador lo desplaza; cualquier otro
 * (normalmente hacia arriba, hacia la tabla) saca la ficha para colocarla.
 */
export function isBeltGesture(dx: number, dy: number): boolean {
  return Math.abs(dx) > 1.5 * Math.abs(dy);
}

export interface BeginOptions {
  /** Se consulta al superar el umbral; si devuelve false, no se inicia el arrastre. */
  shouldStart?: (dx: number, dy: number) => boolean;
}

export interface GhostState {
  id: ElementId;
  name: string;
  symbol: string;
  width: number;
  height: number;
  /** Cambia en cada arrastre para montar un fantasma nuevo. */
  seq: number;
}

interface Options {
  enabled: boolean;
  reducedMotion: boolean;
  getFace: (id: ElementId) => { name: string; symbol: string };
  onDragStart: (id: ElementId) => void;
  /** La ficha se soltó fuera de una casilla jugable o se canceló el arrastre. */
  onDragCancel: (id: ElementId) => void;
  /** Valida y aplica la colocación con la misma lógica que el resto de modalidades. */
  onDrop: (id: ElementId, target: GridCoord) => PlacementResult;
  /** Zona a la que vuelve la ficha rechazada (el mostrador). */
  getReturnRect: () => DOMRect | null;
}

function dropCellAt(x: number, y: number): HTMLElement | null {
  const el = document.elementFromPoint(x, y);
  return el instanceof Element ? el.closest<HTMLElement>('[data-drop-cell="true"]') : null;
}

/**
 * Arrastrar y soltar basado en Pointer Events: funciona con ratón, pantalla táctil y lápiz.
 * La ficha arrastrada se representa con un "fantasma" que sigue al puntero fuera de la cinta.
 */
export function useDragAndDrop(options: Options) {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const [ghost, setGhost] = useState<GhostState | null>(null);
  const ghostRef = useRef<HTMLDivElement | null>(null);
  const position = useRef({ x: 0, y: 0 });
  const cleanupRef = useRef<(() => void) | null>(null);
  const finishTimer = useRef<number | undefined>(undefined);
  const ghostSeq = useRef(0);

  const applyPosition = useCallback(() => {
    const el = ghostRef.current;
    if (el) el.style.transform = `translate3d(${position.current.x}px, ${position.current.y}px, 0) scale(1.06) rotate(-2deg)`;
  }, []);

  useLayoutEffect(() => {
    if (ghost) applyPosition();
  }, [ghost, applyPosition]);

  useEffect(
    () => () => {
      cleanupRef.current?.();
      window.clearTimeout(finishTimer.current);
    },
    [],
  );

  const animateGhostTo = useCallback((rect: DOMRect | null, kind: 'success' | 'return') => {
    const el = ghostRef.current;
    const { reducedMotion } = optionsRef.current;
    const duration = reducedMotion ? 0 : kind === 'success' ? 260 : 380;
    if (el && rect && duration > 0) {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const x = rect.left + rect.width / 2 - w / 2;
      const y = kind === 'success' ? rect.top + rect.height / 2 - h / 2 : rect.top + rect.height / 2 - h / 2;
      const scale = kind === 'success' ? Math.min(1, rect.width / Math.max(w, 1)) : 0.9;
      el.classList.add(kind === 'success' ? 'ghost--success' : 'ghost--return');
      el.style.transition = `transform ${duration}ms cubic-bezier(.2,.8,.2,1), opacity ${duration}ms ease`;
      el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
      el.style.opacity = '0';
    }
    window.clearTimeout(finishTimer.current);
    finishTimer.current = window.setTimeout(() => setGhost(null), duration);
  }, []);

  const beginPointer = useCallback(
    (id: ElementId, event: ReactPointerEvent<HTMLElement>, begin: BeginOptions = {}) => {
      if (!optionsRef.current.enabled || !event.isPrimary) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      cleanupRef.current?.();

      const source = event.currentTarget;
      const rect = source.getBoundingClientRect();
      const startX = event.clientX;
      const startY = event.clientY;
      const grabX = startX - rect.left;
      const grabY = startY - rect.top;
      const pointerId = event.pointerId;
      let started = false;
      let hovered: HTMLElement | null = null;

      const setHover = (cell: HTMLElement | null) => {
        if (cell === hovered) return;
        hovered?.classList.remove(HOVER_CLASS);
        cell?.classList.add(HOVER_CLASS);
        hovered = cell;
      };

      const move = (e: PointerEvent) => {
        if (e.pointerId !== pointerId) return;
        if (!started) {
          const dx = e.clientX - startX;
          const dy = e.clientY - startY;
          if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
          if (begin.shouldStart && !begin.shouldStart(dx, dy)) {
            cleanup();
            return;
          }
          started = true;
          window.clearTimeout(finishTimer.current);
          optionsRef.current.onDragStart(id);
          setGhost({ id, ...optionsRef.current.getFace(id), width: rect.width, height: rect.height, seq: ++ghostSeq.current });
        }
        e.preventDefault();
        position.current = { x: e.clientX - grabX, y: e.clientY - grabY };
        applyPosition();
        setHover(dropCellAt(e.clientX, e.clientY));
      };

      const finish = (e: PointerEvent | null, cancelled: boolean) => {
        if (e && e.pointerId !== pointerId) return;
        cleanup();
        if (!started) return;
        const cell = !cancelled && e ? dropCellAt(e.clientX, e.clientY) : null;
        setHover(null);
        const coord = cell ? parseCellKey(cell.dataset.cellKey ?? '') : null;
        if (!coord) {
          optionsRef.current.onDragCancel(id);
          animateGhostTo(optionsRef.current.getReturnRect(), 'return');
          return;
        }
        const result = optionsRef.current.onDrop(id, coord);
        if (result === 'correct') animateGhostTo(cell!.getBoundingClientRect(), 'success');
        else animateGhostTo(optionsRef.current.getReturnRect(), 'return');
      };

      const up = (e: PointerEvent) => finish(e, false);
      const cancel = (e: PointerEvent) => finish(e, true);
      const key = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && started) {
          e.preventDefault();
          finish(null, true);
        }
      };
      const blur = () => finish(null, true);

      function cleanup() {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        window.removeEventListener('pointercancel', cancel);
        window.removeEventListener('keydown', key, true);
        window.removeEventListener('blur', blur);
        cleanupRef.current = null;
      }

      window.addEventListener('pointermove', move, { passive: false });
      window.addEventListener('pointerup', up);
      window.addEventListener('pointercancel', cancel);
      window.addEventListener('keydown', key, true);
      window.addEventListener('blur', blur);
      cleanupRef.current = cleanup;
    },
    [animateGhostTo, applyPosition],
  );

  return { ghost, ghostRef, beginPointer };
}

import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type WheelEvent,
} from 'react';
import { getElement } from '../data/elements';
import type { ElementId } from '../data/types';
import { DRAG_THRESHOLD, isBeltGesture, type BeginOptions } from '../hooks/useDragAndDrop';
import { ConveyorModel } from '../utils/conveyorModel';
import { TileFace } from './TileFace';

export const TILE_WIDTH = 136;
export const TILE_GAP = 16;
export const SLOT = TILE_WIDTH + TILE_GAP;
/** Velocidad de la cinta en px/s. */
export const BELT_SPEED = 42;

/** Desde la cinta, solo un gesto que no sea horizontal saca la ficha hacia la tabla. */
const TILE_DRAG_OPTIONS: BeginOptions = { shouldStart: (dx, dy) => !isBeltGesture(dx, dy) };

interface Props {
  /** Fichas de la cinta, en el orden de la partida. */
  beltIds: readonly ElementId[];
  /** Ficha que se está arrastrando: sigue montada pero fuera del movimiento. */
  liftedId: ElementId | null;
  paused: boolean;
  /** Falso cuando una tarjeta o diálogo bloquea la interacción. */
  interactive: boolean;
  onOpen: (id: ElementId) => void;
  /** Detiene o reanuda el movimiento (mismo estado que el botón de la barra superior). */
  onTogglePause: () => void;
  onTilePointerDown: (id: ElementId, event: PointerEvent<HTMLElement>, options?: BeginOptions) => void;
}

interface TileProps {
  id: ElementId;
  lifted: boolean;
  tabbable: boolean;
  registerRef: (id: ElementId, el: HTMLButtonElement | null) => void;
  onOpen: (id: ElementId) => void;
  onPointerDown: (id: ElementId, event: PointerEvent<HTMLElement>) => void;
  onFocusTile: (id: ElementId, el: HTMLButtonElement) => void;
  onBlurTile: () => void;
  onKeyNav: (id: ElementId, event: KeyboardEvent<HTMLButtonElement>) => void;
}

/** Ficha del mostrador. Memorizada: el movimiento se aplica fuera de React. */
const ConveyorTile = memo(function ConveyorTile({
  id,
  lifted,
  tabbable,
  registerRef,
  onOpen,
  onPointerDown,
  onFocusTile,
  onBlurTile,
  onKeyNav,
}: TileProps) {
  const element = getElement(id);
  const name = element?.name ?? '';
  const symbol = element?.symbol ?? '';
  return (
    <li className="belt-item">
      <button
        ref={(el) => registerRef(id, el)}
        type="button"
        className={`tile tile--belt${lifted ? ' is-lifted' : ''}`}
        data-belt-tile="true"
        data-element-id={id}
        tabIndex={tabbable ? 0 : -1}
        aria-label={`${name} (${symbol}). Pulsa Intro para ver su tarjeta`}
        onClick={() => onOpen(id)}
        onPointerDown={(e) => onPointerDown(id, e)}
        onFocus={(e) => onFocusTile(id, e.currentTarget)}
        onBlur={onBlurTile}
        onKeyDown={(e) => onKeyNav(id, e)}
      >
        <TileFace symbol={symbol} name={name} />
      </button>
    </li>
  );
});

/**
 * Mostrador transportador: las fichas se desplazan de derecha a izquierda de forma continua.
 * Las posiciones se calculan en un bucle requestAnimationFrame y se aplican con transform,
 * sin volver a renderizar los componentes de React.
 */
export const ElementConveyor = memo(function ElementConveyor({
  beltIds,
  liftedId,
  paused,
  interactive,
  onOpen,
  onTogglePause,
  onTilePointerDown,
}: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<ConveyorModel | null>(null);
  if (!modelRef.current) modelRef.current = new ConveyorModel(SLOT, 1200);
  const tileEls = useRef(new Map<ElementId, HTMLButtonElement>());
  const lastX = useRef(new Map<ElementId, number>());
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  /** Detención mientras una ficha tiene el foco del teclado. */
  const holdRef = useRef(false);
  /** Detención mientras el usuario mantiene pulsado el mostrador. */
  const pointerHoldRef = useRef(false);
  const suppressClickRef = useRef(false);
  const gestureCleanupRef = useRef<(() => void) | null>(null);
  const [activeId, setActiveId] = useState<ElementId | null>(null);

  const applyPositions = useCallback(() => {
    const model = modelRef.current!;
    for (const tile of model.tiles) {
      const el = tileEls.current.get(tile.id);
      if (!el) continue;
      const x = Math.round(tile.x * 10) / 10;
      if (lastX.current.get(tile.id) === x) continue;
      lastX.current.set(tile.id, x);
      el.style.transform = `translate3d(${x}px, 0, 0)`;
    }
  }, []);

  const registerRef = useCallback((id: ElementId, el: HTMLButtonElement | null) => {
    if (el) tileEls.current.set(id, el);
    else {
      tileEls.current.delete(id);
      lastX.current.delete(id);
    }
  }, []);

  // Sincroniza el modelo con las fichas disponibles (la arrastrada queda fuera del movimiento).
  useLayoutEffect(() => {
    const model = modelRef.current!;
    model.sync(beltIds.filter((id) => id !== liftedId));
    applyPositions();
  }, [beltIds, liftedId, applyPositions]);

  // Ancho visible de la cinta.
  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const measure = () => {
      const model = modelRef.current!;
      // El ancho de ficha lo define el CSS (--tile-w), más pequeño en pantallas estrechas.
      const cssWidth = parseFloat(getComputedStyle(el).getPropertyValue('--tile-w'));
      model.setSlot((cssWidth > 0 ? cssWidth : TILE_WIDTH) + TILE_GAP);
      model.viewport = Math.max(model.slot, el.clientWidth);
      applyPositions();
    };
    measure();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [applyPositions]);

  // Bucle de animación. Siempre activo para cerrar huecos y aplicar desplazamientos manuales.
  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const speed = pausedRef.current || holdRef.current || pointerHoldRef.current ? 0 : BELT_SPEED;
      modelRef.current!.step(dt, speed);
      applyPositions();
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [applyPositions]);

  const onFocusTile = useCallback((id: ElementId, el: HTMLButtonElement) => {
    setActiveId(id);
    let keyboard = true;
    try {
      keyboard = el.matches(':focus-visible');
    } catch {
      keyboard = true;
    }
    // Con teclado, la cinta se detiene mientras haya una ficha enfocada y la lleva a la vista.
    if (keyboard) {
      holdRef.current = true;
      modelRef.current!.ensureVisible(id);
    }
  }, []);

  const onBlurTile = useCallback(() => {
    holdRef.current = false;
  }, []);

  const focusTile = useCallback((id: ElementId | undefined) => {
    if (!id) return;
    modelRef.current!.ensureVisible(id);
    tileEls.current.get(id)?.focus({ preventScroll: true });
  }, []);

  const onKeyNav = useCallback(
    (id: ElementId, event: KeyboardEvent<HTMLButtonElement>) => {
      const model = modelRef.current!;
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        focusTile(model.neighbor(id, event.key === 'ArrowRight' ? 1 : -1));
      } else if (event.key === 'Home') {
        event.preventDefault();
        focusTile(model.firstVisible());
      }
    },
    [focusTile],
  );

  const nudge = useCallback((dx: number) => modelRef.current!.nudge(dx), []);

  const onBeltTilePointerDown = useCallback(
    (id: ElementId, event: PointerEvent<HTMLElement>) => onTilePointerDown(id, event, TILE_DRAG_OPTIONS),
    [onTilePointerDown],
  );

  /**
   * Mantener pulsado el mostrador lo detiene; arrastrar en horizontal lo desplaza siguiendo
   * al puntero. Al soltar, la cinta reanuda su movimiento (salvo que esté en pausa).
   */
  const onViewportPointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
      gestureCleanupRef.current?.();
      const viewport = event.currentTarget;
      const pointerId = event.pointerId;
      const startX = event.clientX;
      const startY = event.clientY;
      let lastX = startX;
      let mode: 'pending' | 'belt' | 'other' = 'pending';

      pointerHoldRef.current = true;
      viewport.classList.add('is-holding');

      const move = (e: globalThis.PointerEvent) => {
        if (e.pointerId !== pointerId) return;
        if (mode === 'pending') {
          const dx = e.clientX - startX;
          const dy = e.clientY - startY;
          if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
          mode = isBeltGesture(dx, dy) ? 'belt' : 'other';
          if (mode === 'belt') viewport.classList.add('is-dragging-belt');
        }
        if (mode === 'belt') {
          e.preventDefault();
          modelRef.current!.dragBy(e.clientX - lastX);
          lastX = e.clientX;
          applyPositions();
        }
      };
      const end = (e: globalThis.PointerEvent) => {
        if (e.pointerId !== pointerId) return;
        // Tras desplazar la cinta, el clic final no debe abrir la tarjeta de una ficha.
        if (mode === 'belt') {
          suppressClickRef.current = true;
          window.setTimeout(() => {
            suppressClickRef.current = false;
          }, 0);
        }
        cleanup();
      };
      function cleanup() {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', end);
        window.removeEventListener('pointercancel', end);
        viewport.classList.remove('is-holding', 'is-dragging-belt');
        pointerHoldRef.current = false;
        gestureCleanupRef.current = null;
      }
      window.addEventListener('pointermove', move, { passive: false });
      window.addEventListener('pointerup', end);
      window.addEventListener('pointercancel', end);
      gestureCleanupRef.current = cleanup;
    },
    [applyPositions],
  );

  useEffect(() => () => gestureCleanupRef.current?.(), []);

  const onViewportClickCapture = useCallback((event: MouseEvent) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      event.stopPropagation();
      event.preventDefault();
    }
  }, []);

  const onWheel = useCallback(
    (event: WheelEvent) => {
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (delta !== 0) nudge(-delta);
    },
    [nudge],
  );

  // La ficha con tabindex=0 es la última enfocada si sigue en la cinta, o la primera visible.
  const tabbableId =
    activeId && beltIds.includes(activeId) && activeId !== liftedId ? activeId : (modelRef.current.firstVisible() ?? beltIds[0]);

  return (
    <div className={`conveyor${paused ? ' is-paused' : ''}${interactive ? '' : ' is-inert'}`} data-testid="conveyor" data-paused={paused ? 'true' : 'false'}>
      <button
        type="button"
        className={`belt-toggle${paused ? ' is-paused' : ''}`}
        onClick={onTogglePause}
        disabled={!interactive}
        aria-pressed={paused}
        aria-label={paused ? 'Reanudar el movimiento del carrusel' : 'Detener el movimiento del carrusel'}
        title={paused ? 'Reanudar' : 'Detener'}
        data-testid="belt-pause-button"
      >
        <span className="belt-toggle-icon" aria-hidden="true">
          {paused ? '▶' : '❚❚'}
        </span>
        <span className="belt-toggle-label">{paused ? 'Reanudar' : 'Detener'}</span>
      </button>
      <button type="button" className="belt-nav" aria-label="Desplazar el mostrador hacia la derecha" onClick={() => nudge(modelRef.current!.slot * 3)}>
        ‹
      </button>
      <div
        className="belt-viewport"
        ref={viewportRef}
        onWheel={onWheel}
        onPointerDown={onViewportPointerDown}
        onClickCapture={onViewportClickCapture}
        data-testid="belt-viewport"
      >
        <div className="belt-rail" aria-hidden="true" />
        <ul className="belt-track" aria-label={`Mostrador de elementos: ${beltIds.length} fichas`}>
          {beltIds.map((id) => (
            <ConveyorTile
              key={id}
              id={id}
              lifted={id === liftedId}
              tabbable={id === tabbableId}
              registerRef={registerRef}
              onOpen={onOpen}
              onPointerDown={onBeltTilePointerDown}
              onFocusTile={onFocusTile}
              onBlurTile={onBlurTile}
              onKeyNav={onKeyNav}
            />
          ))}
        </ul>
        {beltIds.length === 0 && <p className="belt-empty">No quedan fichas en el mostrador.</p>}
      </div>
      <button type="button" className="belt-nav" aria-label="Desplazar el mostrador hacia la izquierda" onClick={() => nudge(-modelRef.current!.slot * 3)}>
        ›
      </button>
    </div>
  );
});

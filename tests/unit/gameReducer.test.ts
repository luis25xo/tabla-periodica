import { describe, expect, it } from 'vitest';
import { ALL_ELEMENT_IDS, ELEMENTS, getElement } from '../../src/data/elements';
import { gameReducer, initialGameState, selectAvailable, type GameState } from '../../src/state/gameReducer';
import { shuffle, seededRandom } from '../../src/utils/shuffle';
import { validatePlacement } from '../../src/utils/validation';

const newGame = (seed = 1): GameState =>
  gameReducer(initialGameState, { type: 'NEW_GAME', order: shuffle(ALL_ELEMENT_IDS, seededRandom(seed)) });

const cellOf = (id: string) => getElement(id)!.cell;

describe('validación de posiciones', () => {
  const none = new Set<string>();

  it('acepta el elemento en su casilla y rechaza otra', () => {
    expect(validatePlacement('carbono', { period: 2, group: 14 }, none, none)).toBe('correct');
    expect(validatePlacement('carbono', { period: 2, group: 15 }, none, none)).toBe('incorrect');
  });

  it('rechaza casillas ocupadas, huecos, reservadas e identificadores desconocidos', () => {
    expect(validatePlacement('carbono', { period: 2, group: 14 }, new Set(['2-14']), none)).toBe('occupied');
    expect(validatePlacement('carbono', { period: 1, group: 5 }, none, none)).toBe('invalid');
    expect(validatePlacement('hafnio', { period: 6, group: 3 }, none, none)).toBe('invalid');
    expect(validatePlacement('lantano', { period: 6, group: 3 }, none, none)).toBe('invalid');
    expect(validatePlacement('carbono', { period: 2, group: 14 }, none, new Set(['carbono']))).toBe('invalid');
  });

  it('valida por identificador y coordenadas, no por el nombre visible', () => {
    expect(validatePlacement('Carbono', { period: 2, group: 14 }, none, none)).toBe('invalid');
  });
});

describe('estado de la partida', () => {
  it('una nueva partida tiene las 88 fichas disponibles y sin progreso', () => {
    const s = newGame();
    expect(s.phase).toBe('playing');
    expect(s.order).toHaveLength(88);
    expect(selectAvailable(s.order, s.placed)).toHaveLength(88);
    expect(s.placed).toEqual([]);
    expect(s.errors).toBe(0);
  });

  it('rechaza órdenes iniciales con duplicados o elementos de más', () => {
    const dup = [...ALL_ELEMENT_IDS.slice(0, 87), ALL_ELEMENT_IDS[0]];
    expect(gameReducer(initialGameState, { type: 'NEW_GAME', order: dup })).toBe(initialGameState);
    expect(gameReducer(initialGameState, { type: 'NEW_GAME', order: [...ALL_ELEMENT_IDS, 'lantano'] })).toBe(initialGameState);
  });

  it('12/13. abre la tarjeta del elemento seleccionado, la voltea y la cierra sin perder la ficha', () => {
    let s = newGame();
    s = gameReducer(s, { type: 'OPEN_CARD', id: 'oro' });
    expect(s.card).toEqual({ elementId: 'oro', flipped: false });
    expect(s.selectedId).toBe('oro');
    s = gameReducer(s, { type: 'FLIP_CARD' });
    expect(s.card?.flipped).toBe(true);
    s = gameReducer(s, { type: 'CLOSE_CARD' });
    expect(s.card).toBeNull();
    expect(s.selectedId).toBe('oro');
    expect(selectAvailable(s.order, s.placed)).toContain('oro');
    expect(s.placed).toHaveLength(0);
  });

  it('14/17/19. una colocación correcta se acepta, retira la ficha y actualiza el progreso', () => {
    let s = newGame();
    s = gameReducer(s, { type: 'START_DRAG', id: 'hidrogeno' });
    expect(s.draggingId).toBe('hidrogeno');
    s = gameReducer(s, { type: 'ATTEMPT_PLACEMENT', id: 'hidrogeno', target: { period: 1, group: 1 } });
    expect(s.placed).toEqual(['hidrogeno']);
    expect(s.draggingId).toBeNull();
    expect(selectAvailable(s.order, s.placed)).not.toContain('hidrogeno');
    expect(selectAvailable(s.order, s.placed)).toHaveLength(87);
    expect(s.feedback?.kind).toBe('correct');
    expect(s.errors).toBe(0);
  });

  it('15/16. una colocación incorrecta se rechaza y la ficha vuelve al mostrador', () => {
    let s = newGame();
    s = gameReducer(s, { type: 'START_DRAG', id: 'sodio' });
    s = gameReducer(s, { type: 'ATTEMPT_PLACEMENT', id: 'sodio', target: { period: 2, group: 1 } });
    expect(s.placed).toEqual([]);
    expect(s.errors).toBe(1);
    expect(s.draggingId).toBeNull();
    expect(s.feedback).toMatchObject({ kind: 'incorrect', cellKey: '2-1' });
    const available = selectAvailable(s.order, s.placed);
    expect(available).toContain('sodio');
    expect(available).toHaveLength(88);
    expect(new Set(available).size).toBe(88);
  });

  it('18. una casilla ocupada rechaza nuevas fichas', () => {
    let s = newGame();
    s = gameReducer(s, { type: 'ATTEMPT_PLACEMENT', id: 'helio', target: { period: 1, group: 18 } });
    s = gameReducer(s, { type: 'SELECT', id: 'neon' });
    const before = s.placed;
    s = gameReducer(s, { type: 'ATTEMPT_PLACEMENT', id: 'neon', target: { period: 1, group: 18 } });
    expect(s.placed).toEqual(before);
    expect(s.feedback?.kind).toBe('occupied');
    expect(s.selectedId).toBeNull();
    expect(selectAvailable(s.order, s.placed)).toContain('neon');
  });

  it('un elemento colocado no puede volver a colocarse ni seleccionarse', () => {
    let s = newGame();
    s = gameReducer(s, { type: 'ATTEMPT_PLACEMENT', id: 'litio', target: cellOf('litio') });
    const after = gameReducer(s, { type: 'SELECT', id: 'litio' });
    expect(after.selectedId).toBeNull();
    const again = gameReducer(s, { type: 'ATTEMPT_PLACEMENT', id: 'litio', target: cellOf('litio') });
    expect(again.placed).toEqual(['litio']);
  });

  it('11. la pausa y la reanudación alternan correctamente', () => {
    let s = newGame();
    expect(s.paused).toBe(false);
    for (let i = 0; i < 7; i++) s = gameReducer(s, { type: 'TOGGLE_PAUSE' });
    expect(s.paused).toBe(true);
    s = gameReducer(s, { type: 'SET_PAUSED', paused: false });
    expect(s.paused).toBe(false);
  });

  it('el modo de colocación requiere una ficha seleccionada', () => {
    let s = newGame();
    expect(gameReducer(s, { type: 'SET_PLACEMENT_MODE', active: true }).placementMode).toBe(false);
    s = gameReducer(s, { type: 'SELECT', id: 'boro' });
    s = gameReducer(s, { type: 'SET_PLACEMENT_MODE', active: true });
    expect(s.placementMode).toBe(true);
    s = gameReducer(s, { type: 'ATTEMPT_PLACEMENT', id: 'boro', target: cellOf('boro') });
    expect(s.placementMode).toBe(false);
    expect(s.placed).toEqual(['boro']);
  });

  it('20. reiniciar restaura el estado inicial', () => {
    let s = newGame();
    s = gameReducer(s, { type: 'ATTEMPT_PLACEMENT', id: 'oxigeno', target: cellOf('oxigeno') });
    s = gameReducer(s, { type: 'ATTEMPT_PLACEMENT', id: 'cobre', target: { period: 1, group: 1 } });
    s = gameReducer(s, { type: 'TOGGLE_PAUSE' });
    s = gameReducer(s, { type: 'NEW_GAME', order: shuffle(ALL_ELEMENT_IDS, seededRandom(9)) });
    expect(s.placed).toEqual([]);
    expect(s.errors).toBe(0);
    expect(s.paused).toBe(false);
    expect(s.selectedId).toBeNull();
    expect(s.card).toBeNull();
    expect(s.feedback).toBeNull();
    expect(selectAvailable(s.order, s.placed)).toHaveLength(88);
  });

  it('21. la partida termina exactamente al colocar los 88 elementos', () => {
    let s = newGame(3);
    const order = [...s.order];
    order.forEach((id, i) => {
      expect(s.phase).toBe('playing');
      // Un error intercalado no debe afectar al progreso.
      if (i % 10 === 0) s = gameReducer(s, { type: 'ATTEMPT_PLACEMENT', id, target: { period: 1, group: id === 'hidrogeno' ? 18 : 1 } });
      s = gameReducer(s, { type: 'ATTEMPT_PLACEMENT', id, target: cellOf(id) });
      expect(s.placed).toHaveLength(i + 1);
      if (i < 87) expect(s.phase).toBe('playing');
    });
    expect(s.phase).toBe('completed');
    expect(s.paused).toBe(true);
    expect(s.placed).toHaveLength(ELEMENTS.length);
    expect(selectAvailable(s.order, s.placed)).toEqual([]);
    // Tras completar, no se aceptan más acciones de juego.
    expect(gameReducer(s, { type: 'TOGGLE_PAUSE' })).toBe(s);
  });

  it('restaura una partida guardada válida', () => {
    const order = shuffle(ALL_ELEMENT_IDS, seededRandom(5));
    const s = gameReducer(initialGameState, { type: 'RESTORE', order, placed: ['hidrogeno', 'helio'], errors: 3 });
    expect(s.phase).toBe('playing');
    expect(s.placed).toEqual(['hidrogeno', 'helio']);
    expect(s.errors).toBe(3);
    const bad = gameReducer(initialGameState, { type: 'RESTORE', order, placed: ['hidrogeno', 'hidrogeno'], errors: 0 });
    expect(bad).toBe(initialGameState);
  });
});

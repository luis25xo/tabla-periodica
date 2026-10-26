import { describe, expect, it } from 'vitest';
import { ALL_ELEMENT_IDS } from '../../src/data/elements';
import { ConveyorModel } from '../../src/utils/conveyorModel';
import { seededRandom, shuffle } from '../../src/utils/shuffle';

const SLOT = 152;

function run(model: ConveyorModel, seconds: number, speed: number, fps = 60) {
  for (let i = 0; i < seconds * fps; i++) model.step(1 / fps, speed);
}

function expectConsistent(model: ConveyorModel, expectedIds: readonly string[]) {
  const ids = model.ids;
  expect(new Set(ids).size).toBe(ids.length);
  expect([...ids].sort()).toEqual([...expectedIds].sort());
}

describe('orden aleatorio', () => {
  it('9. genera una permutación distinta en cada partida', () => {
    const a = shuffle(ALL_ELEMENT_IDS, seededRandom(1));
    const b = shuffle(ALL_ELEMENT_IDS, seededRandom(2));
    const c = shuffle(ALL_ELEMENT_IDS);
    const d = shuffle(ALL_ELEMENT_IDS);
    for (const order of [a, b, c, d]) expect([...order].sort()).toEqual([...ALL_ELEMENT_IDS].sort());
    expect(a).not.toEqual(b);
    expect(c).not.toEqual(d);
    expect(a).not.toEqual(ALL_ELEMENT_IDS);
  });

  it('no modifica la lista original', () => {
    const copy = [...ALL_ELEMENT_IDS];
    shuffle(ALL_ELEMENT_IDS);
    expect(ALL_ELEMENT_IDS).toEqual(copy);
  });
});

describe('modelo del mostrador', () => {
  it('10. las fichas se desplazan de derecha a izquierda', () => {
    const model = new ConveyorModel(SLOT, 1000);
    model.sync(ALL_ELEMENT_IDS);
    const before = model.positionOf('hidrogeno')!;
    run(model, 1, 40);
    const after = model.positionOf('hidrogeno')!;
    expect(after).toBeLessThan(before);
    expect(before - after).toBeCloseTo(40, 0);
  });

  it('mantiene un espaciado constante entre fichas', () => {
    const model = new ConveyorModel(SLOT, 1000);
    model.sync(ALL_ELEMENT_IDS);
    run(model, 30, 40);
    const xs = model.tiles.map((t) => t.x);
    for (let i = 1; i < xs.length; i++) expect(xs[i] - xs[i - 1]).toBeCloseTo(SLOT, 3);
  });

  it('las fichas que salen por la izquierda reaparecen por la derecha sin duplicados ni pérdidas', () => {
    const model = new ConveyorModel(SLOT, 1000);
    model.sync(ALL_ELEMENT_IDS);
    const first = model.ids[0];
    // Tras recorrer más de un ciclo completo de la cinta.
    run(model, (88 * SLOT) / 40 + 5, 40);
    expectConsistent(model, ALL_ELEMENT_IDS);
    expect(model.ids.indexOf(first)).toBeGreaterThan(0);
    for (const t of model.tiles) expect(t.x).toBeGreaterThanOrEqual(-SLOT);
  });

  it('una ficha reaparece fuera de la vista (sin saltos visibles)', () => {
    const viewport = 1000;
    const model = new ConveyorModel(SLOT, viewport);
    model.sync(ALL_ELEMENT_IDS.slice(0, 10));
    let wrapped = false;
    let prev = new Map(model.tiles.map((t) => [t.id, t.x]));
    for (let i = 0; i < 60 * 60; i++) {
      model.step(1 / 60, 40);
      for (const t of model.tiles) {
        const before = prev.get(t.id)!;
        if (t.x > before + 1) {
          wrapped = true;
          // Sale completamente por la izquierda y entra desde fuera del borde derecho.
          expect(before).toBeLessThan(-SLOT + 2);
          expect(t.x).toBeGreaterThanOrEqual(viewport);
        }
      }
      prev = new Map(model.tiles.map((t) => [t.id, t.x]));
    }
    expect(wrapped).toBe(true);
    expectConsistent(model, ALL_ELEMENT_IDS.slice(0, 10));
  });

  it('11. en pausa no se mueve y al reanudar continúa, tras múltiples pausas', () => {
    const model = new ConveyorModel(SLOT, 1000);
    model.sync(ALL_ELEMENT_IDS);
    for (let cycle = 0; cycle < 20; cycle++) {
      const x0 = model.positionOf('oro')!;
      run(model, 0.5, 0);
      expect(model.positionOf('oro')).toBeCloseTo(x0, 6);
      run(model, 0.25, 40);
      const x1 = model.positionOf('oro')!;
      const moved = x0 - x1;
      // Puede haber dado la vuelta; en ese caso reaparece por la derecha.
      expect(moved > 0 || x1 > x0).toBe(true);
    }
    expectConsistent(model, ALL_ELEMENT_IDS);
  });

  it('retira fichas cerrando el hueco suavemente y reincorpora las devueltas por la derecha', () => {
    const model = new ConveyorModel(SLOT, 1000);
    model.sync(ALL_ELEMENT_IDS);
    const removed = model.ids[2];
    const rest = ALL_ELEMENT_IDS.filter((id) => id !== removed);
    model.sync(rest);
    expectConsistent(model, rest);
    const x3 = model.tiles[2].x;
    model.step(1 / 60, 0);
    expect(model.tiles[2].x).toBeLessThan(x3);
    expect(x3 - model.tiles[2].x).toBeLessThan(SLOT / 2);
    run(model, 2, 0);
    expect(model.tiles[2].x - model.tiles[1].x).toBeCloseTo(SLOT, 1);

    model.sync(ALL_ELEMENT_IDS);
    expectConsistent(model, ALL_ELEMENT_IDS);
    expect(model.ids[model.ids.length - 1]).toBe(removed);
    expect(model.positionOf(removed)!).toBeGreaterThanOrEqual(1000);
  });

  it('con pocas fichas, ninguna aparece duplicada aunque la cinta sea más ancha', () => {
    const model = new ConveyorModel(SLOT, 1400);
    model.sync(['oro', 'plata', 'cobre']);
    run(model, 120, 40);
    expectConsistent(model, ['oro', 'plata', 'cobre']);
  });

  it('arrastrar la cinta la desplaza en ambos sentidos sin duplicar ni perder fichas', () => {
    const model = new ConveyorModel(SLOT, 1000);
    model.sync(ALL_ELEMENT_IDS);
    const id = model.ids[3];
    const x0 = model.positionOf(id)!;
    model.dragBy(-120);
    expect(model.positionOf(id)).toBeCloseTo(x0 - 120, 6);
    model.dragBy(200);
    expect(model.positionOf(id)).toBeCloseTo(x0 + 80, 6);
    // Muchas vueltas en ambos sentidos, en pasos pequeños como los del puntero.
    for (let i = 0; i < 2000; i++) model.dragBy(-15);
    expectConsistent(model, ALL_ELEMENT_IDS);
    for (let i = 0; i < 2000; i++) model.dragBy(15);
    expectConsistent(model, ALL_ELEMENT_IDS);
    const xs = model.tiles.map((t) => t.x);
    for (let i = 1; i < xs.length; i++) expect(xs[i] - xs[i - 1]).toBeCloseTo(SLOT, 3);
  });

  it('el desplazamiento manual lleva una ficha a la vista', () => {
    const model = new ConveyorModel(SLOT, 1000);
    model.sync(ALL_ELEMENT_IDS);
    const target = ALL_ELEMENT_IDS[60];
    model.ensureVisible(target);
    run(model, 2, 0);
    const x = model.positionOf(target)!;
    expect(x).toBeGreaterThanOrEqual(0);
    expect(x).toBeLessThanOrEqual(1000 - SLOT);
    expectConsistent(model, ALL_ELEMENT_IDS);
    model.nudge(SLOT * 5);
    run(model, 2, 0);
    expectConsistent(model, ALL_ELEMENT_IDS);
  });
});

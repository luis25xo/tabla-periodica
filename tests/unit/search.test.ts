import { describe, expect, it } from 'vitest';
import { getElement } from '../../src/data/elements';
import { normalize, searchElements } from '../../src/utils/search';

const names = (q: string) => searchElements(q).map((id) => getElement(id)!.name);

describe('buscador de elementos', () => {
  it('ignora mayúsculas y tildes', () => {
    expect(normalize('  Oxígeno ')).toBe('oxigeno');
    expect(names('oxigeno')).toEqual(['Oxígeno']);
    expect(names('NITRÓGENO')).toEqual(['Nitrógeno']);
  });

  it('prioriza el símbolo exacto y después los nombres que empiezan por la búsqueda', () => {
    expect(names('fe')[0]).toBe('Hierro');
    expect(names('w')[0]).toBe('Wolframio');
    expect(names('au')[0]).toBe('Oro');
    expect(names('co').slice(0, 1)).toEqual(['Cobalto']);
    expect(names('co')).toContain('Cobre');
  });

  it('encuentra coincidencias dentro del nombre', () => {
    expect(names('genio')).toContain('Roentgenio');
  });

  it('no devuelve nada para búsquedas vacías, ni elementos excluidos', () => {
    expect(searchElements('   ')).toEqual([]);
    expect(names('lantano')).toEqual([]);
    expect(names('uranio')).toEqual([]);
  });

  it('limita el número de resultados', () => {
    expect(searchElements('o').length).toBeLessThanOrEqual(8);
  });
});

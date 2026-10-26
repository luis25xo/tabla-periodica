import { describe, expect, it } from 'vitest';
import { ELEMENTS } from '../../src/data/elements';
import { layoutName, splitName } from '../../src/utils/nameLayout';

describe('ajuste de nombres en las casillas', () => {
  it('parte los nombres largos por una frontera silábica', () => {
    expect(splitName('Rutherfordio')).toEqual(['Ruther', 'fordio']);
    expect(splitName('Roentgenio')).toEqual(['Roent', 'genio']);
    expect(splitName('Copernicio')).toEqual(['Coper', 'nicio']);
  });

  it('nunca corta un nombre de forma que se pierdan letras', () => {
    for (const e of ELEMENTS) {
      for (const size of [52, 60, 75, 104]) {
        const { lines, fontSize } = layoutName(e.name, size);
        expect(lines.join('')).toBe(e.name);
        expect(fontSize).toBeGreaterThan(6);
        lines.forEach((line, i) => {
          const chars = line.length + (i < lines.length - 1 ? 1 : 0); // guion visual
          expect(chars * 0.6 * fontSize).toBeLessThanOrEqual(size - 8 + 1e-6);
        });
      }
    }
  });

  it('usa una sola línea cuando la casilla es amplia', () => {
    for (const e of ELEMENTS) expect(layoutName(e.name, 80).lines).toHaveLength(1);
  });
});

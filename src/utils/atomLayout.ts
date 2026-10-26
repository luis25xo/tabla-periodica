/**
 * Geometría del modelo atómico didáctico (modelo de capas de Bohr).
 * Determinista: el mismo elemento produce siempre el mismo dibujo.
 */

export interface Nucleon {
  x: number;
  y: number;
  kind: 'proton' | 'neutron';
}

export interface ShellLayout {
  radius: number;
  electrons: { x: number; y: number }[];
}

export interface AtomLayout {
  size: number;
  center: number;
  nucleusRadius: number;
  nucleonRadius: number;
  nucleons: Nucleon[];
  shells: ShellLayout[];
}

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

export function computeAtomLayout(protons: number, neutrons: number, shells: readonly number[], size = 400): AtomLayout {
  const center = size / 2;
  const total = protons + neutrons;
  const outer = size / 2 - 14;

  const nucleusRadius = Math.min(62, Math.max(14, 10 + 3.1 * Math.sqrt(total)));
  // Empaquetado de discos en un círculo (densidad ≈ 0,8).
  const nucleonRadius = total <= 1 ? 11 : Math.min(11, nucleusRadius * Math.sqrt(0.8 / total));
  const spread = total <= 1 ? 0 : (nucleusRadius - nucleonRadius) / Math.sqrt(total - 0.5);

  // Espiral de Vogel: distribución uniforme del centro hacia fuera.
  // Protones y neutrones se intercalan de forma proporcional y exacta.
  const nucleons: Nucleon[] = [];
  for (let i = 0; i < total; i++) {
    const r = spread * Math.sqrt(i + 0.5) * (total <= 1 ? 0 : 1);
    const angle = i * GOLDEN_ANGLE;
    const isProton = Math.floor(((i + 1) * protons) / total) > Math.floor((i * protons) / total);
    nucleons.push({ x: center + r * Math.cos(angle), y: center + r * Math.sin(angle), kind: isProton ? 'proton' : 'neutron' });
  }
  // Se dibujan de fuera hacia dentro para que el centro quede encima.
  nucleons.reverse();

  const inner = nucleusRadius + 24;
  const count = shells.length;
  const shellLayouts: ShellLayout[] = shells.map((electrons, i) => {
    const radius = count === 1 ? Math.min(inner + 36, outer) : inner + (i * (outer - inner)) / (count - 1);
    const offset = -Math.PI / 2 + i * 0.6;
    return {
      radius,
      electrons: Array.from({ length: electrons }, (_, k) => {
        const angle = offset + (k * 2 * Math.PI) / electrons;
        return { x: center + radius * Math.cos(angle), y: center + radius * Math.sin(angle) };
      }),
    };
  });

  return { size, center, nucleusRadius, nucleonRadius, nucleons, shells: shellLayouts };
}

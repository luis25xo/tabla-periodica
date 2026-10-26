import { memo, useMemo } from 'react';
import type { ChemicalElement } from '../data/types';
import { computeAtomLayout } from '../utils/atomLayout';

interface Props {
  element: ChemicalElement;
}

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

/** Modelo atómico: núcleo (protones y neutrones) y electrones repartidos en niveles de energía. */
export const AtomVisualization = memo(function AtomVisualization({ element }: Props) {
  const layout = useMemo(
    () => computeAtomLayout(element.protons, element.neutrons, element.shells),
    [element.protons, element.neutrons, element.shells],
  );
  const { size, center, nucleusRadius, nucleonRadius, nucleons, shells } = layout;
  const showSigns = nucleonRadius >= 6;

  const label =
    `Modelo atómico de ${element.name}: núcleo con ${plural(element.protons, 'protón', 'protones')} y ` +
    `${plural(element.neutrons, 'neutrón', 'neutrones')}; ${plural(element.electrons, 'electrón', 'electrones')} ` +
    `en ${plural(shells.length, 'nivel', 'niveles')} de energía (${element.shells.join(', ')}).`;

  return (
    <figure className="atom">
      <svg className="atom-svg" viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label}>
        <defs>
          <radialGradient id="g-proton" cx="35%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#ff9a85" />
            <stop offset="100%" stopColor="#d6452f" />
          </radialGradient>
          <radialGradient id="g-neutron" cx="35%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#d9dee5" />
            <stop offset="100%" stopColor="#7d8896" />
          </radialGradient>
          <radialGradient id="g-electron" cx="35%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#8ec5ff" />
            <stop offset="100%" stopColor="#1f5fd1" />
          </radialGradient>
          <radialGradient id="g-halo">
            <stop offset="0%" stopColor="#ffe6c9" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ffe6c9" stopOpacity="0" />
          </radialGradient>
        </defs>

        {shells.map((shell, i) => (
          <circle key={`ring-${i}`} className="atom-ring" cx={center} cy={center} r={shell.radius} />
        ))}

        <circle cx={center} cy={center} r={nucleusRadius + 10} fill="url(#g-halo)" />
        <g className="atom-nucleus">
          {nucleons.map((p, i) =>
            p.kind === 'proton' ? (
              <g key={i} data-particle="proton">
                <circle cx={p.x} cy={p.y} r={nucleonRadius} fill="url(#g-proton)" stroke="#a8321f" strokeWidth={nucleonRadius > 4 ? 0.8 : 0.4} />
                {showSigns && (
                  <path
                    d={`M${p.x - nucleonRadius * 0.45} ${p.y}h${nucleonRadius * 0.9}M${p.x} ${p.y - nucleonRadius * 0.45}v${nucleonRadius * 0.9}`}
                    stroke="#fff"
                    strokeWidth={Math.max(1, nucleonRadius * 0.18)}
                    strokeLinecap="round"
                  />
                )}
              </g>
            ) : (
              <g key={i} data-particle="neutron">
                <circle cx={p.x} cy={p.y} r={nucleonRadius} fill="url(#g-neutron)" stroke="#5b6573" strokeWidth={nucleonRadius > 4 ? 0.8 : 0.4} />
              </g>
            ),
          )}
        </g>

        {shells.map((shell, i) => (
          <g key={`shell-${i}`} className={`atom-orbit atom-orbit--${i % 2 === 0 ? 'cw' : 'ccw'}`} style={{ animationDuration: `${40 + i * 14}s` }}>
            {shell.electrons.map((e, k) => (
              <g key={k} data-particle="electron">
                <circle cx={e.x} cy={e.y} r={6.5} fill="#2b6fe0" opacity={0.15} />
                <circle cx={e.x} cy={e.y} r={4} fill="url(#g-electron)" stroke="#164aa8" strokeWidth={0.6} />
              </g>
            ))}
          </g>
        ))}
      </svg>
      <figcaption className="atom-legend" aria-hidden="true">
        <span className="legend-item">
          <svg viewBox="0 0 20 20" width="16" height="16">
            <circle cx="10" cy="10" r="8" fill="url(#g-proton)" stroke="#a8321f" />
            <path d="M6 10h8M10 6v8" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Protón
        </span>
        <span className="legend-item">
          <svg viewBox="0 0 20 20" width="16" height="16">
            <circle cx="10" cy="10" r="8" fill="url(#g-neutron)" stroke="#5b6573" />
          </svg>
          Neutrón
        </span>
        <span className="legend-item">
          <svg viewBox="0 0 20 20" width="16" height="16">
            <circle cx="10" cy="10" r="7" fill="#2b6fe0" opacity="0.15" />
            <circle cx="10" cy="10" r="4.5" fill="url(#g-electron)" stroke="#164aa8" />
          </svg>
          Electrón
        </span>
        <span className="legend-item">
          <svg viewBox="0 0 20 20" width="16" height="16">
            <circle cx="10" cy="10" r="7.5" fill="none" stroke="#9aa6b6" strokeDasharray="2 2" />
          </svg>
          Nivel de energía
        </span>
      </figcaption>
    </figure>
  );
});

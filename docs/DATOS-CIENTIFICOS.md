# Datos científicos y decisiones de diseño

Este documento describe la fuente de datos de los 88 elementos jugables (`src/data/elements.ts`) y las decisiones científicas y de distribución adoptadas. La tabla final se genera a partir del propio código, por lo que coincide con lo que usa la aplicación.

## 1. Elementos incluidos y excluidos

- Se incluyen los 118 elementos **menos** los lantánidos (Z 57–71) y los actínidos (Z 89–103): 118 − 30 = **88 elementos jugables**.
- No existen filas separadas para las series f, ni casillas especiales, ni fichas, ni entradas en el progreso o la validación.

## 2. Distribución de la cuadrícula

- Cuadrícula convencional de **18 grupos × 7 períodos** (126 posiciones).
- **88 casillas jugables**, una por elemento; cada una es una zona de destino independiente.
- **Grupo 3 de los períodos 6 y 7**: es la posición que en la tabla de 18 columnas corresponde a las series f (La–Lu y Ac–Lr). Como esas series están excluidas, ambas posiciones quedan **vacías, sin etiqueta y no interactivas** (se dibujan con un borde discontinuo muy tenue para mantener la forma de la tabla). Por tanto, en el grupo 3 solo son jugables el escandio y el itrio, y el lantano y el actinio no aparecen.
- Los huecos naturales (período 1, grupos 2–17; períodos 2 y 3, grupos 3–12) no son casillas.
- Elementos por período: 2, 8, 8, 18, 18, 17, 17.
- Bloques: s (grupos 1–2 y helio) = 14, d (grupos 3–12) = 38, p (grupos 13–18 salvo helio) = 36.

## 3. Isótopo de referencia (neutrones)

Los neutrones **nunca** se calculan a partir de la masa atómica decimal. Cada elemento tiene un isótopo de referencia explícito (`isotope.key`, p. ej. `Z26-A56`) y `neutrones = número másico − protones`.

Criterios:

1. **Elementos con isótopos estables o primordiales**: el isótopo natural **más abundante** (abundancias isotópicas IUPAC/CIAAW). Casos a destacar:
   - Indio-115, telurio-130 y renio-187 son ligeramente radiactivos (semividas de 10¹⁰–10²⁴ años), pero son primordiales y los más abundantes.
   - Bismuto-209 es el único isótopo natural (semivida ≈ 2·10¹⁹ años).
2. **Elementos sin isótopos estables** (Tc, Po, At, Rn, Fr, Ra y 104–118): el **isótopo más estable conocido**, cuyo número másico es el que figura entre corchetes en la lista de referencia de Wikipedia «List of chemical elements» (consultada el 25-10-2026). Notas:
   - Tecnecio: se usa Tc-97 (≈ 4,2 millones de años); Tc-98 tiene una semivida comparable.
   - Superpesados (104–118): las semividas son de segundos a horas y los valores pueden revisarse con nuevos experimentos.

Electrones = protones (átomo neutro).

## 4. Distribución de electrones por niveles

El modelo atómico de la tarjeta es un modelo didáctico de capas (Bohr). El reparto por niveles `n = 1…7` se calcula en `src/utils/electronConfiguration.ts`:

- Orden de llenado de Madelung (regla n + l).
- Excepciones del estado fundamental (NIST) que cambian el reparto: Cr, Cu, Nb, Mo, Ru, Rh, Pd, Ag, Pt y Au. El paladio ([Kr] 4d¹⁰) no tiene electrones en el nivel 5.
- Superpesados: configuración predicha habitual (coincide con Madelung).

La configuración electrónica escrita **no se muestra** en la interfaz; solo se dibujan los electrones en sus niveles.

## 5. Visualización atómica

- El núcleo dibuja exactamente `protones` (rojo, con signo +) y `neutrones` (gris), intercalados proporcionalmente con una espiral de Vogel determinista.
- Los electrones (azules, más pequeños, con halo) se reparten uniformemente sobre su nivel.
- Las pruebas verifican que el número de partículas dibujadas coincide con los datos para los 88 elementos.

## 6. Reglas de juego

- La validación usa el **identificador interno** y las **coordenadas** (período, grupo), nunca el nombre visible. Es la misma función (`src/utils/validation.ts`) para arrastre, clic y teclado.
- Colocación incorrecta: suma un error, la ficha vuelve al mostrador y no se revela ninguna pista.
- Casilla ocupada: se rechaza sin contar como error (no es un intento de ubicación válido) y la ficha vuelve al mostrador.
- Soltar fuera de una casilla: la ficha vuelve al mostrador sin penalización.
- Persistencia: solo se guarda el orden del mostrador, los elementos colocados y el número de errores; el resto se deriva.

## 7. Tabla completa de datos

| Nombre | Período | Grupo | Bloque | Protones | Neutrones | Electrones | A ref. | Criterio | Electrones por nivel |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Hidrógeno | 1 | 1 | s | 1 | 0 | 1 | 1 | Más abundante | 1 |
| Helio | 1 | 18 | s | 2 | 2 | 2 | 4 | Más abundante | 2 |
| Litio | 2 | 1 | s | 3 | 4 | 3 | 7 | Más abundante | 2, 1 |
| Berilio | 2 | 2 | s | 4 | 5 | 4 | 9 | Más abundante | 2, 2 |
| Boro | 2 | 13 | p | 5 | 6 | 5 | 11 | Más abundante | 2, 3 |
| Carbono | 2 | 14 | p | 6 | 6 | 6 | 12 | Más abundante | 2, 4 |
| Nitrógeno | 2 | 15 | p | 7 | 7 | 7 | 14 | Más abundante | 2, 5 |
| Oxígeno | 2 | 16 | p | 8 | 8 | 8 | 16 | Más abundante | 2, 6 |
| Flúor | 2 | 17 | p | 9 | 10 | 9 | 19 | Más abundante | 2, 7 |
| Neón | 2 | 18 | p | 10 | 10 | 10 | 20 | Más abundante | 2, 8 |
| Sodio | 3 | 1 | s | 11 | 12 | 11 | 23 | Más abundante | 2, 8, 1 |
| Magnesio | 3 | 2 | s | 12 | 12 | 12 | 24 | Más abundante | 2, 8, 2 |
| Aluminio | 3 | 13 | p | 13 | 14 | 13 | 27 | Más abundante | 2, 8, 3 |
| Silicio | 3 | 14 | p | 14 | 14 | 14 | 28 | Más abundante | 2, 8, 4 |
| Fósforo | 3 | 15 | p | 15 | 16 | 15 | 31 | Más abundante | 2, 8, 5 |
| Azufre | 3 | 16 | p | 16 | 16 | 16 | 32 | Más abundante | 2, 8, 6 |
| Cloro | 3 | 17 | p | 17 | 18 | 17 | 35 | Más abundante | 2, 8, 7 |
| Argón | 3 | 18 | p | 18 | 22 | 18 | 40 | Más abundante | 2, 8, 8 |
| Potasio | 4 | 1 | s | 19 | 20 | 19 | 39 | Más abundante | 2, 8, 8, 1 |
| Calcio | 4 | 2 | s | 20 | 20 | 20 | 40 | Más abundante | 2, 8, 8, 2 |
| Escandio | 4 | 3 | d | 21 | 24 | 21 | 45 | Más abundante | 2, 8, 9, 2 |
| Titanio | 4 | 4 | d | 22 | 26 | 22 | 48 | Más abundante | 2, 8, 10, 2 |
| Vanadio | 4 | 5 | d | 23 | 28 | 23 | 51 | Más abundante | 2, 8, 11, 2 |
| Cromo | 4 | 6 | d | 24 | 28 | 24 | 52 | Más abundante | 2, 8, 13, 1 |
| Manganeso | 4 | 7 | d | 25 | 30 | 25 | 55 | Más abundante | 2, 8, 13, 2 |
| Hierro | 4 | 8 | d | 26 | 30 | 26 | 56 | Más abundante | 2, 8, 14, 2 |
| Cobalto | 4 | 9 | d | 27 | 32 | 27 | 59 | Más abundante | 2, 8, 15, 2 |
| Níquel | 4 | 10 | d | 28 | 30 | 28 | 58 | Más abundante | 2, 8, 16, 2 |
| Cobre | 4 | 11 | d | 29 | 34 | 29 | 63 | Más abundante | 2, 8, 18, 1 |
| Zinc | 4 | 12 | d | 30 | 34 | 30 | 64 | Más abundante | 2, 8, 18, 2 |
| Galio | 4 | 13 | p | 31 | 38 | 31 | 69 | Más abundante | 2, 8, 18, 3 |
| Germanio | 4 | 14 | p | 32 | 42 | 32 | 74 | Más abundante | 2, 8, 18, 4 |
| Arsénico | 4 | 15 | p | 33 | 42 | 33 | 75 | Más abundante | 2, 8, 18, 5 |
| Selenio | 4 | 16 | p | 34 | 46 | 34 | 80 | Más abundante | 2, 8, 18, 6 |
| Bromo | 4 | 17 | p | 35 | 44 | 35 | 79 | Más abundante | 2, 8, 18, 7 |
| Kriptón | 4 | 18 | p | 36 | 48 | 36 | 84 | Más abundante | 2, 8, 18, 8 |
| Rubidio | 5 | 1 | s | 37 | 48 | 37 | 85 | Más abundante | 2, 8, 18, 8, 1 |
| Estroncio | 5 | 2 | s | 38 | 50 | 38 | 88 | Más abundante | 2, 8, 18, 8, 2 |
| Itrio | 5 | 3 | d | 39 | 50 | 39 | 89 | Más abundante | 2, 8, 18, 9, 2 |
| Circonio | 5 | 4 | d | 40 | 50 | 40 | 90 | Más abundante | 2, 8, 18, 10, 2 |
| Niobio | 5 | 5 | d | 41 | 52 | 41 | 93 | Más abundante | 2, 8, 18, 12, 1 |
| Molibdeno | 5 | 6 | d | 42 | 56 | 42 | 98 | Más abundante | 2, 8, 18, 13, 1 |
| Tecnecio | 5 | 7 | d | 43 | 54 | 43 | 97 | Más estable conocido | 2, 8, 18, 13, 2 |
| Rutenio | 5 | 8 | d | 44 | 58 | 44 | 102 | Más abundante | 2, 8, 18, 15, 1 |
| Rodio | 5 | 9 | d | 45 | 58 | 45 | 103 | Más abundante | 2, 8, 18, 16, 1 |
| Paladio | 5 | 10 | d | 46 | 60 | 46 | 106 | Más abundante | 2, 8, 18, 18 |
| Plata | 5 | 11 | d | 47 | 60 | 47 | 107 | Más abundante | 2, 8, 18, 18, 1 |
| Cadmio | 5 | 12 | d | 48 | 66 | 48 | 114 | Más abundante | 2, 8, 18, 18, 2 |
| Indio | 5 | 13 | p | 49 | 66 | 49 | 115 | Más abundante | 2, 8, 18, 18, 3 |
| Estaño | 5 | 14 | p | 50 | 70 | 50 | 120 | Más abundante | 2, 8, 18, 18, 4 |
| Antimonio | 5 | 15 | p | 51 | 70 | 51 | 121 | Más abundante | 2, 8, 18, 18, 5 |
| Telurio | 5 | 16 | p | 52 | 78 | 52 | 130 | Más abundante | 2, 8, 18, 18, 6 |
| Yodo | 5 | 17 | p | 53 | 74 | 53 | 127 | Más abundante | 2, 8, 18, 18, 7 |
| Xenón | 5 | 18 | p | 54 | 78 | 54 | 132 | Más abundante | 2, 8, 18, 18, 8 |
| Cesio | 6 | 1 | s | 55 | 78 | 55 | 133 | Más abundante | 2, 8, 18, 18, 8, 1 |
| Bario | 6 | 2 | s | 56 | 82 | 56 | 138 | Más abundante | 2, 8, 18, 18, 8, 2 |
| Hafnio | 6 | 4 | d | 72 | 108 | 72 | 180 | Más abundante | 2, 8, 18, 32, 10, 2 |
| Tantalio | 6 | 5 | d | 73 | 108 | 73 | 181 | Más abundante | 2, 8, 18, 32, 11, 2 |
| Wolframio | 6 | 6 | d | 74 | 110 | 74 | 184 | Más abundante | 2, 8, 18, 32, 12, 2 |
| Renio | 6 | 7 | d | 75 | 112 | 75 | 187 | Más abundante | 2, 8, 18, 32, 13, 2 |
| Osmio | 6 | 8 | d | 76 | 116 | 76 | 192 | Más abundante | 2, 8, 18, 32, 14, 2 |
| Iridio | 6 | 9 | d | 77 | 116 | 77 | 193 | Más abundante | 2, 8, 18, 32, 15, 2 |
| Platino | 6 | 10 | d | 78 | 117 | 78 | 195 | Más abundante | 2, 8, 18, 32, 17, 1 |
| Oro | 6 | 11 | d | 79 | 118 | 79 | 197 | Más abundante | 2, 8, 18, 32, 18, 1 |
| Mercurio | 6 | 12 | d | 80 | 122 | 80 | 202 | Más abundante | 2, 8, 18, 32, 18, 2 |
| Talio | 6 | 13 | p | 81 | 124 | 81 | 205 | Más abundante | 2, 8, 18, 32, 18, 3 |
| Plomo | 6 | 14 | p | 82 | 126 | 82 | 208 | Más abundante | 2, 8, 18, 32, 18, 4 |
| Bismuto | 6 | 15 | p | 83 | 126 | 83 | 209 | Más abundante | 2, 8, 18, 32, 18, 5 |
| Polonio | 6 | 16 | p | 84 | 125 | 84 | 209 | Más estable conocido | 2, 8, 18, 32, 18, 6 |
| Astato | 6 | 17 | p | 85 | 125 | 85 | 210 | Más estable conocido | 2, 8, 18, 32, 18, 7 |
| Radón | 6 | 18 | p | 86 | 136 | 86 | 222 | Más estable conocido | 2, 8, 18, 32, 18, 8 |
| Francio | 7 | 1 | s | 87 | 136 | 87 | 223 | Más estable conocido | 2, 8, 18, 32, 18, 8, 1 |
| Radio | 7 | 2 | s | 88 | 138 | 88 | 226 | Más estable conocido | 2, 8, 18, 32, 18, 8, 2 |
| Rutherfordio | 7 | 4 | d | 104 | 163 | 104 | 267 | Más estable conocido | 2, 8, 18, 32, 32, 10, 2 |
| Dubnio | 7 | 5 | d | 105 | 163 | 105 | 268 | Más estable conocido | 2, 8, 18, 32, 32, 11, 2 |
| Seaborgio | 7 | 6 | d | 106 | 161 | 106 | 267 | Más estable conocido | 2, 8, 18, 32, 32, 12, 2 |
| Bohrio | 7 | 7 | d | 107 | 163 | 107 | 270 | Más estable conocido | 2, 8, 18, 32, 32, 13, 2 |
| Hasio | 7 | 8 | d | 108 | 163 | 108 | 271 | Más estable conocido | 2, 8, 18, 32, 32, 14, 2 |
| Meitnerio | 7 | 9 | d | 109 | 169 | 109 | 278 | Más estable conocido | 2, 8, 18, 32, 32, 15, 2 |
| Darmstatio | 7 | 10 | d | 110 | 171 | 110 | 281 | Más estable conocido | 2, 8, 18, 32, 32, 16, 2 |
| Roentgenio | 7 | 11 | d | 111 | 171 | 111 | 282 | Más estable conocido | 2, 8, 18, 32, 32, 17, 2 |
| Copernicio | 7 | 12 | d | 112 | 173 | 112 | 285 | Más estable conocido | 2, 8, 18, 32, 32, 18, 2 |
| Nihonio | 7 | 13 | p | 113 | 173 | 113 | 286 | Más estable conocido | 2, 8, 18, 32, 32, 18, 3 |
| Flerovio | 7 | 14 | p | 114 | 175 | 114 | 289 | Más estable conocido | 2, 8, 18, 32, 32, 18, 4 |
| Moscovio | 7 | 15 | p | 115 | 175 | 115 | 290 | Más estable conocido | 2, 8, 18, 32, 32, 18, 5 |
| Livermorio | 7 | 16 | p | 116 | 177 | 116 | 293 | Más estable conocido | 2, 8, 18, 32, 32, 18, 6 |
| Teneso | 7 | 17 | p | 117 | 177 | 117 | 294 | Más estable conocido | 2, 8, 18, 32, 32, 18, 7 |
| Oganesón | 7 | 18 | p | 118 | 176 | 118 | 294 | Más estable conocido | 2, 8, 18, 32, 32, 18, 8 |

// Genera build/icon.png (512×512) sin dependencias: un átomo estilizado sobre fondo azul.
// Uso: npm run icons
import { mkdirSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SIZE = 512;
const SS = 4; // supermuestreo para suavizar bordes
const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function mix(a, b, t) {
  return a + (b - a) * t;
}

/** Color (r, g, b, a) del punto (x, y) en coordenadas 0..SIZE. */
function shade(x, y) {
  const c = SIZE / 2;
  const dx = x - c;
  const dy = y - c;
  // Fondo: cuadrado redondeado con degradado.
  const r = 96;
  const m = 24;
  const qx = Math.max(Math.abs(dx) - (c - m - r), 0);
  const qy = Math.max(Math.abs(dy) - (c - m - r), 0);
  if (Math.hypot(qx, qy) > r) return [0, 0, 0, 0];
  const t = y / SIZE;
  let col = [mix(52, 28, t), mix(112, 72, t), mix(226, 170, t)];

  // Órbitas: tres elipses rotadas.
  for (const angle of [0, Math.PI / 3, (2 * Math.PI) / 3]) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const u = dx * cos + dy * sin;
    const v = -dx * sin + dy * cos;
    const d = Math.abs(Math.hypot(u / 180, v / 64) - 1) * 64;
    if (d < 6) col = [245, 247, 252];
  }
  // Electrones.
  for (const [ex, ey] of [
    [180, 0],
    [-90, 156],
    [-90, -156],
  ]) {
    if (Math.hypot(dx - ex, dy - ey) < 19) col = [255, 200, 92];
  }
  // Núcleo.
  const dn = Math.hypot(dx, dy);
  if (dn < 44) {
    const k = dn / 44;
    col = [mix(255, 214, k), mix(140, 69, k), mix(120, 47, k)];
  }
  return [...col, 255];
}

const pixels = Buffer.alloc(SIZE * SIZE * 4);
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    let r = 0,
      g = 0,
      b = 0,
      a = 0;
    for (let sy = 0; sy < SS; sy++) {
      for (let sx = 0; sx < SS; sx++) {
        const [pr, pg, pb, pa] = shade(x + (sx + 0.5) / SS, y + (sy + 0.5) / SS);
        r += pr * pa;
        g += pg * pa;
        b += pb * pa;
        a += pa;
      }
    }
    const i = (y * SIZE + x) * 4;
    const n = SS * SS;
    pixels[i] = a ? Math.round(r / a) : 0;
    pixels[i + 1] = a ? Math.round(g / a) : 0;
    pixels[i + 2] = a ? Math.round(b / a) : 0;
    pixels[i + 3] = Math.round(a / n);
  }
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8; // profundidad
ihdr[9] = 6; // RGBA
const raw = Buffer.alloc((SIZE * 4 + 1) * SIZE);
for (let y = 0; y < SIZE; y++) {
  raw[y * (SIZE * 4 + 1)] = 0;
  pixels.copy(raw, y * (SIZE * 4 + 1) + 1, y * SIZE * 4, (y + 1) * SIZE * 4);
}

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);

const out = join(root, 'build', 'icon.png');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, png);
console.log(`Icono generado: ${out} (${png.length} bytes)`);

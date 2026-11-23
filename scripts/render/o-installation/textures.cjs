/*
 * textures.cjs
 *
 * Generates the procedural PBR textures for the O installation render:
 *
 *   textures/wall_albedo.jpg     wall_roughness.png     wall_normal.png
 *   textures/floor_albedo.jpg    floor_roughness.png    floor_normal.png
 *   textures/plaster_albedo.jpg  plaster_roughness.png  plaster_normal.png
 *   textures/scenery_extended.jpg  the client's photo with a soft, blurred
 *                                  border, for the glowing plane behind the wall
 *   textures/manifest.json       (how many metres each texture covers, and
 *                                 how much each normal map is exaggerated)
 *
 * Everything is built from seeded random numbers, so running it twice gives
 * byte-identical images. Nothing is photographed or copied from anywhere
 * (apart from the client's own scenery photo, which is only extended).
 *
 * How the textures are made, in plain terms:
 *   - We build a HEIGHT field (in metres) and an ALBEDO (base colour) field
 *     and a ROUGHNESS field for each material, as large float arrays.
 *   - Large, soft colour variation comes from layered gradient noise, often
 *     "domain warped" (looked up through another, slower noise) so the
 *     patches get irregular, organic edges instead of looking like clouds.
 *   - Small features (pores, bug holes, form-tie holes, saw joints, cracks,
 *     trowel strokes) are stamped in one by one at random places.
 *   - The normal map is derived from the height field (its slopes).
 *
 * Each texture covers a large real-world area (several metres) at 4096 px,
 * so nothing repeats inside the camera's view.
 *
 * Usage:  node textures.cjs            (writes into ./textures)
 *         node textures.cjs --force    (rebuild even if the files exist)
 */

'use strict';

const fs = require('fs');
const path = require('path');
const sharp = require(require.resolve('sharp', {
  paths: [path.resolve(__dirname, '../../..')], // the website folder, which already has sharp
}));

const OUT_DIR = path.join(__dirname, 'textures');
const SIZE = 4096; // pixels per side for every texture
const VERSION = 3; // bump when the look changes, so old textures are rebuilt

// Real-world size (metres) covered by one texture, per material.
// The wall texture covers x -4..4 m and y -0.5..7.5 m of the wall, the floor
// texture covers x -5..5 m and z -0.5..9.5 m in front of the wall.
const DOMAINS = {
  wall: { width: 8.0, height: 8.0, originX: -4.0, originY: -0.5 },
  floor: { width: 10.0, height: 10.0, originX: -5.0, originY: -0.5 },
  plaster: { width: 4.0, height: 4.0, originX: -2.0, originY: -0.5 },
};

/*
 * An 8-bit normal map can only store slopes in steps of about 1/128, which
 * is too coarse for the gentle waviness of a trowelled floor or a plaster
 * face. So the slopes are stored multiplied by this factor, and scene.js
 * divides them back with the material's normalScale (exact, because only
 * the direction of the normal matters).
 */
const NORMAL_BOOST = { wall: 2, floor: 4, plaster: 4 };

// The scenery photo is extended by this share of its size on every side.
const SCENERY_BORDER = 0.5;

// ---------------------------------------------------------------------------
// Random numbers and noise
// ---------------------------------------------------------------------------

// Small, fast, seeded random number generator (mulberry32).
function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Normally distributed random number (Box-Muller).
function gauss(rand) {
  const u = Math.max(rand(), 1e-12);
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/*
 * One octave of periodic gradient ("Perlin") noise, `cells` lattice cells
 * across the texture, evaluated at a resolution suited to its frequency and
 * then upsampled. Returns values roughly in -1..1.
 */
function gradientNoise(size, cells, seed) {
  const rand = rng(seed);
  const n = cells;
  const gx = new Float32Array(n * n);
  const gy = new Float32Array(n * n);
  for (let i = 0; i < n * n; i++) {
    const a = rand() * Math.PI * 2;
    gx[i] = Math.cos(a);
    gy[i] = Math.sin(a);
  }
  // Coarse octaves are evaluated on a smaller grid and upsampled.
  const res = Math.min(size, Math.max(16, cells * 12));
  const low = new Float32Array(res * res);
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  for (let y = 0; y < res; y++) {
    const fy = ((y + 0.5) / res) * n;
    const iy = Math.floor(fy);
    const ty = fy - iy;
    const y0 = iy % n;
    const y1 = (iy + 1) % n;
    const sy = fade(ty);
    for (let x = 0; x < res; x++) {
      const fx = ((x + 0.5) / res) * n;
      const ix = Math.floor(fx);
      const tx = fx - ix;
      const x0 = ix % n;
      const x1 = (ix + 1) % n;
      const sx = fade(tx);
      const i00 = y0 * n + x0, i10 = y0 * n + x1, i01 = y1 * n + x0, i11 = y1 * n + x1;
      const d00 = gx[i00] * tx + gy[i00] * ty;
      const d10 = gx[i10] * (tx - 1) + gy[i10] * ty;
      const d01 = gx[i01] * tx + gy[i01] * (ty - 1);
      const d11 = gx[i11] * (tx - 1) + gy[i11] * (ty - 1);
      const a = d00 + (d10 - d00) * sx;
      const b = d01 + (d11 - d01) * sx;
      low[y * res + x] = (a + (b - a) * sy) * 1.41;
    }
  }
  return res === size ? low : upsample(low, res, size);
}

// Bilinear, wrap-around upsampling of a square float grid.
function upsample(src, res, size) {
  const out = new Float32Array(size * size);
  const scale = res / size;
  for (let y = 0; y < size; y++) {
    const fy = (y + 0.5) * scale - 0.5;
    const iy = Math.floor(fy);
    const ty = fy - iy;
    const y0 = ((iy % res) + res) % res;
    const y1 = (y0 + 1) % res;
    for (let x = 0; x < size; x++) {
      const fx = (x + 0.5) * scale - 0.5;
      const ix = Math.floor(fx);
      const tx = fx - ix;
      const x0 = ((ix % res) + res) % res;
      const x1 = (x0 + 1) % res;
      const a = src[y0 * res + x0] + (src[y0 * res + x1] - src[y0 * res + x0]) * tx;
      const b = src[y1 * res + x0] + (src[y1 * res + x1] - src[y1 * res + x0]) * tx;
      out[y * size + x] = a + (b - a) * ty;
    }
  }
  return out;
}

// Fractal sum of gradient noise octaves.
function fbm(size, baseCells, octaves, gain, seed) {
  const out = new Float32Array(size * size);
  let amp = 1;
  let total = 0;
  let cells = baseCells;
  for (let o = 0; o < octaves; o++) {
    const layer = gradientNoise(size, cells, seed + o * 7919);
    for (let i = 0; i < out.length; i++) out[i] += layer[i] * amp;
    total += amp;
    amp *= gain;
    cells *= 2;
    if (cells > size / 2) break;
  }
  for (let i = 0; i < out.length; i++) out[i] /= total;
  return out;
}

// Scale a field so its standard deviation is 1 (and its mean 0).
function normalise(f) {
  let m = 0;
  for (let i = 0; i < f.length; i++) m += f[i];
  m /= f.length;
  let v = 0;
  for (let i = 0; i < f.length; i++) v += (f[i] - m) * (f[i] - m);
  const sd = Math.sqrt(v / f.length) || 1;
  for (let i = 0; i < f.length; i++) f[i] = (f[i] - m) / sd;
  return f;
}

/*
 * Domain warping: look the square field `src` (resolution `res`) up at
 * positions pushed around by two slow noise fields, with bilinear
 * filtering. Gives patches with irregular, organic outlines.
 */
function warp(src, res, size, warpX, warpY, amount) {
  const out = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      let u = ((x + 0.5) / size + warpX[i] * amount) * res - 0.5;
      let v = ((y + 0.5) / size + warpY[i] * amount) * res - 0.5;
      const iu = Math.floor(u), iv = Math.floor(v);
      const tu = u - iu, tv = v - iv;
      const u0 = ((iu % res) + res) % res, u1 = (u0 + 1) % res;
      const v0 = ((iv % res) + res) % res, v1 = (v0 + 1) % res;
      const a = src[v0 * res + u0] + (src[v0 * res + u1] - src[v0 * res + u0]) * tu;
      const b = src[v1 * res + u0] + (src[v1 * res + u1] - src[v1 * res + u0]) * tu;
      out[i] = a + (b - a) * tv;
    }
  }
  return out;
}

// Per-pixel white noise in -1..1.
function whiteNoise(size, seed) {
  const rand = rng(seed);
  const out = new Float32Array(size * size);
  for (let i = 0; i < out.length; i++) out[i] = rand() * 2 - 1;
  return out;
}

// Separable box blur with wrap-around; `r` is the radius in pixels.
function boxBlur(src, size, r) {
  if (r < 1) return src;
  const tmp = new Float32Array(size * size);
  const out = new Float32Array(size * size);
  const w = 2 * r + 1;
  for (let y = 0; y < size; y++) {
    const row = y * size;
    let acc = 0;
    for (let k = -r; k <= r; k++) acc += src[row + ((k % size) + size) % size];
    for (let x = 0; x < size; x++) {
      tmp[row + x] = acc / w;
      acc += src[row + ((x + r + 1) % size)] - src[row + ((x - r) % size + size) % size];
    }
  }
  for (let x = 0; x < size; x++) {
    let acc = 0;
    for (let k = -r; k <= r; k++) acc += tmp[(((k % size) + size) % size) * size + x];
    for (let y = 0; y < size; y++) {
      out[y * size + x] = acc / w;
      acc += tmp[((y + r + 1) % size) * size + x] - tmp[(((y - r) % size + size) % size) * size + x];
    }
  }
  return out;
}

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const smooth = (e0, e1, x) => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};

// ---------------------------------------------------------------------------
// Stamping helpers (pores, holes, lines)
// ---------------------------------------------------------------------------

/*
 * Stamp a small round pit (a pore): lowers the height and darkens the
 * albedo inside a radius `r` (pixels) around (cx, cy). `depth` in metres.
 */
function stampPit(field, cx, cy, r, depth, darken) {
  const { size, height, shade } = field;
  const R = Math.ceil(r + 1);
  for (let dy = -R; dy <= R; dy++) {
    const y = ((Math.round(cy) + dy) % size + size) % size;
    for (let dx = -R; dx <= R; dx++) {
      const x = ((Math.round(cx) + dx) % size + size) % size;
      const ddx = Math.round(cx) + dx - cx;
      const ddy = Math.round(cy) + dy - cy;
      const d = Math.sqrt(ddx * ddx + ddy * ddy) / r;
      if (d >= 1.25) continue;
      const i = y * size + x;
      // smooth bowl, with a soft anti-aliased rim
      const bowl = d < 1 ? Math.pow(1 - d * d, 1.5) : 0;
      const cover = 1 - smooth(0.85, 1.25, d);
      height[i] -= depth * bowl;
      shade[i] *= 1 - darken * cover * (0.55 + 0.45 * bowl);
    }
  }
}

/*
 * Stamp a bug hole (blowhole): a small crater left by a trapped air bubble.
 * Steep walls and a rounded bottom, an outline that is not quite round, a
 * dark, shadowed inside and a thin, slightly lighter broken rim.
 */
function stampBugHole(field, rand, cx, cy, r, depth, darken) {
  const { size, height, shade } = field;
  const R = Math.ceil(r * 1.5 + 1);
  // irregular outline: a few low harmonics of the radius
  const h1 = (rand() - 0.5) * 0.35, p1 = rand() * 6.28;
  const h2 = (rand() - 0.5) * 0.25, p2 = rand() * 6.28;
  const h3 = (rand() - 0.5) * 0.15, p3 = rand() * 6.28;
  for (let dy = -R; dy <= R; dy++) {
    const y = ((Math.round(cy) + dy) % size + size) % size;
    for (let dx = -R; dx <= R; dx++) {
      const x = ((Math.round(cx) + dx) % size + size) % size;
      const ddx = Math.round(cx) + dx - cx;
      const ddy = Math.round(cy) + dy - cy;
      const a = Math.atan2(ddy, ddx);
      const rr = r * (1 + h1 * Math.cos(a + p1) + h2 * Math.cos(2 * a + p2) + h3 * Math.cos(3 * a + p3));
      const d = Math.sqrt(ddx * ddx + ddy * ddy) / rr;
      if (d >= 1.5) continue;
      const i = y * size + x;
      const inside = 1 - smooth(0.8, 1.05, d); // anti-aliased hole area
      const bowl = d < 1 ? Math.sqrt(Math.max(0, 1 - Math.pow(d, 4))) : 0; // steep walls
      const rim = Math.exp(-Math.pow((d - 1.12) / 0.12, 2));
      height[i] += -depth * bowl + depth * 0.06 * rim;
      shade[i] *= (1 - darken * inside * (0.6 + 0.4 * bowl)) * (1 + 0.04 * rim);
    }
  }
}

// Draw an anti-aliased line of width `w` (pixels) into a 0..1 mask.
function drawLine(mask, size, x0, y0, x1, y1, w, strength) {
  const minX = Math.floor(Math.min(x0, x1) - w - 2), maxX = Math.ceil(Math.max(x0, x1) + w + 2);
  const minY = Math.floor(Math.min(y0, y1) - w - 2), maxY = Math.ceil(Math.max(y0, y1) + w + 2);
  const vx = x1 - x0, vy = y1 - y0;
  const len2 = vx * vx + vy * vy || 1;
  for (let y = minY; y <= maxY; y++) {
    if (y < 0 || y >= size) continue;
    for (let x = minX; x <= maxX; x++) {
      if (x < 0 || x >= size) continue;
      const t = clamp(((x - x0) * vx + (y - y0) * vy) / len2, 0, 1);
      const px = x0 + vx * t - x, py = y0 + vy * t - y;
      const d = Math.sqrt(px * px + py * py);
      const a = clamp(w * 0.5 + 0.5 - d, 0, 1) * strength;
      const i = y * size + x;
      if (a > mask[i]) mask[i] = a;
    }
  }
}

// A wandering hairline crack made of short segments; written into `mask`.
function drawCrack(mask, size, rand, x, y, angle, steps, stepLen, width) {
  for (let s = 0; s < steps; s++) {
    angle += gauss(rand) * 0.35;
    const nx = x + Math.cos(angle) * stepLen;
    const ny = y + Math.sin(angle) * stepLen;
    const fadeIn = Math.min(1, s / 6), fadeOut = Math.min(1, (steps - s) / 10);
    drawLine(mask, size, x, y, nx, ny, width, 0.35 + 0.65 * fadeIn * fadeOut);
    // occasional short branch
    if (rand() < 0.04) {
      drawCrack(mask, size, rand, nx, ny, angle + (rand() < 0.5 ? 0.9 : -0.9), Math.floor(steps * 0.2), stepLen, width * 0.8);
    }
    x = nx;
    y = ny;
  }
}

// ---------------------------------------------------------------------------
// Output helpers
// ---------------------------------------------------------------------------

const toByte = (v) => clamp(Math.round(v * 255), 0, 255);
const linToSrgb = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);

// Write a linear-light RGB albedo as an sRGB JPEG, and report its spread.
async function writeAlbedo(file, size, r, g, b) {
  const buf = Buffer.alloc(size * size * 3);
  let s = 0, s2 = 0;
  for (let i = 0; i < size * size; i++) {
    buf[i * 3] = toByte(linToSrgb(clamp(r[i], 0, 1)));
    buf[i * 3 + 1] = toByte(linToSrgb(clamp(g[i], 0, 1)));
    buf[i * 3 + 2] = toByte(linToSrgb(clamp(b[i], 0, 1)));
    const l = 0.2126 * buf[i * 3] + 0.7152 * buf[i * 3 + 1] + 0.0722 * buf[i * 3 + 2];
    s += l;
    s2 += l * l;
  }
  const mean = s / (size * size);
  console.log(`    ${path.basename(file)}: mean sRGB luminance ${mean.toFixed(1)}, standard deviation ${Math.sqrt(s2 / (size * size) - mean * mean).toFixed(1)}`);
  await sharp(buf, { raw: { width: size, height: size, channels: 3 } })
    .jpeg({ quality: 94, chromaSubsampling: '4:4:4' })
    .toFile(file);
}

// Write a 0..1 field as an 8-bit grey PNG (roughness).
async function writeGrey(file, size, v) {
  const buf = Buffer.alloc(size * size);
  for (let i = 0; i < size * size; i++) buf[i] = toByte(v[i]);
  await sharp(buf, { raw: { width: size, height: size, channels: 1 } })
    .png({ compressionLevel: 9 })
    .toFile(file);
}

/*
 * Turn a height field (metres) into a tangent-space normal map (OpenGL
 * convention, green = up the texture). `texel` is the size of one pixel in
 * metres; the slopes are multiplied by `boost` (see NORMAL_BOOST). Image
 * rows run top to bottom, which is "down" in texture space.
 */
async function writeNormal(file, size, height, texel, boost) {
  const buf = Buffer.alloc(size * size * 3);
  for (let y = 0; y < size; y++) {
    const yu = ((y - 1 + size) % size) * size;
    const yd = ((y + 1) % size) * size;
    const yc = y * size;
    for (let x = 0; x < size; x++) {
      const xl = (x - 1 + size) % size;
      const xr = (x + 1) % size;
      // Sobel slopes (rise per metre)
      const dx =
        (height[yu + xr] + 2 * height[yc + xr] + height[yd + xr] - height[yu + xl] - 2 * height[yc + xl] - height[yd + xl]) /
        (8 * texel);
      // positive dyDown = the surface rises as we go down the image
      const dyDown =
        (height[yd + xl] + 2 * height[yd + x] + height[yd + xr] - height[yu + xl] - 2 * height[yu + x] - height[yu + xr]) /
        (8 * texel);
      const dv = -dyDown; // rise per metre going UP the texture
      let nx = -dx * boost, ny = -dv * boost, nz = 1;
      const l = Math.sqrt(nx * nx + ny * ny + nz * nz);
      nx /= l; ny /= l; nz /= l;
      const i = (yc + x) * 3;
      buf[i] = toByte(nx * 0.5 + 0.5);
      buf[i + 1] = toByte(ny * 0.5 + 0.5);
      buf[i + 2] = toByte(nz * 0.5 + 0.5);
    }
  }
  await sharp(buf, { raw: { width: size, height: size, channels: 3 } })
    .png({ compressionLevel: 9 })
    .toFile(file);
}

// ---------------------------------------------------------------------------
// Exposed wall concrete
// ---------------------------------------------------------------------------

async function makeWall() {
  const S = SIZE;
  const D = DOMAINS.wall;
  const texel = D.width / S; // metres per pixel (~2 mm)
  const N = S * S;
  // pixel <-> metres (texture row 0 is the TOP of the domain)
  const px = (xm) => ((xm - D.originX) / D.width) * S;
  const py = (ym) => (1 - (ym - D.originY) / D.height) * S;

  console.log('  wall: noise layers');
  const cloudLarge = normalise(fbm(S, 3, 4, 0.55, 101)); // metre-scale tonal drift
  // Cement-paste clouding, 8-70 cm, warped so the patches have irregular edges
  const warpX = fbm(S, 8, 3, 0.5, 251), warpY = fbm(S, 8, 3, 0.5, 252);
  const cloudMid = normalise(warp(fbm(1024, 12, 4, 0.6, 202), 1024, S, warpX, warpY, 0.06));
  const cloudFine = normalise(fbm(S, 120, 3, 0.55, 303)); // 2-7 cm mottling
  const grain = normalise(boxBlur(whiteNoise(S, 404), S, 1)); // sand grain, ~2-6 mm
  const grainSharp = whiteNoise(S, 405);
  const streak = new Float32Array(N); // faint vertical run-off streaks
  {
    const sn = fbm(256, 48, 3, 0.5, 505); // varies along x, stretched in y
    for (let y = 0; y < S; y++) {
      const sy = Math.floor((y / S) * 16) % 256; // very slow along y
      for (let x = 0; x < S; x++) {
        const sx = Math.floor((x / S) * 256);
        streak[y * S + x] = sn[sy * 256 + sx];
      }
    }
  }
  const streakSmooth = normalise(boxBlur(streak, S, 6));

  // Blotches: soft-edged patches 5-40 cm across where the cement paste set a
  // little darker or lighter (curing, release agent, vibration). Domain-warped
  // noise pushed through a soft threshold, so they have organic edges.
  console.log('  wall: blotches');
  const blotchSrc = warp(fbm(1024, 14, 5, 0.55, 253), 1024, S, warpY, warpX, 0.05);
  const blotchSrc2 = fbm(S, 9, 4, 0.5, 254);
  const blotch = new Float32Array(N); // -1 darker .. +1 lighter
  const blotchWarm = new Float32Array(N); // -1 greyer .. +1 warmer
  for (let i = 0; i < N; i++) {
    const b = blotchSrc[i];
    blotch[i] = smooth(0.06, 0.3, b) - smooth(0.06, 0.3, -b) * 0.9;
    blotchWarm[i] = smooth(-0.1, 0.35, blotchSrc2[i]) * 2 - 1;
  }
  const blotchS = boxBlur(blotch, S, 2);

  // Surface relief at the scale the camera can see (5-30 mm): the slightly
  // pitted, sandy skin that formed concrete gets where the paste was thin.
  const relief = normalise(fbm(S, 400, 3, 0.6, 606)); // 2 cm cells and finer
  const reliefMask = normalise(fbm(S, 20, 3, 0.5, 607)); // where the skin is rougher

  const height = new Float32Array(N);
  const shade = new Float32Array(N).fill(1); // multiplicative darkening from pits etc.
  const field = { size: S, height, shade };

  // Formwork panels: vertical joints every 1.2 m, offset so they do not
  // line up symmetrically with the emblem's centre.
  const joints = [];
  for (let xj = -3.25; xj < 4.0; xj += 1.2) joints.push(xj);
  const panelTone = [];
  const panelWarm = [];
  {
    const r = rng(616);
    for (let i = 0; i <= joints.length; i++) {
      panelTone.push(1 + (r() - 0.5) * 0.1); // +-5 %
      panelWarm.push((r() - 0.5) * 0.03);
    }
  }
  const panelIndex = (xm) => {
    let k = 0;
    while (k < joints.length && xm > joints[k]) k++;
    return k;
  };

  // Joint mask: a thin slightly darker line with a hairline lip, its width
  // wandering a little along its length.
  console.log('  wall: joints, tie holes, bug holes, pores');
  const jointMask = new Float32Array(N);
  const jointWobble = gradientNoise(S, 64, 707);
  for (const xj of joints) {
    const cx = px(xj);
    for (let y = 0; y < S; y++) {
      const wob = jointWobble[y * S + Math.floor(cx) % S] * 0.8;
      for (let dx = -6; dx <= 6; dx++) {
        const x = Math.floor(cx) + dx;
        if (x < 0 || x >= S) continue;
        const d = Math.abs(x + 0.5 - (cx + wob));
        const i = y * S + x;
        jointMask[i] = Math.max(jointMask[i], 1 - smooth(0.6, 2.2, d));
        // a tiny ridge on one side (grout leak against the panel edge)
        if (dx > 0 && dx < 4) height[i] += 0.0003 * (1 - d / 4);
        if (d < 1.2) height[i] -= 0.0008 * (1 - d / 1.2);
      }
    }
  }

  // Grout bleed: where cement paste leaked between the form panels the
  // concrete beside a joint is darker and rougher, in irregular patches.
  const bleed = new Float32Array(N);
  {
    const bleedNoise = fbm(512, 24, 3, 0.5, 717);
    for (const xj of joints) {
      const cx = px(xj);
      for (let y = 0; y < S; y++) {
        const amt = smooth(-0.1, 0.3, bleedNoise[Math.floor((y / S) * 512) * 512 + (Math.floor(cx / 8) % 512)]);
        if (amt <= 0) continue;
        const wPx = (0.008 + 0.02 * amt) / texel;
        for (let dx = -Math.ceil(wPx); dx <= Math.ceil(wPx); dx++) {
          const x = Math.floor(cx) + dx;
          if (x < 0 || x >= S) continue;
          const d = Math.abs(x + 0.5 - cx) / wPx;
          bleed[y * S + x] = Math.max(bleed[y * S + x], amt * (1 - smooth(0.25, 1, d)));
        }
      }
    }
  }

  // Form-tie holes: 24 mm cones filled with a mortar plug, on a 0.6 x 0.6 m
  // grid (two columns per 1.2 m panel). The plug sits a few mm back and is a
  // touch lighter; the cone's edge catches a little shadow.
  const rTie = rng(808);
  const tieRing = new Float32Array(N);
  const tiePlug = new Float32Array(N);
  const panelEdges = [-4.45, ...joints, 4.75];
  for (let p = 0; p < panelEdges.length - 1; p++) {
    const a = panelEdges[p], b = panelEdges[p + 1];
    for (const xt of [a + 0.3, a + 0.9]) {
      if (xt > b - 0.1) continue;
      for (let yt = 0.3; yt < 7.6; yt += 0.6) {
        const cx = px(xt + (rTie() - 0.5) * 0.012);
        const cy = py(yt + (rTie() - 0.5) * 0.012);
        const r = (0.0115 + rTie() * 0.001) / texel;
        const R = Math.ceil(r * 1.4 + 2);
        const strength = 0.7 + rTie() * 0.3;
        for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
          const x = Math.round(cx) + dx, y = Math.round(cy) + dy;
          if (x < 0 || y < 0 || x >= S || y >= S) continue;
          const d = Math.hypot(x - cx, y - cy) / r;
          const i = y * S + x;
          const disc = 1 - smooth(0.78, 0.95, d);
          const ring = Math.exp(-Math.pow((d - 0.92) / 0.1, 2));
          tiePlug[i] = Math.max(tiePlug[i], disc * strength);
          tieRing[i] = Math.max(tieRing[i], ring * strength);
          // the plug sits 2.5 mm back, the cone wall slopes down to it
          height[i] -= (0.0025 * disc + 0.0012 * ring) * strength;
        }
      }
    }
  }

  // Bug holes (blowholes): 2-14 mm across, few large and more small, in
  // clusters, and more of them near the foot of the wall and near the top
  // of the pour, where trapped air collects against the formwork.
  const rBug = rng(909);
  const area = D.width * D.height;
  const clusterField = fbm(256, 6, 3, 0.5, 910);
  const nBug = Math.floor(area * 150);
  let bugs = 0;
  for (let k = 0; k < nBug; k++) {
    const x = rBug() * S, y = rBug() * S;
    const ym = D.originY + (1 - y / S) * D.height;
    const c = clusterField[Math.floor((y / S) * 256) * 256 + Math.floor((x / S) * 256)];
    const zone = Math.max(1 - smooth(0.0, 0.45, ym), smooth(6.6, 7.2, ym));
    if (rBug() > clamp(0.25 + c * 1.4, 0.05, 1) * (0.6 + 0.4 * zone)) continue;
    bugs++;
    const rMm = 1.0 + Math.pow(rBug(), 2.0) * 6; // radius in mm (2-14 mm across)
    const r = (rMm / 1000) / texel;
    stampBugHole(field, rBug, x, y, r, Math.min(0.006, (rMm / 1000) * (0.6 + rBug() * 0.4)), 0.5 + rBug() * 0.3);
  }
  // Fine pores: many tiny pits, sub-millimetre to a millimetre, denser in
  // some areas than others; up close they read as the concrete's skin.
  const nPore = Math.floor(area * 12000);
  for (let k = 0; k < nPore; k++) {
    const x = rBug() * S, y = rBug() * S;
    const c = clusterField[Math.floor((y / S) * 256) * 256 + Math.floor((x / S) * 256)];
    if (rBug() > 0.3 + c * 1.1) continue;
    const r = 0.4 + Math.pow(rBug(), 2) * 0.9; // 1.5-5 mm across
    stampPit(field, x, y, r, 0.0004 + rBug() * 0.0008, 0.25 + rBug() * 0.25);
  }
  // pour lines: faint, slightly wavy horizontal bands where one layer of the
  // pour met the next (a few per metre, very soft)
  const pour = new Float32Array(N);
  {
    const rp = rng(919);
    const wav = fbm(1024, 6, 3, 0.5, 920);
    for (let yl = -0.3; yl < 7.5; yl += 0.25 + rp() * 0.35) {
      const amp = (rp() - 0.4) * 1.0;
      const w = (0.01 + rp() * 0.03) / texel;
      for (let x = 0; x < S; x++) {
        const yc = py(yl) + wav[Math.floor(x / 4) % 1024] * 0.04 / texel;
        for (let dy = -Math.ceil(2 * w); dy <= Math.ceil(2 * w); dy++) {
          const y = Math.round(yc) + dy;
          if (y < 0 || y >= S) continue;
          pour[y * S + x] += amp * Math.exp(-Math.pow((y - yc) / w, 2));
        }
      }
    }
  }
  console.log(`  wall: ${bugs} bug holes`);

  console.log('  wall: composing');
  const R = new Float32Array(N), G = new Float32Array(N), B = new Float32Array(N);
  const rough = new Float32Array(N);
  // warm grey base in linear light (~ sRGB 151,146,139)
  const base = [0.31, 0.29, 0.265];
  for (let y = 0; y < S; y++) {
    const ym = D.originY + (1 - (y + 0.5) / S) * D.height;
    // slightly darker in the bottom 40 cm (splash, dust), and a narrow
    // band of dust and mop splash right at the floor
    const foot = (1 - 0.06 * (1 - smooth(0.0, 0.45, ym))) * (1 - 0.1 * (1 - smooth(0.0, 0.05, ym)));
    for (let x = 0; x < S; x++) {
      const i = y * S + x;
      const xm = D.originX + ((x + 0.5) / S) * D.width;
      const pi = panelIndex(xm);
      const rm = smooth(-0.6, 1.2, reliefMask[i]); // 0 smooth skin .. 1 sandy skin
      const tone =
        panelTone[pi] *
        (1 + cloudLarge[i] * 0.06 + cloudMid[i] * 0.13 + cloudFine[i] * 0.075 + blotchS[i] * 0.11 +
          grain[i] * (0.045 + 0.035 * rm) + grainSharp[i] * 0.025 + streakSmooth[i] * 0.03 + relief[i] * 0.03 * rm + pour[i] * 0.03) *
        (1 - jointMask[i] * 0.12) *
        (1 - bleed[i] * 0.1) *
        (1 - tieRing[i] * 0.14) * (1 + tiePlug[i] * 0.035) *
        shade[i] *
        foot;
      const warm = panelWarm[pi] + cloudMid[i] * 0.008 + cloudLarge[i] * 0.006 + blotchWarm[i] * 0.01;
      R[i] = base[0] * tone * (1 + warm);
      G[i] = base[1] * tone;
      B[i] = base[2] * tone * (1 - warm * 1.4);
      // matte; a touch smoother where the paste is dense, rougher in pores
      // and where the skin is sandy
      rough[i] = clamp(0.82 + cloudMid[i] * 0.03 + blotchS[i] * 0.03 + rm * 0.06 + grain[i] * 0.02 + bleed[i] * 0.06 + (1 - shade[i]) * 0.3, 0.6, 1.0);
      // surface relief: panel waviness, the pitted skin, sand grain
      height[i] += cloudLarge[i] * 0.0006 + cloudMid[i] * 0.00015 + relief[i] * (0.0002 + 0.0005 * rm) +
        grain[i] * (0.0001 + 0.00018 * rm) + grainSharp[i] * 0.00004;
    }
  }

  console.log('  wall: writing');
  await writeAlbedo(path.join(OUT_DIR, 'wall_albedo.jpg'), S, R, G, B);
  await writeGrey(path.join(OUT_DIR, 'wall_roughness.png'), S, rough);
  await writeNormal(path.join(OUT_DIR, 'wall_normal.png'), S, height, texel, NORMAL_BOOST.wall);
}

// ---------------------------------------------------------------------------
// Polished floor concrete
// ---------------------------------------------------------------------------

async function makeFloor() {
  const S = SIZE;
  const D = DOMAINS.floor;
  const texel = D.width / S; // ~2.4 mm
  const N = S * S;
  // texture x -> world x, texture row -> world z (row 0 = far end, z = 9.5 m)
  const px = (xm) => ((xm - D.originX) / D.width) * S;
  const pz = (zm) => (1 - (zm - D.originY) / D.height) * S;

  console.log('  floor: noise layers');
  // Trowel-burn clouds, 0.3-1 m: where the power trowel burnished the
  // surface it is darker and glossier. Domain-warped, so the patches swirl.
  const warpA = fbm(S, 6, 3, 0.5, 1101);
  const warpB = fbm(S, 6, 3, 0.5, 1102);
  const burn = normalise(warp(fbm(1024, 10, 4, 0.55, 1103), 1024, S, warpA, warpB, 0.07));
  const large = normalise(fbm(S, 3, 3, 0.5, 1104));
  const fine = normalise(fbm(S, 160, 3, 0.5, 1105));
  const grain = whiteNoise(S, 1106);
  const grainSoft = normalise(boxBlur(whiteNoise(S, 1107), S, 1));
  const wipe = normalise(fbm(S, 14, 4, 0.5, 1108)); // roughness variation (wear, wipe marks)
  const undul = normalise(fbm(S, 5, 3, 0.5, 1109)); // gentle waviness of the slab, 1-2 m

  const height = new Float32Array(N);
  const shade = new Float32Array(N).fill(1);
  const field = { size: S, height, shade };

  // Fine aggregate ("salt and pepper") exposed by grinding: many 1-4 mm
  // specks, light and dark, and a few larger stones.
  console.log('  floor: aggregate, joints, cracks, scuffs');
  const r = rng(1201);
  const area = D.width * D.height;
  const speck = new Float32Array(N); // -1 dark .. +1 light
  const stampSpeck = (cx, cy, rad, val) => {
    const R = Math.ceil(rad + 1);
    for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
      const x = Math.round(cx) + dx, y = Math.round(cy) + dy;
      if (x < 0 || y < 0 || x >= S || y >= S) continue;
      const d = Math.hypot(x - cx, y - cy) / rad;
      if (d > 1.2) continue;
      const a = 1 - smooth(0.7, 1.2, d);
      const i = y * S + x;
      speck[i] = speck[i] * (1 - a) + val * a;
    }
  };
  for (let k = 0; k < Math.floor(area * 14000); k++) {
    const rad = 0.35 + Math.pow(r(), 2.2) * 1.3; // 1-4 mm
    stampSpeck(r() * S, r() * S, rad, r() < 0.5 ? -(0.3 + r() * 0.7) : 0.3 + r() * 0.7);
  }
  for (let k = 0; k < Math.floor(area * 300); k++) {
    const rad = 1.6 + Math.pow(r(), 2) * 2.5; // 8-20 mm stones, sparse
    stampSpeck(r() * S, r() * S, rad, r() < 0.6 ? -(0.2 + r() * 0.3) : 0.2 + r() * 0.4);
  }
  // A few small pits (air voids opened by grinding).
  for (let k = 0; k < Math.floor(area * 120); k++) {
    stampPit(field, r() * S, r() * S, 0.5 + Math.pow(r(), 3) * 1.8, 0.0008, 0.45);
  }

  // Saw-cut joints: 3.5 mm wide, wandering a little along the cut, filled
  // with darker sealant, with small chips broken out of their edges.
  const joint = new Float32Array(N);
  const chip = new Float32Array(N);
  const jw = gradientNoise(S, 48, 1210);
  const rj = rng(1211);
  const sawCut = (horizontal, at) => {
    for (let t = 0; t < S; t++) {
      const wob = jw[horizontal ? Math.floor(at) * S + t : t * S + Math.floor(at)] * 0.35; // +-0.8 mm
      const halfW = (0.00175 + 0.0003 * jw[(t * 7) % N]) / texel;
      for (let o = -5; o <= 5; o++) {
        const c = Math.floor(at) + o;
        if (c < 0 || c >= S) continue;
        const d = Math.abs(c + 0.5 - (at + wob));
        const i = horizontal ? c * S + t : t * S + c;
        joint[i] = Math.max(joint[i], 1 - smooth(halfW - 0.5, halfW + 0.5, d));
      }
      // a chip every 10-40 cm, 2-6 mm, on one side of the cut
      if (rj() < texel / 0.2) {
        const side = rj() < 0.5 ? -1 : 1;
        const cr = (0.001 + rj() * 0.002) / texel;
        const cc = at + wob + side * (halfW + cr * 0.6);
        const cx = horizontal ? t : cc, cy = horizontal ? cc : t;
        for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
          const x = Math.round(cx) + dx, y = Math.round(cy) + dy;
          if (x < 0 || y < 0 || x >= S || y >= S) continue;
          const d = Math.hypot(x - cx, (y - cy) * 1.6) / cr;
          if (d < 1.2) chip[y * S + x] = Math.max(chip[y * S + x], 1 - smooth(0.7, 1.2, d));
        }
      }
    }
  };
  for (const z of [2.6, 6.2]) sawCut(true, pz(z));
  for (const x of [-2.75, 3.35]) sawCut(false, px(x));
  const crack = new Float32Array(N);
  const rc = rng(1301);
  // cracks that start at joints or near the wall and wander a little
  drawCrack(crack, S, rc, px(-2.75), pz(0.9), 0.15, 160, 3.5, 0.9);
  drawCrack(crack, S, rc, px(1.2), pz(2.6), -1.9, 90, 3.5, 0.8);
  drawCrack(crack, S, rc, px(-3.6), pz(0.05), -1.35, 80, 3.2, 0.7);
  drawCrack(crack, S, rc, px(3.35), pz(1.6), 3.0, 120, 3.5, 0.8);
  const crackS = boxBlur(crack, S, 1);

  // Scuffs: thin curved marks 0.5-2 cm wide where the polish is a little
  // duller, so reflections break up the way they do on a floor that is
  // walked on. In the strip in front of the O they are fainter, so nothing
  // reads as a stain in the middle of its reflection.
  const scuff = new Float32Array(N);
  {
    const rs = rng(1401);
    const nScuff = Math.floor(area * 5);
    for (let k = 0; k < nScuff; k++) {
      const cx = rs() * S, cy = rs() * S;
      const rad = (0.2 + rs() * 0.8) / texel;
      const a0 = rs() * Math.PI * 2, span = (0.1 + rs() * 0.5) / ((rad * texel) / 0.5);
      const width = (0.005 + rs() * 0.015) / texel;
      const strength = 0.3 + rs() * 0.7;
      const steps = Math.ceil(rad * span);
      for (let t = 0; t <= steps; t++) {
        const a = a0 + (span * t) / steps;
        const along = Math.min(t / steps, 1 - t / steps) * 2;
        const w = width * smooth(0, 0.5, along);
        if (w < 0.5) continue;
        const x = cx + Math.cos(a) * rad, y = cy + Math.sin(a) * rad;
        const R = Math.ceil(w);
        for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
          const xx = Math.round(x) + dx, yy = Math.round(y) + dy;
          if (xx < 0 || yy < 0 || xx >= S || yy >= S) continue;
          const d = Math.hypot(xx - x, yy - y) / w;
          if (d > 1) continue;
          const i = yy * S + xx;
          scuff[i] = Math.max(scuff[i], strength * (1 - d * d));
        }
      }
    }
  }
  const scuffS = boxBlur(scuff, S, 1);

  console.log('  floor: composing');
  const R = new Float32Array(N), G = new Float32Array(N), B = new Float32Array(N);
  const rough = new Float32Array(N);
  const base = [0.15, 0.145, 0.135]; // ~ sRGB 108,106,103 : darker than the wall
  for (let y = 0; y < S; y++) {
    const zm = D.originY + (1 - (y + 0.5) / S) * D.height;
    // dust line along the foot of the wall: lighter and duller
    const dust = 1 - smooth(0.0, 0.06, zm);
    for (let x = 0; x < S; x++) {
      const i = y * S + x;
      const xm = D.originX + ((x + 0.5) / S) * D.width;
      // the strip in front of the O, where its reflection lies
      const centre = (1 - smooth(1.6, 2.4, Math.abs(xm))) * (1 - smooth(3.5, 4.5, zm));
      const sc = scuffS[i] * (1 - 0.65 * centre);
      const tone =
        (1 + large[i] * 0.07 + burn[i] * 0.17 + fine[i] * 0.04 + grainSoft[i] * 0.03 + grain[i] * 0.04 + speck[i] * 0.3 + sc * (0.04 - 0.02 * centre)) *
        (1 - joint[i] * 0.5) *
        (1 - chip[i] * 0.25) *
        (1 - crackS[i] * 0.22) *
        (1 + dust * 0.07) *
        shade[i];
      const warm = burn[i] * 0.006 + large[i] * 0.005;
      R[i] = base[0] * tone * (1 + warm);
      G[i] = base[1] * tone;
      B[i] = base[2] * tone * (1 - warm * 1.2);
      // polished but not a mirror (satin, about 0.2): reflections stay soft
      // and break up over the burnish clouds, wear and scuffs
      const rg = 0.2 + burn[i] * 0.06 + wipe[i] * 0.045 + large[i] * 0.025 + fine[i] * 0.015 + Math.abs(speck[i]) * 0.02 + sc * 0.14 + crackS[i] * 0.2 + dust * 0.15 + (1 - shade[i]) * 0.4;
      rough[i] = Math.max(clamp(rg, 0.1, 0.5), joint[i] * 0.8, chip[i] * 0.6);
      height[i] += undul[i] * 0.0015 + large[i] * 0.0004 + burn[i] * 0.00006 + fine[i] * 0.00002 - joint[i] * 0.0025 - chip[i] * 0.0012 - crackS[i] * 0.0003;
    }
  }

  console.log('  floor: writing');
  await writeAlbedo(path.join(OUT_DIR, 'floor_albedo.jpg'), S, R, G, B);
  await writeGrey(path.join(OUT_DIR, 'floor_roughness.png'), S, rough);
  await writeNormal(path.join(OUT_DIR, 'floor_normal.png'), S, height, texel, NORMAL_BOOST.floor);
}

// ---------------------------------------------------------------------------
// Cream plaster / microcement of the frame
// ---------------------------------------------------------------------------

async function makePlaster() {
  const S = SIZE;
  const D = DOMAINS.plaster;
  const texel = D.width / S; // ~1 mm
  const N = S * S;

  console.log('  plaster: noise layers');
  const cloudLarge = normalise(fbm(S, 4, 4, 0.5, 2101));
  const wx = fbm(S, 6, 3, 0.5, 2104), wy = fbm(S, 6, 3, 0.5, 2105);
  const cloudMid = normalise(warp(fbm(1024, 16, 4, 0.55, 2102), 1024, S, wx, wy, 0.05)); // cloudy patches, 10-30 cm
  const grain = normalise(boxBlur(whiteNoise(S, 2103), S, 1));
  const undul = normalise(fbm(S, 10, 3, 0.5, 2106)); // hand-applied, not machine-flat

  // Trowel strokes: overlapping curved bands, each a touch lighter or darker
  // and a touch smoother or rougher, with a faint ridge at their edge.
  console.log('  plaster: trowel strokes');
  const strokeTone = new Float32Array(N);
  const strokeRough = new Float32Array(N);
  const height = new Float32Array(N);
  const r = rng(2201);
  const nStrokes = 2600;
  for (let k = 0; k < nStrokes; k++) {
    const cx = r() * S, cy = r() * S; // arc centre
    const rad = (0.1 + r() * 0.3) / texel; // arc radius
    const a0 = r() * Math.PI * 2;
    const span = 0.5 + r() * 1.1; // radians
    const width = (0.04 + r() * 0.08) / texel;
    const tone = (r() - 0.5) * 0.1; // +-5 %
    const rgh = (r() - 0.5) * 0.16;
    // bounding box of the arc band
    const pts = [];
    for (let t = 0; t <= 8; t++) {
      const a = a0 + (span * t) / 8;
      pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]);
    }
    const minX = Math.floor(Math.min(...pts.map((p) => p[0])) - width), maxX = Math.ceil(Math.max(...pts.map((p) => p[0])) + width);
    const minY = Math.floor(Math.min(...pts.map((p) => p[1])) - width), maxY = Math.ceil(Math.max(...pts.map((p) => p[1])) + width);
    for (let y = minY; y <= maxY; y += 1) {
      const yy = ((y % S) + S) % S;
      for (let x = minX; x <= maxX; x += 1) {
        const dx = x - cx, dy = y - cy;
        const d = Math.sqrt(dx * dx + dy * dy);
        const off = Math.abs(d - rad) / (width * 0.5); // 0 at band centre, 1 at edge
        if (off > 1.15) continue;
        let a = Math.atan2(dy, dx) - a0;
        a = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        if (a > span) continue;
        const along = Math.min(a / span, 1 - a / span) * 2; // 0 at the ends, 1 in the middle
        const endFade = smooth(0, 0.35, along);
        const body = (1 - smooth(0.5, 1.0, off)) * endFade;
        const edge = Math.exp(-Math.pow((off - 1.0) / 0.08, 2)) * endFade;
        const xx = ((x % S) + S) % S;
        const i = yy * S + xx;
        strokeTone[i] = strokeTone[i] * (1 - body * 0.7) + tone * body;
        strokeRough[i] = strokeRough[i] * (1 - body * 0.7) + rgh * body;
        height[i] += edge * 0.0001 - body * 0.00003;
      }
    }
  }

  // Pinholes (air bubbles opened by the trowel), sparse and tiny.
  const shade = new Float32Array(N).fill(1);
  {
    const rp = rng(2301);
    const field = { size: S, height, shade };
    const nPin = Math.floor(D.width * D.height * 420);
    for (let k = 0; k < nPin; k++) {
      stampPit(field, rp() * S, rp() * S, 0.4 + Math.pow(rp(), 2) * 1.4, 0.0003, 0.14 + rp() * 0.18);
    }
  }

  console.log('  plaster: composing');
  const R = new Float32Array(N), G = new Float32Array(N), B = new Float32Array(N);
  const rough = new Float32Array(N);
  // warm cream microcement, ~ sRGB 222,211,190: clearly lighter than the
  // concrete but not white
  const base = [0.72, 0.645, 0.52];
  for (let y = 0; y < S; y++) {
    // The front of the plate is mapped flat onto this texture (world y =
    // originY .. originY + height, top row = top). Its lowest 30 cm, nearest
    // the floor, carries a faint grime of dust and mop splash. (The rounded
    // edges and the tunnel are mapped onto rows near the TOP of the texture,
    // where there is none; they get the same grime from vertex colours.)
    const ym = D.originY + (1 - (y + 0.5) / S) * D.height;
    const grime = 0.93 + 0.07 * smooth(0.02, 0.33, ym);
    for (let x = 0; x < S; x++) {
      const i = y * S + x;
      const tone = (1 + cloudLarge[i] * 0.025 + cloudMid[i] * 0.045 + strokeTone[i] * 1.2 + grain[i] * 0.012) * shade[i] * grime;
      const warm = cloudLarge[i] * 0.004 + cloudMid[i] * 0.004;
      R[i] = base[0] * tone * (1 + warm);
      G[i] = base[1] * tone;
      B[i] = base[2] * tone * (1 - warm * 1.5);
      rough[i] = clamp(0.84 + strokeRough[i] + cloudMid[i] * 0.03 + grain[i] * 0.015 + (1 - shade[i]) * 0.3, 0.72, 0.95);
      height[i] += undul[i] * 0.0003 + cloudMid[i] * 0.00004 + grain[i] * 0.00001;
    }
  }

  console.log('  plaster: writing');
  await writeAlbedo(path.join(OUT_DIR, 'plaster_albedo.jpg'), S, R, G, B);
  await writeGrey(path.join(OUT_DIR, 'plaster_roughness.png'), S, rough);
  await writeNormal(path.join(OUT_DIR, 'plaster_normal.png'), S, height, texel, NORMAL_BOOST.plaster);
}

// ---------------------------------------------------------------------------
// The scenery photo with a soft border
// ---------------------------------------------------------------------------

/*
 * The glowing plane behind the wall shows the client's photo, but the
 * tunnel's inner faces and the polished floor also "see" the plane outside
 * the photo's own rectangle. There the photo is continued: mirrored at
 * every side and heavily blurred, so
 * the light it gives continues the photo's colours without hard edges.
 * The photo itself sits unchanged in the middle.
 */
async function makeSceneryExtended() {
  const src = path.join(__dirname, 'scenery-source.jpg');
  const meta = await sharp(src).metadata();
  const bx = Math.round(meta.width * SCENERY_BORDER), by = Math.round(meta.height * SCENERY_BORDER);
  const all = await sharp(src).extend({ left: bx, right: bx, top: by, bottom: by, extendWith: 'mirror' }).blur(60).toBuffer();
  await sharp(all)
    .composite([{ input: src, left: bx, top: by }])
    .jpeg({ quality: 92, chromaSubsampling: '4:4:4' })
    .toFile(path.join(OUT_DIR, 'scenery_extended.jpg'));
}

// ---------------------------------------------------------------------------

const FILES = ['wall', 'floor', 'plaster'].flatMap((m) => [`${m}_albedo.jpg`, `${m}_roughness.png`, `${m}_normal.png`]).concat(['scenery_extended.jpg']);

function texturesExist() {
  const mf = path.join(OUT_DIR, 'manifest.json');
  if (!fs.existsSync(mf) || !FILES.every((f) => fs.existsSync(path.join(OUT_DIR, f)))) return false;
  return JSON.parse(fs.readFileSync(mf, 'utf8')).version === VERSION;
}

async function generateTextures({ force = false } = {}) {
  if (!force && texturesExist()) {
    console.log('textures: already present (use --force to rebuild)');
    return;
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const t0 = Date.now();
  console.log('textures: generating at ' + SIZE + ' px');
  await makeWall();
  await makeFloor();
  await makePlaster();
  await makeSceneryExtended();
  fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify({
    version: VERSION, size: SIZE, domains: DOMAINS, normalBoost: NORMAL_BOOST, sceneryBorder: SCENERY_BORDER,
  }, null, 2));
  console.log(`textures: done in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
}

module.exports = { generateTextures, DOMAINS, SIZE };

if (require.main === module) {
  generateTextures({ force: process.argv.includes('--force') }).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

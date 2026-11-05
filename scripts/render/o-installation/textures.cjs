/*
 * textures.cjs
 *
 * Generates the procedural PBR textures for the O installation render:
 *
 *   textures/wall_albedo.jpg     wall_roughness.png     wall_normal.png
 *   textures/floor_albedo.jpg    floor_roughness.png    floor_normal.png
 *   textures/plaster_albedo.jpg  plaster_roughness.png  plaster_normal.png
 *   textures/manifest.json       (how many metres each texture covers)
 *
 * Everything is built from seeded random numbers, so running it twice gives
 * byte-identical images. Nothing is photographed or copied from anywhere.
 *
 * How the textures are made, in plain terms:
 *   - We build a HEIGHT field (in metres) and an ALBEDO (base colour) field
 *     and a ROUGHNESS field for each material, as large float arrays.
 *   - Large, soft colour variation comes from layered gradient noise.
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

// Real-world size (metres) covered by one texture, per material.
// The wall texture covers x -4..4 m and y -0.5..7.5 m of the wall, the floor
// texture covers x -5..5 m and z -0.5..9.5 m in front of the wall.
const DOMAINS = {
  wall: { width: 8.0, height: 8.0, originX: -4.0, originY: -0.5 },
  floor: { width: 10.0, height: 10.0, originX: -5.0, originY: -0.5 },
  plaster: { width: 4.0, height: 4.0, originX: -2.0, originY: -0.5 },
};

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
 * Stamp a round pit: lowers the height and darkens the albedo inside a
 * radius `r` (pixels) around (cx, cy). `depth` in metres.
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

// Write a linear-light RGB albedo as an sRGB JPEG.
async function writeAlbedo(file, size, r, g, b) {
  const buf = Buffer.alloc(size * size * 3);
  for (let i = 0; i < size * size; i++) {
    buf[i * 3] = toByte(linToSrgb(clamp(r[i], 0, 1)));
    buf[i * 3 + 1] = toByte(linToSrgb(clamp(g[i], 0, 1)));
    buf[i * 3 + 2] = toByte(linToSrgb(clamp(b[i], 0, 1)));
  }
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
 * metres. Image rows run top to bottom, which is "down" in texture space.
 */
async function writeNormal(file, size, height, texel) {
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
      let nx = -dx, ny = -dv, nz = 1;
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
  const cloudLarge = fbm(S, 3, 4, 0.55, 101); // metre-scale tonal drift
  const cloudMid = fbm(S, 24, 4, 0.5, 202); // 10-30 cm cement paste clouds
  const cloudFine = fbm(S, 160, 3, 0.5, 303); // centimetre mottling
  const grain = boxBlur(whiteNoise(S, 404), S, 1); // sand grain, ~2-6 mm
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
  const streakSmooth = boxBlur(streak, S, 6);

  // Blotches: soft-edged patches 5-40 cm across where the cement paste set a
  // little darker or lighter (curing, release agent, vibration). Made from
  // domain-warped noise pushed through a soft threshold, so they have
  // organic edges instead of looking like smooth clouds.
  console.log('  wall: blotches');
  const warpX = fbm(S, 10, 3, 0.5, 251), warpY = fbm(S, 10, 3, 0.5, 252);
  const blotchSrc = fbm(1024, 14, 5, 0.55, 253);
  const blotchSrc2 = fbm(1024, 9, 4, 0.5, 254);
  const blotch = new Float32Array(N); // -1 darker .. +1 lighter
  const blotchWarm = new Float32Array(N); // -1 greyer .. +1 warmer
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const i = y * S + x;
      const u = ((x / S + warpX[i] * 0.05) % 1 + 1) % 1;
      const v = ((y / S + warpY[i] * 0.05) % 1 + 1) % 1;
      const j = Math.floor(v * 1024) * 1024 + Math.floor(u * 1024);
      const b = blotchSrc[j];
      blotch[i] = smooth(0.06, 0.32, b) - smooth(0.06, 0.32, -b) * 0.8;
      blotchWarm[i] = smooth(-0.1, 0.35, blotchSrc2[j]) * 2 - 1;
    }
  }
  const blotchS = boxBlur(blotch, S, 2);

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
    const r = rng(606);
    for (let i = 0; i <= joints.length; i++) {
      panelTone.push(1 + (r() - 0.5) * 0.07);
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
  console.log('  wall: joints, tie holes, bug holes');
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
        if (dx > 0 && dx < 4) height[i] += 0.00025 * (1 - d / 4);
        if (d < 1.2) height[i] -= 0.0006 * (1 - d / 1.2);
      }
    }
  }

  // Grout bleed: where cement paste leaked between the form panels the
  // concrete beside a joint is a little darker and rougher, in patches.
  const bleed = new Float32Array(N);
  {
    const bleedNoise = fbm(512, 24, 3, 0.5, 717);
    for (const xj of joints) {
      const cx = px(xj);
      for (let y = 0; y < S; y++) {
        const amt = smooth(-0.05, 0.3, bleedNoise[Math.floor((y / S) * 512) * 512 + (Math.floor(cx / 8) % 512)]);
        if (amt <= 0) continue;
        const wPx = (0.006 + 0.012 * amt) / texel;
        for (let dx = -Math.ceil(wPx); dx <= Math.ceil(wPx); dx++) {
          const x = Math.floor(cx) + dx;
          if (x < 0 || x >= S) continue;
          const d = Math.abs(x + 0.5 - cx) / wPx;
          bleed[y * S + x] = Math.max(bleed[y * S + x], amt * (1 - smooth(0.3, 1, d)));
        }
      }
    }
  }

  // Form-tie holes: 22 mm plugged holes, very faint, on a grid inside each panel.
  const rTie = rng(808);
  const tieMask = new Float32Array(N);
  const panelEdges = [-4.45, ...joints, 4.75];
  for (let p = 0; p < panelEdges.length - 1; p++) {
    const a = panelEdges[p], b = panelEdges[p + 1];
    for (const xt of [a + 0.3, b - 0.3]) {
      for (let yt = 0.45; yt < 7.6; yt += 0.9) {
        const cx = px(xt + (rTie() - 0.5) * 0.01);
        const cy = py(yt + (rTie() - 0.5) * 0.01);
        const r = 0.011 / texel;
        const R = Math.ceil(r + 3);
        for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
          const x = Math.round(cx) + dx, y = Math.round(cy) + dy;
          if (x < 0 || y < 0 || x >= S || y >= S) continue;
          const d = Math.hypot(x - cx, y - cy) / r;
          const i = y * S + x;
          const disc = 1 - smooth(0.85, 1.1, d);
          const ring = Math.exp(-Math.pow((d - 1) / 0.12, 2));
          tieMask[i] = Math.max(tieMask[i], disc * 0.6 + ring * 0.4);
          height[i] -= 0.0004 * disc + 0.0003 * ring;
        }
      }
    }
  }

  // Bug holes (blowholes): many small, few large, clustered a little.
  const rBug = rng(909);
  const area = D.width * D.height;
  const clusterField = fbm(256, 6, 3, 0.5, 910);
  const nBug = Math.floor(area * 55);
  for (let k = 0; k < nBug; k++) {
    const x = rBug() * S, y = rBug() * S;
    const c = clusterField[Math.floor((y / S) * 256) * 256 + Math.floor((x / S) * 256)];
    if (rBug() > 0.35 + c * 0.9) continue; // more holes where the cluster field is high
    const rMm = 0.6 + Math.pow(rBug(), 3.2) * 4.5; // radius in mm
    const r = (rMm / 1000) / texel;
    stampPit(field, x, y, Math.max(r, 0.45), Math.min(0.004, rMm / 1000 * 0.9), 0.32 + rBug() * 0.25);
  }
  // Fine pores: tiny pits, sub-millimetre to a millimetre, denser in some
  // areas than others.
  const nPore = Math.floor(area * 2600);
  for (let k = 0; k < nPore; k++) {
    const x = rBug() * S, y = rBug() * S;
    const c = clusterField[Math.floor((y / S) * 256) * 256 + Math.floor((x / S) * 256)];
    if (rBug() > 0.45 + c * 0.8) continue;
    const r = 0.35 + rBug() * 0.5;
    stampPit(field, x, y, r, 0.0003 + rBug() * 0.0005, 0.08 + rBug() * 0.12);
  }

  console.log('  wall: composing');
  const R = new Float32Array(N), G = new Float32Array(N), B = new Float32Array(N);
  const rough = new Float32Array(N);
  // warm grey base in linear light (~ sRGB 152,146,137)
  const base = [0.314, 0.292, 0.258];
  for (let y = 0; y < S; y++) {
    const ym = D.originY + (1 - (y + 0.5) / S) * D.height;
    // slightly darker and warmer in the bottom 40 cm (splash, dust)
    const foot = 1 - 0.06 * (1 - smooth(0.0, 0.45, ym));
    for (let x = 0; x < S; x++) {
      const i = y * S + x;
      const xm = D.originX + ((x + 0.5) / S) * D.width;
      const pi = panelIndex(xm);
      const tone =
        panelTone[pi] *
        (1 + cloudLarge[i] * 0.1 + cloudMid[i] * 0.09 + cloudFine[i] * 0.055 + blotchS[i] * 0.08 +
          grain[i] * 0.035 + grainSharp[i] * 0.014 + streakSmooth[i] * 0.035) *
        (1 - jointMask[i] * 0.08) *
        (1 - bleed[i] * 0.07) *
        (1 - tieMask[i] * 0.05) *
        shade[i] *
        foot;
      const warm = panelWarm[pi] + cloudMid[i] * 0.015 + cloudLarge[i] * 0.012 + blotchWarm[i] * 0.012;
      R[i] = base[0] * tone * (1 + warm);
      G[i] = base[1] * tone;
      B[i] = base[2] * tone * (1 - warm * 1.4);
      // a touch smoother where the paste is dense (darker blotches), rougher in pores
      rough[i] = clamp(0.84 + cloudMid[i] * 0.05 + blotchS[i] * 0.04 + grain[i] * 0.03 + bleed[i] * 0.06 + (1 - shade[i]) * 0.3, 0.6, 1.0);
      // surface relief: soft waviness plus sand grain
      height[i] += cloudMid[i] * 0.0004 + cloudFine[i] * 0.00018 + grain[i] * 0.00016 + grainSharp[i] * 0.00004;
    }
  }

  console.log('  wall: writing');
  await writeAlbedo(path.join(OUT_DIR, 'wall_albedo.jpg'), S, R, G, B);
  await writeGrey(path.join(OUT_DIR, 'wall_roughness.png'), S, rough);
  await writeNormal(path.join(OUT_DIR, 'wall_normal.png'), S, height, texel);
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
  // Domain-warped clouds give the soft, swirly burnish marks of polished concrete.
  const warpA = fbm(S, 6, 3, 0.5, 1101);
  const warpB = fbm(S, 6, 3, 0.5, 1102);
  const cloudSrc = fbm(1024, 10, 5, 0.55, 1103);
  const cloud = new Float32Array(N);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const i = y * S + x;
      const u = ((x / S + warpA[i] * 0.06) % 1 + 1) % 1;
      const v = ((y / S + warpB[i] * 0.06) % 1 + 1) % 1;
      cloud[i] = cloudSrc[Math.floor(v * 1024) * 1024 + Math.floor(u * 1024)];
    }
  }
  const cloudS = boxBlur(cloud, S, 3);
  const large = fbm(S, 3, 3, 0.5, 1104);
  const fine = fbm(S, 200, 3, 0.5, 1105);
  const grain = whiteNoise(S, 1106);
  const grainSoft = boxBlur(whiteNoise(S, 1107), S, 1);
  const wipe = fbm(S, 14, 4, 0.5, 1108); // roughness variation (wear, wipe marks)

  const height = new Float32Array(N);
  const shade = new Float32Array(N).fill(1);
  const field = { size: S, height, shade };

  // Fine aggregate specks ("salt and pepper") exposed by polishing.
  console.log('  floor: aggregate, joints, cracks');
  const r = rng(1201);
  const area = D.width * D.height;
  const speck = new Float32Array(N); // -1 dark .. +1 light
  const nSpeck = Math.floor(area * 9000);
  for (let k = 0; k < nSpeck; k++) {
    const cx = r() * S, cy = r() * S;
    const rad = 0.5 + Math.pow(r(), 2.5) * 1.6; // 1-5 mm specks
    const val = r() < 0.55 ? -(0.35 + r() * 0.5) : 0.3 + r() * 0.6;
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
  }
  // A few small pits (air voids opened by grinding).
  for (let k = 0; k < Math.floor(area * 120); k++) {
    stampPit(field, r() * S, r() * S, 0.5 + Math.pow(r(), 3) * 1.8, 0.0008, 0.45);
  }

  // Saw-cut joints (3-4 mm, filled with a darker sealant) and hairline cracks.
  const joint = new Float32Array(N);
  const sawZ = [2.95];
  const sawX = [-2.75, 3.35];
  for (const z of sawZ) drawLine(joint, S, 0, pz(z), S, pz(z) + 1.5, 0.0035 / texel, 1);
  for (const x of sawX) drawLine(joint, S, px(x), 0, px(x) - 1.0, S, 0.0035 / texel, 1);
  const crack = new Float32Array(N);
  const rc = rng(1301);
  // cracks that start at joints or near the wall and wander a little
  drawCrack(crack, S, rc, px(-2.75), pz(0.9), 0.15, 160, 3.5, 0.9);
  drawCrack(crack, S, rc, px(1.2), pz(2.95), -1.9, 110, 3.5, 0.8);
  drawCrack(crack, S, rc, px(-0.6), pz(0.05), -1.45, 70, 3.2, 0.7);
  drawCrack(crack, S, rc, px(3.35), pz(1.6), 3.0, 120, 3.5, 0.8);
  const crackS = boxBlur(crack, S, 1);

  // Scuffs and polishing-pad swirls: faint curved bands where the surface is
  // a little duller and lighter, so reflections break up the way they do on
  // a floor that is walked on.
  const scuff = new Float32Array(N);
  {
    const rs = rng(1401);
    const nScuff = Math.floor(D.width * D.height * 1.6);
    for (let k = 0; k < nScuff; k++) {
      const cx = rs() * S, cy = rs() * S;
      const rad = (0.15 + rs() * 0.6) / texel;
      const a0 = rs() * Math.PI * 2, span = 0.3 + rs() * 0.9;
      const width = (0.01 + rs() * 0.05) / texel;
      const strength = 0.3 + rs() * 0.7;
      const steps = Math.ceil((rad * span) / 2);
      for (let t = 0; t <= steps; t++) {
        const a = a0 + (span * t) / steps;
        const along = Math.min(t / steps, 1 - t / steps) * 2;
        const w = width * smooth(0, 0.4, along);
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
  const scuffS = boxBlur(scuff, S, 2);

  console.log('  floor: composing');
  const R = new Float32Array(N), G = new Float32Array(N), B = new Float32Array(N);
  const rough = new Float32Array(N);
  const base = [0.118, 0.110, 0.100]; // ~ sRGB 96,92,88 : darker than the wall
  for (let i = 0; i < N; i++) {
    const tone =
      (1 + large[i] * 0.09 + cloudS[i] * 0.19 + fine[i] * 0.045 + grainSoft[i] * 0.05 + grain[i] * 0.025 + speck[i] * 0.22 + scuffS[i] * 0.05) *
      (1 - joint[i] * 0.45) *
      (1 - crackS[i] * 0.25) *
      shade[i];
    const warm = cloudS[i] * 0.02 + large[i] * 0.015;
    R[i] = base[0] * tone * (1 + warm);
    G[i] = base[1] * tone;
    B[i] = base[2] * tone * (1 - warm * 1.2);
    // polished: low roughness, broken up by wear and wipe marks
    rough[i] = clamp(
      0.3 + wipe[i] * 0.14 + large[i] * 0.06 + fine[i] * 0.03 + Math.abs(speck[i]) * 0.04 + scuffS[i] * 0.16 + joint[i] * 0.4 + crackS[i] * 0.2 + (1 - shade[i]) * 0.4,
      0.12,
      0.95,
    );
    height[i] += large[i] * 0.0012 + cloudS[i] * 0.00008 + fine[i] * 0.00003 - joint[i] * 0.002 - crackS[i] * 0.0003;
  }

  console.log('  floor: writing');
  await writeAlbedo(path.join(OUT_DIR, 'floor_albedo.jpg'), S, R, G, B);
  await writeGrey(path.join(OUT_DIR, 'floor_roughness.png'), S, rough);
  await writeNormal(path.join(OUT_DIR, 'floor_normal.png'), S, height, texel);
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
  const cloudLarge = fbm(S, 4, 4, 0.5, 2101);
  const cloudMid = fbm(S, 20, 4, 0.5, 2102);
  const grain = boxBlur(whiteNoise(S, 2103), S, 1);

  // Trowel strokes: overlapping curved bands, each a touch lighter or darker
  // and a touch smoother or rougher, with a faint ridge at their edge.
  console.log('  plaster: trowel strokes');
  const strokeTone = new Float32Array(N);
  const strokeRough = new Float32Array(N);
  const height = new Float32Array(N);
  const r = rng(2201);
  const nStrokes = 2200;
  for (let k = 0; k < nStrokes; k++) {
    const cx = r() * S, cy = r() * S; // arc centre
    const rad = (0.12 + r() * 0.35) / texel; // arc radius
    const a0 = r() * Math.PI * 2;
    const span = 0.5 + r() * 1.1; // radians
    const width = (0.035 + r() * 0.07) / texel;
    const tone = (r() - 0.5) * 0.06;
    const rgh = (r() - 0.6) * 0.12;
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
        const body = (1 - smooth(0.55, 1.0, off)) * endFade;
        const edge = Math.exp(-Math.pow((off - 1.0) / 0.08, 2)) * endFade;
        const xx = ((x % S) + S) % S;
        const i = yy * S + xx;
        strokeTone[i] = strokeTone[i] * (1 - body * 0.7) + tone * body;
        strokeRough[i] = strokeRough[i] * (1 - body * 0.7) + rgh * body;
        height[i] += edge * 0.00008 - body * 0.00002;
      }
    }
  }

  // A few pinholes (air bubbles opened by the trowel), sparse and tiny.
  const shade = new Float32Array(N).fill(1);
  {
    const rp = rng(2301);
    const field = { size: S, height, shade };
    const nPin = Math.floor(D.width * D.height * 260);
    for (let k = 0; k < nPin; k++) {
      stampPit(field, rp() * S, rp() * S, 0.4 + Math.pow(rp(), 2) * 1.2, 0.00025, 0.12 + rp() * 0.15);
    }
  }

  console.log('  plaster: composing');
  const R = new Float32Array(N), G = new Float32Array(N), B = new Float32Array(N);
  const rough = new Float32Array(N);
  // warm cream microcement, ~ sRGB 206,193,172: clearly lighter than the
  // concrete but not white
  const base = [0.617, 0.533, 0.413];
  for (let i = 0; i < N; i++) {
    const tone = (1 + cloudLarge[i] * 0.04 + cloudMid[i] * 0.035 + strokeTone[i] + grain[i] * 0.014) * shade[i];
    const warm = cloudLarge[i] * 0.012 + cloudMid[i] * 0.008;
    R[i] = base[0] * tone * (1 + warm);
    G[i] = base[1] * tone;
    B[i] = base[2] * tone * (1 - warm * 1.5);
    rough[i] = clamp(0.72 + strokeRough[i] + cloudMid[i] * 0.05 + grain[i] * 0.03 + (1 - shade[i]) * 0.3, 0.5, 0.95);
    height[i] += cloudMid[i] * 0.00006 + grain[i] * 0.000012;
  }

  console.log('  plaster: writing');
  await writeAlbedo(path.join(OUT_DIR, 'plaster_albedo.jpg'), S, R, G, B);
  await writeGrey(path.join(OUT_DIR, 'plaster_roughness.png'), S, rough);
  await writeNormal(path.join(OUT_DIR, 'plaster_normal.png'), S, height, texel);
}

// ---------------------------------------------------------------------------

const FILES = ['wall', 'floor', 'plaster'].flatMap((m) => [`${m}_albedo.jpg`, `${m}_roughness.png`, `${m}_normal.png`]);

function texturesExist() {
  return FILES.every((f) => fs.existsSync(path.join(OUT_DIR, f))) && fs.existsSync(path.join(OUT_DIR, 'manifest.json'));
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
  fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify({ size: SIZE, domains: DOMAINS }, null, 2));
  console.log(`textures: done in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
}

module.exports = { generateTextures, DOMAINS, SIZE };

if (require.main === module) {
  generateTextures({ force: process.argv.includes('--force') }).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

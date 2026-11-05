#!/usr/bin/env node
/**
 * Mist for the statement inside the hero circle: soft wisps of pale ink-grey smoke (WebP with alpha).
 *
 *   node scripts/media/mist.cjs
 *   node scripts/media/mist.cjs --preview <dir>    also writes <dir>/mist-preview.jpg
 *
 * Made the way ink spreads in still water: a patch of density is carried through a slow, swirling,
 * incompressible flow (the curl of a seeded noise stream function, a gentle shear, a few soft
 * eddies). Every pixel is traced back through the flow to where its air started and takes the
 * density found there, so the patch is drawn out into long thin strands whose ends curl round the
 * eddies. The strands are then softened at three widths (strand, feather, haze) so no edge is hard.
 * The colour is one flat cool grey; the alpha carries the shape, peaking at 0.55, and fades to
 * nothing well inside the border. Drawn from fixed seeds, so it comes out the same every time.
 * It depicts no real place or thing: nothing here is a photograph, a traced texture or a
 * generated picture.
 *
 *   public/images/brand/mist-wisp-1.webp   1024x512  a band of strands, fuller, curling mid-way
 *   public/images/brand/mist-wisp-2.webp   1024x512  a longer, sparer band, curling up at its right end
 *   public/images/brand/mist-bloom.webp     768x768  a thin cloud with a few curling tendrils
 *
 * The preview sets each texture on white at full strength, then at 45% over a white circle with a
 * line of dark type, to judge whether it reads as mist rather than dirt.
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const out = path.resolve(__dirname, "../../public/images/brand");
const previewAt = process.argv.indexOf("--preview");
const previewDir = previewAt > 0 ? process.argv[previewAt + 1] : null;
// Diluted ink: a cool grey a touch bluer than the brand's mouse grey.
const MIST = [150, 154, 160];
// Supersampling of the flow trace; stretched strands alias into dotted lines at 1.
const SS = 2;

function makeRandom(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// Seeded 3D simplex noise (after Gustavson), about -1..1. The third axis is used for time.
function makeNoise(seed) {
  const rand = makeRandom(seed);
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const t = p[i];
    p[i] = p[j];
    p[j] = t;
  }
  const perm = new Uint8Array(512);
  const perm12 = new Uint8Array(512);
  for (let i = 0; i < 512; i++) {
    perm[i] = p[i & 255];
    perm12[i] = perm[i] % 12;
  }
  const g = [1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0, 1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, -1, 0, 1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1];
  const F3 = 1 / 3;
  const G3 = 1 / 6;
  const corner = (q, x, y, z) => {
    let c = 0.6 - x * x - y * y - z * z;
    if (c <= 0) return 0;
    c *= c;
    return c * c * (g[q] * x + g[q + 1] * y + g[q + 2] * z);
  };
  return (x, y, z) => {
    const s = (x + y + z) * F3;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);
    const k = Math.floor(z + s);
    const t = (i + j + k) * G3;
    const x0 = x - (i - t);
    const y0 = y - (j - t);
    const z0 = z - (k - t);
    let i1, j1, k1, i2, j2, k2;
    if (x0 >= y0) {
      if (y0 >= z0) [i1, j1, k1, i2, j2, k2] = [1, 0, 0, 1, 1, 0];
      else if (x0 >= z0) [i1, j1, k1, i2, j2, k2] = [1, 0, 0, 1, 0, 1];
      else [i1, j1, k1, i2, j2, k2] = [0, 0, 1, 1, 0, 1];
    } else if (y0 < z0) [i1, j1, k1, i2, j2, k2] = [0, 0, 1, 0, 1, 1];
    else if (x0 < z0) [i1, j1, k1, i2, j2, k2] = [0, 1, 0, 0, 1, 1];
    else [i1, j1, k1, i2, j2, k2] = [0, 1, 0, 1, 1, 0];
    const ii = i & 255;
    const jj = j & 255;
    const kk = k & 255;
    return (
      32 *
      (corner(perm12[ii + perm[jj + perm[kk]]] * 3, x0, y0, z0) +
        corner(perm12[ii + i1 + perm[jj + j1 + perm[kk + k1]]] * 3, x0 - i1 + G3, y0 - j1 + G3, z0 - k1 + G3) +
        corner(perm12[ii + i2 + perm[jj + j2 + perm[kk + k2]]] * 3, x0 - i2 + 2 * G3, y0 - j2 + 2 * G3, z0 - k2 + 2 * G3) +
        corner(perm12[ii + 1 + perm[jj + 1 + perm[kk + 1]]] * 3, x0 - 1 + 3 * G3, y0 - 1 + 3 * G3, z0 - 1 + 3 * G3))
    );
  };
}

function fbm(noise, x, y, z, octaves) {
  let sum = 0;
  let amp = 1;
  let norm = 0;
  let f = 1;
  for (let o = 0; o < octaves; o++) {
    sum += amp * noise(x * f, y * f, z + o * 17.3);
    norm += amp;
    amp *= 0.5;
    f *= 2.03;
  }
  return sum / norm;
}

const smoothstep = (a, b, v) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// Gaussian blur as three box passes each way, in float so soft gradients keep their precision.
// Outside the image counts as empty.
function blur(src, w, h, sigma) {
  const r = Math.max(1, Math.round(Math.sqrt(4 * sigma * sigma + 1) / 2 - 0.5));
  let a = Float32Array.from(src);
  let b = new Float32Array(src.length);
  const pass = (from, to, len, count, stride, step) => {
    for (let line = 0; line < count; line++) {
      const base = line * stride;
      let acc = 0;
      for (let k = 0; k < r && k < len; k++) acc += from[base + k * step];
      for (let k = 0; k < len; k++) {
        if (k + r < len) acc += from[base + (k + r) * step];
        if (k - r - 1 >= 0) acc -= from[base + (k - r - 1) * step];
        to[base + k * step] = acc / (2 * r + 1);
      }
    }
  };
  for (let n = 0; n < 3; n++) {
    pass(a, b, w, h, w, 1);
    [a, b] = [b, a];
    pass(a, b, h, w, 1, w);
    [a, b] = [b, a];
  }
  return a;
}

// A soft eddy: a gaussian bump in the stream function spins the air around it, fastest at one
// sigma out. `turns` is how far its core turns over the whole run.
function eddy(x, y, sigma, turns) {
  return { x, y, s2: 2 * sigma * sigma, g: turns * 2 * Math.PI * sigma * sigma };
}
function eddyStream(eddies, x, y) {
  let v = 0;
  for (const e of eddies) {
    const dx = x - e.x;
    const dy = y - e.y;
    const r2 = dx * dx + dy * dy;
    if (r2 < 9 * e.s2) v += e.g * Math.exp(-r2 / e.s2);
  }
  return v;
}

/**
 * Trace every (supersampled) pixel back through the flow, from the end of the run (t = 1) to its
 * start, and read the starting density there. The velocity is the curl of spec.stream, sampled on
 * a coarse grid each step and interpolated, plus spec.drift(y, t) along x (a shear, which keeps
 * the flow incompressible). Returns the density on the output grid.
 */
function advect(spec) {
  const { W, H, steps } = spec;
  const margin = 300;
  const cell = 4;
  const gw = Math.ceil((W + 2 * margin) / cell) + 1;
  const gh = Math.ceil((H + 2 * margin) / cell) + 1;
  const psi = new Float32Array(gw * gh);
  const vx = new Float32Array(gw * gh);
  const vy = new Float32Array(gw * gh);
  const sw = W * SS;
  const sh = H * SS;
  const px = new Float32Array(sw * sh);
  const py = new Float32Array(sw * sh);
  for (let y = 0; y < sh; y++)
    for (let x = 0; x < sw; x++) {
      px[y * sw + x] = (x + 0.5) / SS;
      py[y * sw + x] = (y + 0.5) / SS;
    }
  const dt = 1 / steps;
  for (let k = steps - 1; k >= 0; k--) {
    const t = (k + 0.5) * dt;
    for (let j = 0; j < gh; j++)
      for (let i = 0; i < gw; i++) psi[j * gw + i] = spec.stream(i * cell - margin, j * cell - margin, t);
    for (let j = 0; j < gh; j++) {
      const jm = Math.max(0, j - 1);
      const jp = Math.min(gh - 1, j + 1);
      const drift = spec.drift(j * cell - margin, t);
      for (let i = 0; i < gw; i++) {
        const im = Math.max(0, i - 1);
        const ip = Math.min(gw - 1, i + 1);
        vx[j * gw + i] = (psi[jp * gw + i] - psi[jm * gw + i]) / ((jp - jm) * cell) + drift;
        vy[j * gw + i] = -(psi[j * gw + ip] - psi[j * gw + im]) / ((ip - im) * cell);
      }
    }
    for (let n = 0; n < px.length; n++) {
      const gx = Math.min(gw - 1.001, Math.max(0, (px[n] + margin) / cell));
      const gy = Math.min(gh - 1.001, Math.max(0, (py[n] + margin) / cell));
      const i = gx | 0;
      const j = gy | 0;
      const fx = gx - i;
      const fy = gy - j;
      const o = j * gw + i;
      const ux = (vx[o] * (1 - fx) + vx[o + 1] * fx) * (1 - fy) + (vx[o + gw] * (1 - fx) + vx[o + gw + 1] * fx) * fy;
      const uy = (vy[o] * (1 - fx) + vy[o + 1] * fx) * (1 - fy) + (vy[o + gw] * (1 - fx) + vy[o + gw + 1] * fx) * fy;
      px[n] -= ux * dt;
      py[n] -= uy * dt;
    }
  }
  const d = new Float32Array(W * H);
  for (let y = 0; y < sh; y++)
    for (let x = 0; x < sw; x++) {
      const n = y * sw + x;
      d[((y / SS) | 0) * W + ((x / SS) | 0)] += spec.source(px[n], py[n]) / (SS * SS);
    }
  return d;
}

// Soften at three widths, add any veil, ease the densest parts over (1 - e^-kx) so strands never
// turn into flat dark stains, and fade out with the mask. Returns RGBA.
function finish(spec, d) {
  const { W, H, mix } = spec;
  const layers = mix.map(([sigma, weight]) => [blur(d, W, H, sigma), weight]);
  const v = new Float32Array(W * H);
  for (const [layer, weight] of layers) for (let n = 0; n < v.length; n++) v[n] += weight * layer[n];
  const sorted = Float32Array.from(v).sort();
  const ref = sorted[Math.floor(sorted.length * 0.9995)] || 1;
  const top = 1 - Math.exp(-spec.gain);
  const peak = 0.55;
  const px = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const n = y * W + x;
      const u = v[n] / ref + (spec.veil ? spec.veil(x + 0.5, y + 0.5) : 0);
      const a = Math.min(peak, (peak * (1 - Math.exp(-spec.gain * u))) / top) * spec.mask(x + 0.5, y + 0.5);
      px[n * 4] = MIST[0];
      px[n * 4 + 1] = MIST[1];
      px[n * 4 + 2] = MIST[2];
      px[n * 4 + 3] = Math.round(255 * a);
    }
  return px;
}

// A horizontal band of strands, densest along the middle third.
function wisp(seed, o) {
  const W = 1024;
  const H = 512;
  const noise = makeNoise(seed);
  const flow = makeNoise(seed + 101);
  const rand = makeRandom(seed * 7919);
  const eddies = [];
  for (let i = 0; i < o.eddies; i++) {
    const sigma = 22 + rand() * 34;
    const turns = (0.6 + rand() * 0.9) * (rand() < 0.5 ? -1 : 1) * o.turns;
    eddies.push(eddy(W * (0.22 + (0.56 * (i + rand())) / o.eddies), H / 2 + (rand() - 0.5) * H * 0.18, sigma, turns));
  }
  return {
    W,
    H,
    steps: 80,
    stream(x, y, t) {
      // Wide, flat swirls (longer than tall, so the band stays a band), smaller ones on top, both
      // calmer in some stretches of air than others.
      const calm = 0.4 + 0.6 * smoothstep(-0.4, 0.5, flow(x / 420, y / 420, 9.1));
      const wide = flow(x / 480, y / 170, t * 1.2) * 170;
      const small = flow(x / 90, y / 90, 4 + t * 1.92) * 90;
      return calm * (95 * wide + 25 * small) + eddyStream(eddies, x, y);
    },
    drift: (y, t) => 520 * flow(3.3, y / 120, 1.7 + t * 0.3),
    source(x, y) {
      const band = Math.exp(-(((y - H / 2) / (H * 0.1)) ** 2));
      const ends = smoothstep(0.06 * W, 0.32 * W, x) * smoothstep(0.06 * W, 0.32 * W, W - x);
      const patch = smoothstep(o.patch, o.patch + 1, fbm(noise, x / o.px, y / o.py, 0.5, 4)) ** o.pw;
      const grain = 0.5 + 0.25 * (1 + fbm(noise, x / 30, y / 14, 7.7, 3));
      return band * ends * patch * grain;
    },
    mask: (x, y) =>
      smoothstep(0.02 * W, 0.22 * W, x) * smoothstep(0.02 * W, 0.22 * W, W - x) * smoothstep(0.03 * H, 0.3 * H, y) * smoothstep(0.03 * H, 0.3 * H, H - y),
    mix: [
      [1.6, 0.45],
      [6, 0.45],
      [22, 0.4],
    ],
    gain: o.gain,
  };
}

// A thin, irregular cloud with a few tendrils curling off it.
function bloom(seed, o) {
  const W = 768;
  const H = 768;
  const cx = W / 2;
  const cy = H / 2;
  const noise = makeNoise(seed);
  const flow = makeNoise(seed + 101);
  const rand = makeRandom(seed * 7919);
  const eddies = [];
  for (let i = 0; i < o.eddies; i++) {
    const angle = ((i + rand() * 0.6) / o.eddies) * 2 * Math.PI;
    const r = W * (0.2 + rand() * 0.08);
    const sigma = 24 + rand() * 30;
    const turns = (0.6 + rand() * 0.8) * (rand() < 0.5 ? -1 : 1) * o.turns;
    eddies.push(eddy(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r, sigma, turns));
  }
  // Distance from the centre through a warped lens, stretched by o.wide (the statement it covers
  // is wider than tall): an irregular, billowing outline with no radial streaks.
  const reach = (x, y, amp, scale, z) => {
    const wx = x + amp * fbm(noise, x / scale, y / scale, z, 3);
    const wy = y + amp * fbm(noise, x / scale + 31.7, y / scale - 12.9, z, 3);
    return Math.hypot((wx - cx) / o.wide, (wy - cy) * o.wide) / W;
  };
  return {
    W,
    H,
    steps: 70,
    stream: (x, y, t) => 70 * flow(x / 260, y / 260, t * 0.8) * 260 + 15 * flow(x / 80, y / 80, 5 + t * 1.28) * 80 + eddyStream(eddies, x, y),
    // A light sideways shear, so the tendrils trail out left and right rather than hang down.
    drift: (y, t) => o.shear * flow(7.7, y / 140, 3.4 + t * 0.3),
    source(x, y) {
      const body = 1 - smoothstep(0.27 * 0.3, 0.27, reach(x, y, 100, 230, 3.1));
      const patch = smoothstep(-0.15, 0.85, fbm(noise, x / 150, y / 150, 0.5, 4)) ** 1.6;
      const grain = 0.5 + 0.25 * (1 + fbm(noise, x / 26, y / 26, 7.7, 3));
      return body * patch * grain;
    },
    // The thin haze the tendrils sit in.
    veil(x, y) {
      const body = 1 - smoothstep(0.02, 0.38, reach(x, y, 150, 260, 6.2));
      return 0.2 * body * body * (0.775 + 0.225 * fbm(flow, x / 220, y / 220, 2.2, 4));
    },
    mask: (x, y) => 1 - smoothstep(0.3, 0.48, Math.hypot(x - cx, y - cy) / W),
    mix: [
      [2.2, 0.35],
      [7, 0.45],
      [30, 0.35],
    ],
    gain: 2.4,
  };
}

const textures = [
  ["mist-wisp-1.webp", () => wisp(5821, { eddies: 4, turns: 1, patch: -0.1, pw: 1.4, px: 260, py: 65, gain: 2.6 })],
  ["mist-wisp-2.webp", () => wisp(6650, { eddies: 3, turns: 1.1, patch: -0.1, pw: 1.5, px: 240, py: 48, gain: 2.6 })],
  ["mist-bloom.webp", () => bloom(5791, { eddies: 3, turns: 1.2, wide: 1.3, shear: 160 })],
];

async function preview(dir) {
  const read = (name) => sharp(path.join(out, name)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const tile = async (name, width, height, opacity) => {
    const { data, info } = await read(name);
    if (opacity < 1) for (let i = 3; i < data.length; i += 4) data[i] = Math.round(data[i] * opacity);
    return sharp(data, { raw: info }).resize(width, height).png().toBuffer();
  };
  const gap = 5;
  const rowA = 276;
  const cellB = 460;
  const W = 1400;
  const H = gap + rowA + gap + cellB + gap;
  const comps = [];
  // Row 1: each texture on white at full strength.
  let x = gap;
  for (const [name, w] of [
    ["mist-wisp-1.webp", 552],
    ["mist-wisp-2.webp", 552],
    ["mist-bloom.webp", 276],
  ]) {
    comps.push({ input: { create: { width: w, height: rowA, channels: 3, background: "#fff" } }, left: x, top: gap });
    comps.push({ input: await tile(name, w, rowA, 1), left: x, top: gap });
    x += w + gap;
  }
  // Row 2: at 45% over the white circle and its statement, as it will sit in the hero.
  const r = 214;
  const circle = `<svg xmlns="http://www.w3.org/2000/svg" width="${cellB}" height="${cellB}">
    <rect width="100%" height="100%" fill="#a7a6a2"/>
    <circle cx="${cellB / 2}" cy="${cellB / 2}" r="${r}" fill="#fff"/>
    <g font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="42" font-weight="500" fill="#141414" text-anchor="middle" letter-spacing="-0.5">
      <text x="${cellB / 2}" y="${cellB / 2 - 6}">Tell us how you</text>
      <text x="${cellB / 2}" y="${cellB / 2 + 44}">want to live</text>
    </g>
  </svg>`;
  const placements = [
    ["mist-wisp-1.webp", 440, 220],
    ["mist-wisp-2.webp", 440, 220],
    ["mist-bloom.webp", 400, 400],
  ];
  for (const [i, [name, w, h]] of placements.entries()) {
    const left = gap + i * (cellB + gap);
    const top = gap + rowA + gap;
    comps.push({ input: Buffer.from(circle), left, top });
    comps.push({ input: await tile(name, w, h, 0.45), left: left + (cellB - w) / 2, top: top + (cellB - h) / 2 + 10 });
  }
  fs.mkdirSync(dir, { recursive: true });
  await sharp({ create: { width: W, height: H, channels: 3, background: "#dcdcd9" } })
    .composite(comps)
    .jpeg({ quality: 90 })
    .toFile(path.join(dir, "mist-preview.jpg"));
  console.log("preview", path.join(dir, "mist-preview.jpg"));
}

(async () => {
  fs.mkdirSync(out, { recursive: true });
  for (const [name, make] of textures) {
    const spec = make();
    const info = await sharp(finish(spec, advect(spec)), { raw: { width: spec.W, height: spec.H, channels: 4 } })
      // Lossless alpha: a soft gradient quantised by lossy alpha shows as contour bands.
      .webp({ quality: 80, alphaQuality: 100, effort: 6 })
      .toFile(path.join(out, name));
    console.log(name, `${spec.W}x${spec.H}`, `${(info.size / 1024).toFixed(1)} KB`);
  }
  if (previewDir) await preview(previewDir);
})();

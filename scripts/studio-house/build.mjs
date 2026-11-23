#!/usr/bin/env node
/**
 * Studio exploded house: converts the client's exploded-house drawing (a PDF holding one traced,
 * even-odd filled path) into layered SVG artwork for the home page's Studio section.
 *
 *   node scripts/studio-house/build.mjs <drawing.pdf> [--out <dir>] [--tolerance <units>]
 *
 * The PDF is read from wherever it is given; it never belongs in the repo. Output goes to
 * public/images/studio/ unless --out says otherwise. Node built-ins only. See README.md.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

// ---------------------------------------------------------------------------------------------
// Settings. Units are pixels of the traced drawing (one grid step of the trace, 0.754 pt).

/** Douglas-Peucker tolerance, well under one grid step: a staircase becomes the straight line it
 *  stands for, while corners and real detail stay. */
const DEFAULT_TOLERANCE = 0.35;
/** Rings with at most this many grid steps round them (dots, dash ends) are kept exactly. */
const SMALL_RING_STEPS = 16;
/** Empty border kept around the drawing inside the shared viewBox. */
const MARGIN = 4;
/** The dashed guides: the six columns they drop down, as x in drawing pixels. */
const GUIDE_COLUMNS = [111, 267, 414, 561, 608, 800];
const LINE_COLOR = "#f3f3f3"; // Milky White (kapur)
const SOLID_COLOR = "#404732"; // studio green (rikyu-deep)

// ---------------------------------------------------------------------------------------------
// PDF reading: the page's content stream, with ASCII85 and Flate filters.

function readPdfPage(file) {
  const pdf = fs.readFileSync(file).toString("latin1");
  const objects = new Map(); // later definitions (incremental updates) win
  const re = /(\d+)\s+(\d+)\s+obj\b/g;
  let m;
  while ((m = re.exec(pdf))) objects.set(Number(m[1]), m.index + m[0].length);

  const dictOf = (start) => {
    // the object's top-level dictionary, nesting aware
    const open = pdf.indexOf("<<", start);
    let depth = 0;
    for (let i = open; i < pdf.length - 1; i++) {
      if (pdf[i] === "<" && pdf[i + 1] === "<") {
        depth++;
        i++;
      } else if (pdf[i] === ">" && pdf[i + 1] === ">") {
        depth--;
        i++;
        if (depth === 0) return { text: pdf.slice(open, i + 1), end: i + 1 };
      }
    }
    throw new Error("Unterminated dictionary");
  };
  const resolveNumber = (value) => {
    const ref = value.match(/^(\d+)\s+\d+\s+R$/);
    if (!ref) return Number(value);
    const start = objects.get(Number(ref[1]));
    return Number(pdf.slice(start, pdf.indexOf("endobj", start)).trim());
  };

  let page = null;
  for (const [, start] of objects) {
    const head = pdf.slice(start, start + 20).trim();
    if (!head.startsWith("<<")) continue;
    const { text } = dictOf(start);
    if (/\/MediaBox/.test(text) && /\/Contents/.test(text)) {
      page = text;
      break;
    }
  }
  if (!page) throw new Error("No page with /MediaBox and /Contents found");
  const mediaBox = page.match(/\/MediaBox\s*\[([^\]]+)\]/)[1].trim().split(/\s+/).map(Number);
  const contentsField = page.match(/\/Contents\s*(\[[^\]]*\]|\d+\s+\d+\s+R)/)[1];
  const refs = [...contentsField.matchAll(/(\d+)\s+\d+\s+R/g)].map((r) => Number(r[1]));

  let content = "";
  for (const ref of refs) {
    const start = objects.get(ref);
    const { text, end } = dictOf(start);
    const length = resolveNumber(text.match(/\/Length\s+(\d+\s+\d+\s+R|\d+)/)[1]);
    let dataStart = pdf.indexOf("stream", end) + "stream".length;
    if (pdf[dataStart] === "\r") dataStart++;
    if (pdf[dataStart] === "\n") dataStart++;
    let data = Buffer.from(pdf.slice(dataStart, dataStart + length), "latin1");
    const filterField = (text.match(/\/Filter\s*(\[[^\]]*\]|\/\w+)/) || [, ""])[1];
    for (const filter of filterField.match(/\/\w+/g) || []) {
      if (filter === "/ASCII85Decode" || filter === "/A85") data = ascii85(data.toString("latin1"));
      else if (filter === "/FlateDecode" || filter === "/Fl") data = zlib.inflateSync(data);
      else throw new Error(`Unsupported filter ${filter}`);
    }
    content += data.toString("latin1") + "\n";
  }
  return { mediaBox, content };
}

function ascii85(text) {
  let a = text.trim();
  if (a.startsWith("<~")) a = a.slice(2);
  a = a.replace(/~>[\s\S]*$/, "").replace(/\s+/g, "");
  const out = [];
  for (let i = 0; i < a.length; ) {
    if (a[i] === "z") {
      out.push(0, 0, 0, 0);
      i++;
      continue;
    }
    const chunk = a.slice(i, i + 5);
    i += 5;
    const pad = 5 - chunk.length;
    let v = 0;
    for (const ch of chunk + "u".repeat(pad)) v = v * 85 + (ch.charCodeAt(0) - 33);
    out.push(...[(v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255].slice(0, 4 - pad));
  }
  return Buffer.from(out);
}

// ---------------------------------------------------------------------------------------------
// Content stream: fills of straight-line paths (m, l, re, h), with colour and the CTM.

function readFills(content) {
  const text = content.replace(/BT[\s\S]*?ET/g, " "); // no text matters here
  const fills = [];
  const stack = [];
  let ctm = [1, 0, 0, 1, 0, 0];
  let color = [0, 0, 0];
  let subpaths = [];
  let current = null;
  let operands = [];
  const apply = (x, y) => [ctm[0] * x + ctm[2] * y + ctm[4], ctm[1] * x + ctm[3] * y + ctm[5]];
  for (const token of text.split(/\s+/)) {
    if (!token) continue;
    if (/^[-+]?(\d+\.?\d*|\.\d+)$/.test(token)) {
      operands.push(Number(token));
      continue;
    }
    const o = operands;
    switch (token) {
      case "q":
        stack.push(ctm);
        break;
      case "Q":
        ctm = stack.pop();
        break;
      case "cm": {
        const [a, b, c, d, e, f] = o;
        const [A, B, C, D, E, F] = ctm;
        ctm = [a * A + b * C, a * B + b * D, c * A + d * C, c * B + d * D, e * A + f * C + E, e * B + f * D + F];
        break;
      }
      case "rg":
        color = o.slice(0, 3);
        break;
      case "g":
        color = [o[0], o[0], o[0]];
        break;
      case "m":
        current = [apply(o[0], o[1])];
        subpaths.push(current);
        break;
      case "l":
        current.push(apply(o[0], o[1]));
        break;
      case "re": {
        const [x, y, w, h] = o;
        current = [apply(x, y), apply(x + w, y), apply(x + w, y + h), apply(x, y + h)];
        subpaths.push(current);
        break;
      }
      case "h":
        break;
      case "c":
      case "v":
      case "y":
        throw new Error("Curves are not expected in this drawing");
      case "f":
      case "F":
      case "f*":
        fills.push({ color, evenOdd: token === "f*", subpaths });
        subpaths = [];
        break;
      case "n":
      case "S":
        subpaths = [];
        break;
      default:
        break;
    }
    operands = [];
  }
  return fills;
}

// ---------------------------------------------------------------------------------------------
// Grid: the trace lies on a regular pixel grid. Find its step and origin, then snap.

function fitGrid(values) {
  const sorted = [...new Set(values.map((v) => v.toFixed(4)))].map(Number).sort((a, b) => a - b);
  const counts = new Map();
  for (let i = 1; i < sorted.length; i++) {
    const d = (sorted[i] - sorted[i - 1]).toFixed(3);
    counts.set(d, (counts.get(d) || 0) + 1);
  }
  const mode = Number([...counts].sort((a, b) => b[1] - a[1])[0][0]);
  const near = [];
  for (let i = 1; i < sorted.length; i++) {
    const d = sorted[i] - sorted[i - 1];
    if (Math.abs(d - mode) < 0.002) near.push(d);
  }
  let step = near.reduce((a, b) => a + b, 0) / near.length;
  const v0 = sorted[0];
  for (let pass = 0; pass < 3; pass++) {
    // least squares on k * step = v - v0, widening the range as the step firms up
    const reach = [80, 400, Infinity][pass];
    let num = 0;
    let den = 0;
    for (const v of sorted) {
      const k = Math.round((v - v0) / step);
      if (k > reach) continue;
      num += k * (v - v0);
      den += k * k;
    }
    step = num / den;
  }
  let offset = 0;
  for (const v of sorted) offset += v - Math.round(v / step) * step;
  return { step, offset: offset / sorted.length };
}

// ---------------------------------------------------------------------------------------------
// Geometry on integer rings ([[x, y], ...], implicitly closed).

const signedArea = (r) => {
  let a = 0;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += r[j][0] * r[i][1] - r[i][0] * r[j][1];
  return a / 2;
};
const bboxOf = (r) => {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const [x, y] of r) {
    if (x < x0) x0 = x;
    if (y < y0) y0 = y;
    if (x > x1) x1 = x;
    if (y > y1) y1 = y;
  }
  return { x0, y0, x1, y1 };
};
const inside = (r, x, y) => {
  let c = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const [xi, yi] = r[i];
    const [xj, yj] = r[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};

/**
 * Drop repeated points, points in the middle of a straight run, and the tips of out-and-back
 * spikes (zero-width hairs the trace leaves; they paint nothing, but simplifying their two sides
 * apart would open them into needles).
 */
function mergeCollinear(ring) {
  let r = ring.filter((p, i) => {
    const q = ring[(i + ring.length - 1) % ring.length];
    return p[0] !== q[0] || p[1] !== q[1];
  });
  let changed = true;
  while (changed && r.length > 3) {
    changed = false;
    const out = [];
    for (let i = 0; i < r.length; i++) {
      const a = out.length ? out[out.length - 1] : r[r.length - 1];
      const b = r[i];
      const c = r[(i + 1) % r.length];
      const cross = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
      if (cross === 0 || (a[0] === b[0] && a[1] === b[1])) changed = true;
      else out.push(b);
    }
    r = out;
  }
  return r;
}

function segmentDistance(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  let t = len2 ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
}

function douglasPeucker(points, tolerance) {
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [i, j] = stack.pop();
    let worst = -1;
    let at = -1;
    for (let k = i + 1; k < j; k++) {
      const d = segmentDistance(points[k], points[i], points[j]);
      if (d > worst) {
        worst = d;
        at = k;
      }
    }
    if (worst > tolerance) {
      keep[at] = 1;
      stack.push([i, at], [at, j]);
    }
  }
  return points.filter((_, k) => keep[k]);
}

/**
 * Staircase to straight lines. The trace walks the pixel grid in unit steps, each one of eight
 * directions (across, up/down, 45° diagonals). A staircase that stands for a straight line only ever
 * uses two neighbouring directions, so the ring is first cut wherever a third direction comes in:
 * at real corners, 45° chamfers, pinches where two strokes touch, dents and spikes. Those cut points
 * stay exactly where they are. Between them, the line is fitted through the middles of the steps,
 * which lie on the line the staircase stands for on both sides of a stroke alike, so every stroke
 * keeps its width (fitting through the stair corners instead tilts each side its own way and makes
 * thin strokes taper). Output is in half-pixel units (coordinates x 2), so it stays on integers.
 */
const DIRS = [
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [-1, -1],
  [0, -1],
  [1, -1],
];
const dirIndex = (dx, dy) => DIRS.findIndex(([x, y]) => x === Math.sign(dx) && y === Math.sign(dy));
const dirGap = (a, b) => Math.min((a - b + 8) % 8, (b - a + 8) % 8);

/** The ring as unit steps: each step's start point and direction. */
function unitSteps(r) {
  const pts = [];
  const dirs = [];
  for (let i = 0; i < r.length; i++) {
    const [ax, ay] = r[i];
    const [bx, by] = r[(i + 1) % r.length];
    const n = Math.max(Math.abs(bx - ax), Math.abs(by - ay));
    const d = dirIndex(bx - ax, by - ay);
    for (let k = 0; k < n; k++) {
      pts.push([ax + k * DIRS[d][0], ay + k * DIRS[d][1]]);
      dirs.push(d);
    }
  }
  return { pts, dirs };
}

/**
 * @param keep (x, y) => true where the outline must stay exact (see simplifyAll).
 */
function simplifyRing(ring, tolerance, keep) {
  const r = mergeCollinear(ring);
  const exact = r.map(([x, y]) => [2 * x, 2 * y]);
  const { pts, dirs } = unitSteps(r);
  const n = dirs.length;
  if (tolerance <= 0 || n <= SMALL_RING_STEPS) return exact;
  const locked = pts.map(([x, y]) => keep(x, y));
  // start on a hard turn so no straight piece is split by where the ring happens to begin
  let s0 = 0;
  for (let k = 0; k < n; k++)
    if (dirGap(dirs[k], dirs[(k + n - 1) % n]) >= 2) {
      s0 = k;
      break;
    }
  const out = [];
  let i = 0;
  while (i < n) {
    // grow the piece while it uses at most two neighbouring directions
    const a = dirs[(s0 + i) % n];
    const hair = locked[(s0 + i) % n];
    let b = -1;
    let j = i + 1;
    for (; j < n; j++) {
      const d = dirs[(s0 + j) % n];
      if (hair || locked[(s0 + j) % n]) break;
      if (d === a || d === b) continue;
      if (b === -1 && dirGap(a, d) === 1) {
        b = d;
        continue;
      }
      break;
    }
    const at = (k) => pts[(s0 + k) % n];
    const start = at(i);
    const end = j < n ? at(j) : at(0);
    const cand = [[2 * start[0], 2 * start[1]]];
    if (b !== -1)
      for (let k = i; k < j; k++) {
        const [px, py] = at(k);
        const [dx, dy] = DIRS[dirs[(s0 + k) % n]];
        cand.push([2 * px + dx, 2 * py + dy]);
      }
    cand.push([2 * end[0], 2 * end[1]]);
    const kept = douglasPeucker(cand, 2 * tolerance);
    out.push(...kept.slice(0, -1));
    i = j;
  }
  const simple = mergeCollinear(out);
  if (simple.length < 3) return exact;
  return simple;
}

/**
 * Where a segment properly crosses a segment of another ring, or of its own ring: [{ ri, x, y }].
 * (The trace's own rings often touch at a shared corner, where a stroke meets a hole diagonally;
 * touching is harmless to the even-odd fill, crossing is not.)
 */
function findCrossings(rings) {
  const CELL = 16;
  const grid = new Map();
  const segs = [];
  rings.forEach((r, ri) => {
    for (let k = 0; k < r.length; k++) {
      const a = r[k];
      const b = r[(k + 1) % r.length];
      const id = segs.length;
      segs.push({ ri, a, b });
      for (let x = Math.floor(Math.min(a[0], b[0]) / CELL); x <= Math.floor(Math.max(a[0], b[0]) / CELL); x++)
        for (let y = Math.floor(Math.min(a[1], b[1]) / CELL); y <= Math.floor(Math.max(a[1], b[1]) / CELL); y++) {
          const key = x * 100000 + y;
          if (!grid.has(key)) grid.set(key, []);
          grid.get(key).push(id);
        }
    }
  });
  const orient = (p, q, r) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
  const bad = [];
  for (const ids of grid.values())
    for (let x = 0; x < ids.length; x++)
      for (let y = x + 1; y < ids.length; y++) {
        const s = segs[ids[x]];
        const t = segs[ids[y]];
        const o1 = orient(s.a, s.b, t.a);
        const o2 = orient(s.a, s.b, t.b);
        const o3 = orient(t.a, t.b, s.a);
        const o4 = orient(t.a, t.b, s.b);
        if (o1 && o2 && o3 && o4 && o1 !== o2 && o3 !== o4) {
          const x = (s.a[0] + s.b[0]) / 2;
          const y = (s.a[1] + s.b[1]) / 2;
          bad.push({ ri: s.ri, x, y }, { ri: t.ri, x, y });
        }
      }
  return bad;
}

/**
 * Even-odd coverage of rings (half-pixel units) on a grid of one cell per unit, 4 x 4 samples per
 * cell, then a 3 x 3 box blur.
 */
function coverage(rings, W, H) {
  const SS = 4;
  const acc = new Uint8Array(W * H);
  const rows = Array.from({ length: H * SS }, () => []);
  const edges = [];
  for (const r of rings)
    for (let k = 0; k < r.length; k++) {
      const [x0, y0] = r[k];
      const [x1, y1] = r[(k + 1) % r.length];
      if (y0 === y1) continue;
      const e = y0 < y1 ? { ya: y0, yb: y1, x: x0, dx: (x1 - x0) / (y1 - y0) } : { ya: y1, yb: y0, x: x1, dx: (x0 - x1) / (y0 - y1) };
      const first = Math.max(0, Math.ceil(e.ya * SS - 0.5));
      if (first < H * SS) rows[first].push(edges.push(e) - 1);
    }
  let active = [];
  const xs = [];
  for (let row = 0; row < H * SS; row++) {
    const y = (row + 0.5) / SS;
    for (const id of rows[row]) active.push(id);
    active = active.filter((id) => edges[id].yb > y);
    xs.length = 0;
    for (const id of active) {
      const e = edges[id];
      if (e.ya <= y) xs.push(e.x + (y - e.ya) * e.dx);
    }
    xs.sort((p, q) => p - q);
    const line = Math.floor(row / SS) * W;
    for (let k = 0; k + 1 < xs.length; k += 2) {
      // samples at x = c + (i + 0.5) / SS inside [xs[k], xs[k + 1])
      const s0 = Math.max(0, Math.ceil(xs[k] * SS - 0.5));
      const s1 = Math.min(W * SS, Math.ceil(xs[k + 1] * SS - 0.5));
      for (let sx = s0; sx < s1; sx++) acc[line + ((sx / SS) | 0)]++;
    }
  }
  const out = new Float32Array(W * H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      let sum = 0;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const X = x + dx;
          const Y = y + dy;
          if (X >= 0 && Y >= 0 && X < W && Y < H) sum += acc[Y * W + X];
        }
      out[y * W + x] = sum / (9 * SS * SS);
    }
  return out;
}

/**
 * Simplify every ring, then check the result against the exact trace, as geometry and as a picture.
 * Wherever an outline would cross another, or the picture drifts (a stroke would fade, break, thicken
 * or sprout a needle: coverage, blurred over about 2.5 drawing pixels, off by more than DRIFT), the outline there is kept exact and
 * everything is simplified again, until both checks pass. Hairs the trace walks out and back along
 * are kept exact from the start, since their two sides must stay together.
 */
const DRIFT = 0.2;
const HOT_CELL = 3; // drawing pixels
function simplifyAll(rings, tolerance, W, H) {
  const hot = new Set();
  const cell = (x, y) => Math.floor(x / HOT_CELL) * 100000 + Math.floor(y / HOT_CELL);
  const heat = (x, y) => {
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) hot.add(cell(x + dx * HOT_CELL, y + dy * HOT_CELL));
  };
  const hairs = rings.map((ring) => {
    const { pts, dirs } = unitSteps(mergeCollinear(ring));
    const key = ([x, y], d) => {
      const [ex, ey] = [x + DIRS[d][0], y + DIRS[d][1]];
      return x < ex || (x === ex && y < ey) ? `${x},${y},${ex},${ey}` : `${ex},${ey},${x},${y}`;
    };
    const count = new Map();
    const keys = pts.map((p, k) => key(p, dirs[k]));
    for (const k of keys) count.set(k, (count.get(k) || 0) + 1);
    return new Set(pts.filter((_, k) => count.get(keys[k]) > 1).map(([x, y]) => x * 100000 + y));
  });
  const keepFor = (i) => (x, y) => hairs[i].has(x * 100000 + y) || hot.has(cell(x, y));
  const exact = rings.map((r) => simplifyRing(r, 0, () => true));
  const target = blur3(coverage(exact, 2 * W, 2 * H), 2 * W, 2 * H);
  const crossingInTrace = findCrossings(exact).length;
  const strikes = new Map();
  const whole = new Set();
  let out = [];
  let passes = 0;
  let drifted = 0;
  for (; passes < 24; passes++) {
    out = rings.map((r, i) => (whole.has(i) ? exact[i] : simplifyRing(r, tolerance, keepFor(i))));
    const crossings = findCrossings(out).filter((c) => !whole.has(c.ri));
    for (const c of crossings) {
      heat(c.x / 2, c.y / 2);
      strikes.set(c.ri, (strikes.get(c.ri) || 0) + 1);
      if (strikes.get(c.ri) > 6) whole.add(c.ri); // still crossing after its spots went exact
    }
    if (crossings.length) continue;
    const got = blur3(coverage(out, 2 * W, 2 * H), 2 * W, 2 * H);
    drifted = 0;
    for (let k = 0; k < got.length; k++)
      if (Math.abs(got[k] - target[k]) > DRIFT) {
        heat((k % (2 * W)) / 2, Math.floor(k / (2 * W)) / 2);
        drifted++;
      }
    if (!drifted) break;
  }
  if (drifted) throw new Error(`Simplification did not settle: ${drifted} pixels still drift`);
  return { rings: out, wholeExact: whole.size, hotCells: hot.size, passes: passes + 1, crossingInTrace };
}

/** 3 x 3 box blur. */
function blur3(a, w, h) {
  const out = new Float32Array(a.length);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let sum = 0;
      let n = 0;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const X = x + dx;
          const Y = y + dy;
          if (X >= 0 && Y >= 0 && X < w && Y < h) {
            sum += a[Y * w + X];
            n++;
          }
        }
      out[y * w + x] = sum / n;
    }
  return out;
}

// ---------------------------------------------------------------------------------------------
// Compact SVG path data: relative moves, h/v for straight runs, implicit repeated commands.

function encodeRings(rings) {
  let d = "";
  let cx = 0;
  let cy = 0;
  let last = "";
  const num = (v) => (v < 0 ? `${v}` : ` ${v}`);
  for (const ring of rings) {
    const [sx, sy] = ring[0];
    d += `m${sx - cx}${num(sy - cy)}`;
    last = "l"; // after m, pairs continue as relative lines
    let px = sx;
    let py = sy;
    for (let i = 1; i < ring.length; i++) {
      const [x, y] = ring[i];
      const dx = x - px;
      const dy = y - py;
      const cmd = dy === 0 ? "h" : dx === 0 ? "v" : "l";
      const args = cmd === "h" ? [dx] : cmd === "v" ? [dy] : [dx, dy];
      d += (last === cmd ? num(args[0]) : cmd + args[0]) + (args.length > 1 ? num(args[1]) : "");
      last = cmd;
      px = x;
      py = y;
    }
    d += "z";
    cx = sx;
    cy = sy;
  }
  return d;
}

const svgFile = (w, h, fill, rings, evenOdd) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">` +
  `<path fill="${fill}"${evenOdd ? ' fill-rule="evenodd"' : ""} d="${encodeRings(rings)}"/></svg>\n`;

// ---------------------------------------------------------------------------------------------

function main() {
  const args = process.argv.slice(2);
  const pdfPath = args.find((a, i) => !a.startsWith("--") && !(i > 0 && args[i - 1].startsWith("--")));
  if (!pdfPath) {
    console.error("Usage: node scripts/studio-house/build.mjs <drawing.pdf> [--out <dir>] [--tolerance <units>]");
    process.exit(1);
  }
  const opt = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
  const outDir = path.resolve(root, opt("--out", "public/images/studio"));
  const tolerance = Number(opt("--tolerance", DEFAULT_TOLERANCE));

  const { mediaBox, content } = readPdfPage(path.resolve(pdfPath));
  const fills = readFills(content);
  const art = fills.reduce((a, b) => (b.subpaths.length > a.subpaths.length ? b : a));
  const background = fills.find((f) => f !== art);

  // grid and snapping (PDF y-up to SVG y-down)
  const xs = art.subpaths.flatMap((s) => s.map((p) => p[0]));
  const ys = art.subpaths.flatMap((s) => s.map((p) => p[1]));
  const gx = fitGrid(xs);
  const gy = fitGrid(ys);
  const step = (gx.step + gy.step) / 2;
  let snapError = 0;
  const snapped = art.subpaths.map((s) =>
    s.map(([x, y]) => {
      const u = (x - gx.offset) / step;
      const v = (y - gy.offset) / step;
      snapError = Math.max(snapError, Math.abs(u - Math.round(u)), Math.abs(v - Math.round(v)));
      return [Math.round(u), Math.round(v)];
    }),
  );
  if (snapError > 0.01) throw new Error(`The path is not on a regular grid (error ${snapError} steps)`);
  const all = snapped.flat();
  const ux0 = Math.min(...all.map((p) => p[0]));
  const ux1 = Math.max(...all.map((p) => p[0]));
  const uy0 = Math.min(...all.map((p) => p[1]));
  const uy1 = Math.max(...all.map((p) => p[1]));
  const W = ux1 - ux0 + 2 * MARGIN;
  const H = uy1 - uy0 + 2 * MARGIN;
  const rings = snapped
    .map((s) => s.map(([u, v]) => [u - ux0 + MARGIN, uy1 - v + MARGIN]))
    .filter((r) => signedArea(r) !== 0); // out-and-back slivers paint nothing

  // nesting: even depth fills, odd depth is a hole (even-odd rule)
  const info = rings.map((r, i) => ({ i, area: Math.abs(signedArea(r)), ...bboxOf(r) }));
  const depth = new Array(rings.length).fill(0);
  const parent = new Array(rings.length).fill(-1);
  for (const a of info) {
    const r = rings[a.i];
    // a test point on the ring's first edge, nudged off the lattice so it is never on another ring
    const px = (r[0][0] + r[1][0]) / 2 + 0.0137;
    const py = (r[0][1] + r[1][1]) / 2 + 0.0071;
    let best = Infinity;
    for (const b of info) {
      if (b.i === a.i || b.area < a.area || b.x0 > a.x0 || b.x1 < a.x1 || b.y0 > a.y0 || b.y1 < a.y1) continue;
      if (inside(rings[b.i], px, py)) {
        depth[a.i]++;
        if (b.area < best) {
          best = b.area;
          parent[a.i] = b.i;
        }
      }
    }
  }
  const shapes = [];
  const shapeOf = new Map();
  for (const a of info)
    if (depth[a.i] % 2 === 0) {
      shapeOf.set(a.i, shapes.length);
      shapes.push({ outer: a.i, holes: [], ...a });
    }
  for (const a of info) if (depth[a.i] % 2 === 1) shapes[shapeOf.get(parent[a.i])].holes.push(a.i);

  // layers
  const isDash = (s) =>
    s.holes.length === 0 &&
    s.x1 - s.x0 <= 3 &&
    s.y1 - s.y0 >= 3 &&
    s.y1 - s.y0 <= 20 &&
    GUIDE_COLUMNS.some((x) => Math.abs((s.x0 + s.x1) / 2 - x) <= 2);
  const mains = [...shapes].sort((a, b) => b.area - a.area).slice(0, 3).sort((a, b) => a.y0 - b.y0);
  const [roofMain, upperMain, groundMain] = mains;
  // separators: halfway between the main shapes' facing edges, column by column
  const extent = (ring, x) => {
    let lo = Infinity;
    let hi = -Infinity;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [ax, ay] = ring[j];
      const [bx, by] = ring[i];
      if ((ax <= x && bx >= x) || (bx <= x && ax >= x)) {
        const y = ax === bx ? Math.min(ay, by) : ay + ((by - ay) * (x - ax)) / (bx - ax);
        lo = Math.min(lo, y);
        hi = Math.max(hi, ax === bx ? Math.max(ay, by) : y);
      }
    }
    return [lo, hi];
  };
  const separator = (above, below) => {
    const pts = [];
    for (let x = 0; x <= W; x += 5) {
      const [, aHi] = extent(rings[above.outer], x + 0.5);
      const [bLo] = extent(rings[below.outer], x + 0.5);
      if (Number.isFinite(aHi) && Number.isFinite(bLo)) pts.push([x, (aHi + bLo) / 2]);
    }
    return (x) => {
      if (x <= pts[0][0]) return pts[0][1];
      if (x >= pts[pts.length - 1][0]) return pts[pts.length - 1][1];
      const k = pts.findIndex((p) => p[0] >= x);
      const [x0, y0] = pts[k - 1];
      const [x1, y1] = pts[k];
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    };
  };
  const sepRoof = separator(roofMain, upperMain);
  const sepUpper = separator(upperMain, groundMain);
  const layerOf = (s) => {
    if (isDash(s)) return "guides";
    const r = rings[s.outer];
    let cx = 0;
    let cy = 0;
    for (const [x, y] of r) {
      cx += x;
      cy += y;
    }
    cx /= r.length;
    cy /= r.length;
    if (cy < sepRoof(cx)) return "roof";
    if (cy < sepUpper(cx)) return "upper";
    return "ground";
  };
  const names = ["roof", "upper", "ground", "guides"];
  const layers = Object.fromEntries(names.map((n) => [n, []]));
  for (const s of shapes) layers[layerOf(s)].push(s);
  for (const [name, main] of [["roof", roofMain], ["upper", upperMain], ["ground", groundMain]])
    if (!layers[name].includes(main)) throw new Error(`Main shape of ${name} misassigned`);

  // simplify every ring once; lines and solids share the same outer outlines
  const { rings: simple, wholeExact, hotCells, passes, crossingInTrace } = simplifyAll(rings, tolerance, W, H);
  const linesOf = (list) => list.flatMap((s) => [s.outer, ...s.holes]).sort((a, b) => a - b).map((i) => simple[i]);
  const isWithin = (s, o) => {
    if (o.x0 > s.x0 || o.x1 < s.x1 || o.y0 > s.y0 || o.y1 < s.y1) return false;
    const r = rings[s.outer];
    return inside(rings[o.outer], (r[0][0] + r[1][0]) / 2 + 0.0137, (r[0][1] + r[1][1]) / 2 + 0.0071);
  };
  // solid: the layer's outer outlines with holes filled, leaving out outlines inside another one
  const solidOf = (list) =>
    list
      .filter((s) => !list.some((o) => o !== s && o.area > s.area && depth[s.outer] > depth[o.outer] && isWithin(s, o)))
      .map((s) => simple[s.outer]);

  // Assembled pose, measured where the layers meet (drawing pixels, +y down). See README.md.
  const roofRing = rings[roofMain.outer];
  const upperRing = rings[upperMain.outer];
  const groundRing = rings[groundMain.outer];
  // upper floor onto the ground floor: the slab's bottom corners onto the walls' top corners
  const xUL = upperMain.x0 + 2;
  const xUR = upperMain.x1 - 2;
  const upperDropL = extent(groundRing, xUL)[0] - extent(upperRing, xUL)[1];
  const upperDropR = extent(groundRing, xUR)[0] - extent(upperRing, xUR)[1];
  const dropUpper = Math.round(upperDropL + upperDropR) / 2;
  // roof onto the upper floor: its underside onto the wall tops, at the left guide and the right corner
  const xRL = GUIDE_COLUMNS[0] + 0.5;
  const xRR = Math.min(roofMain.x1, upperMain.x1) - 1.5;
  const roofDropL = extent(upperRing, xRL)[0] - extent(roofRing, xRL)[1];
  const roofDropR = extent(upperRing, xRR)[0] - extent(roofRing, xRR)[1];
  // The drawing's roof is turned a little against the floors, so its drop grows from left to right:
  // a vertical shear (vertical lines stay vertical) seats it on both walls at once.
  const roofSlope = (roofDropR - roofDropL) / (xRR - xRL);

  // output: viewBox units are half pixels of the drawing (the simplified outlines sit on that grid)
  const K = 2;
  const VW = W * K;
  const VH = H * K;
  fs.mkdirSync(outDir, { recursive: true });
  const files = {};
  const write = (name, text) => {
    fs.writeFileSync(path.join(outDir, name), text);
    files[name] = Buffer.byteLength(text);
    return name;
  };
  const boxOf = (list) => {
    const b = list.reduce(
      (acc, s) => ({ x0: Math.min(acc.x0, s.x0), y0: Math.min(acc.y0, s.y0), x1: Math.max(acc.x1, s.x1), y1: Math.max(acc.y1, s.y1) }),
      { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity },
    );
    return [b.x0 * K, b.y0 * K, (b.x1 - b.x0) * K, (b.y1 - b.y0) * K];
  };
  const assembled = {
    ground: { y: 0 },
    upper: { y: Math.round(dropUpper * K) },
    roof: {
      y: Math.round((dropUpper + roofDropL) * K),
      skewY: round((Math.atan(roofSlope) * 180) / Math.PI, 3),
      originX: Math.round(xRL * K),
      yWithoutSkew: Math.round((dropUpper + (roofDropL + roofDropR) / 2) * K),
    },
  };
  // guides, by the gap they cross: the upper set hangs between the roof and the upper floor, the
  // lower set between the upper floor and the ground floor (with one run inside the ground floor)
  const guideSet = (s) => {
    const cx = (s.x0 + s.x1) / 2 + 0.5;
    return (s.y0 + s.y1) / 2 < extent(upperRing, cx)[1] ? "upper" : "lower";
  };
  const guidesUpper = layers.guides.filter((s) => guideSet(s) === "upper");
  const guidesLower = layers.guides.filter((s) => guideSet(s) === "lower");
  const manifest = {
    about:
      "Exploded drawing of a generic house for the Studio section, in layers. Not a depiction of any ROUANG project.",
    viewBox: [0, 0, VW, VH],
    unit: "half a pixel of the traced drawing",
    colors: { lines: LINE_COLOR, solid: SOLID_COLOR, sourceBackground: hex(background ? background.color : [0, 0, 0]) },
    paintOrder: ["ground.solid", "ground.lines", "guides.lower", "upper.solid", "upper.lines", "guides.upper", "roof.solid", "roof.lines"],
    layers: {},
    guides: {},
    assembled: {},
  };
  for (const name of ["roof", "upper", "ground"]) {
    const list = layers[name];
    manifest.layers[name] = {
      lines: write(`house-${name}-lines.svg`, svgFile(VW, VH, LINE_COLOR, linesOf(list), true)),
      solid: write(`house-${name}-solid.svg`, svgFile(VW, VH, SOLID_COLOR, solidOf(list), false)),
      bbox: boxOf(list),
      shapes: list.length,
      assembled: assembled[name],
    };
  }
  manifest.guides = {
    upper: {
      lines: write("house-guides-upper.svg", svgFile(VW, VH, LINE_COLOR, linesOf(guidesUpper), true)),
      bbox: boxOf(guidesUpper),
      shapes: guidesUpper.length,
      travelsWith: "upper",
    },
    lower: {
      lines: write("house-guides-lower.svg", svgFile(VW, VH, LINE_COLOR, linesOf(guidesLower), true)),
      bbox: boxOf(guidesLower),
      shapes: guidesLower.length,
      travelsWith: "ground",
    },
    runs: [],
  };
  // guide runs: consecutive dashes in a column, and the layers each run joins
  const which = (x, y) => (y < sepRoof(x) ? "roof" : y < sepUpper(x) ? "upper" : "ground");
  for (const column of GUIDE_COLUMNS) {
    const dashes = layers.guides.filter((s) => Math.abs((s.x0 + s.x1) / 2 - column) <= 2).sort((a, b) => a.y0 - b.y0);
    let run = null;
    for (const d of dashes) {
      if (run && d.y0 - run.y2 <= 20 && guideSet(d) === run.set) run.y2 = d.y1;
      else manifest.guides.runs.push((run = { x: column, y1: d.y0, y2: d.y1, set: guideSet(d) }));
    }
  }
  for (const g of manifest.guides.runs) {
    const top = which(g.x, g.y1);
    const bottom = which(g.x, g.y2);
    g.joins = top === bottom ? [top] : [top, bottom];
    g.x = (g.x + 0.5) * K;
    g.y1 *= K;
    g.y2 *= K;
  }
  // assembled pose: where the layers' outlines end up
  const dropAt = (name, x) => {
    const a = assembled[name];
    return a.y + (a.skewY ? Math.tan((a.skewY * Math.PI) / 180) * (x - a.originX) : 0);
  };
  const ab = ["roof", "upper", "ground"]
    .map((n) => {
      const [x, y, w, h] = manifest.layers[n].bbox;
      const top = Math.min(dropAt(n, x), dropAt(n, x + w));
      const bottom = Math.max(dropAt(n, x), dropAt(n, x + w));
      return [x, y + top, x + w, y + h + bottom];
    })
    .reduce((a, b) => [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])]);
  manifest.assembled = {
    bbox: [ab[0], Math.floor(ab[1]), ab[2] - ab[0], Math.ceil(ab[3]) - Math.floor(ab[1])],
    rule: "At progress p (0 = exploded as drawn, 1 = assembled) a layer's point (x, y) moves to y + p * (assembled.y + tan(skewY) * (x - originX)); x never changes. The ground floor stays put.",
  };
  manifest.measured = {
    unit: "drawing pixels",
    upperOnGround: { left: { x: xUL, drop: upperDropL }, right: { x: xUR, drop: upperDropR } },
    roofOnUpper: { left: { x: xRL, drop: roofDropL }, right: { x: xRR, drop: roofDropR } },
  };
  manifest.source = {
    page: mediaBox,
    // viewBox x = scale * ((pdfX - originX) / gridStep - gridX0 + margin)
    // viewBox y = scale * (gridY1 + margin - (pdfY - originY) / gridStep)
    gridStep: round(step, 6),
    originX: round(gx.offset, 6),
    originY: round(gy.offset, 6),
    gridX0: ux0,
    gridY1: uy1,
    margin: MARGIN,
    scale: K,
    tolerance,
  };
  write("house.json", JSON.stringify(manifest, null, 2) + "\n");
  console.log(
    `upper floor drop ${upperDropL} / ${upperDropR} -> ${dropUpper}; roof drop ${roofDropL} at x ${xRL}, ${roofDropR} at x ${xRR}, skew ${assembled.roof.skewY} deg`,
  );

  const pts = (list) => list.reduce((n, r) => n + r.length, 0);
  console.log(`grid step ${step.toFixed(6)} pt, snap error ${snapError.toExponential(1)} steps, viewBox ${W * 2} x ${H * 2}`);
  console.log(`rings ${rings.length}, shapes ${shapes.length}; points ${pts(rings)} -> ${pts(simple)} (tolerance ${tolerance}), ${passes} passes; kept exact: ${hotCells} cells of ${HOT_CELL} px where the outline would cross or drift, ${wholeExact} whole rings (${crossingInTrace} crossings in the trace)`);
  for (const n of names) console.log(`  ${n}: ${layers[n].length} shapes`);
  let total = 0;
  let gz = 0;
  for (const [name, bytes] of Object.entries(files)) {
    const z = zlib.gzipSync(fs.readFileSync(path.join(outDir, name)), { level: 9 }).length;
    total += bytes;
    gz += z;
    console.log(`  ${name.padEnd(26)} ${String(bytes).padStart(7)} B  gzip ${String(z).padStart(6)} B`);
  }
  console.log(`  total ${total} B, gzip ${gz} B -> ${path.relative(root, outDir)}`);
}

const round = (v, d) => Math.round(v * 10 ** d) / 10 ** d;
const hex = (rgb) => "#" + rgb.map((c) => Math.round(c * 255).toString(16).padStart(2, "0")).join("");

main();

#!/usr/bin/env node
/**
 * Puts a finished hero render on the site: checks it, publishes it under content-hashed file names,
 * and writes its geometry into src/app/globals.css.
 *
 *   node scripts/render/o-installation/site-geometry.cjs          after a render (or to re-solve)
 *   node scripts/render/o-installation/site-geometry.cjs --clean  also delete the render's unhashed
 *                                                                 output files once published
 *
 * Inputs: the render's outputs in public/images/hero (o-installation-desktop.webp,
 * o-installation-portrait.webp, o-scenery.jpg, o-installation.json). When an unhashed file is
 * missing (already published and cleaned), the published copy named in
 * src/components/home/heroFiles.json is used instead.
 *
 * Outputs:
 *   public/images/hero/<name>.<hash>.<ext>  the two walls, the view, and the opening's mask for each
 *                                           wall (white where the view shows through), under names
 *                                           that change with their content: the image optimiser
 *                                           and every cache keep a URL's images for 31 days
 *                                           (next.config.ts), so a replaced image needs a new URL
 *   src/components/home/heroFiles.json      those names and sizes, read by heroMedia.ts
 *   globals.css, between the "hero geometry" / "hero zoom" markers:
 *     --o-*     the emblem's outer edge (front plate): centre and size, as fractions of the image
 *     --lip-*   the inner edge at the front, where the frame meets the opening
 *     --zoom-*  the point the camera moves toward and how far, per band of screen shape: at the end
 *               of the move every screen in the band looks out through the far end of the opening
 *     --img-fy  where a band anchors the wall image vertically when the screen crops it
 * Nothing here is drawn by hand. It refuses a render whose opening is not transparent.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "../../..");
const sharp = require(require.resolve("sharp", { paths: [ROOT] }));
const HERO = path.join(ROOT, "public/images/hero");
const jsonPath = path.join(HERO, "o-installation.json");
const filesPath = path.join(ROOT, "src/components/home/heroFiles.json");
const cssPath = path.join(ROOT, "src/app/globals.css");
const CLEAN = process.argv.includes("--clean");
const geo = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
const published = fs.existsSync(filesPath) ? JSON.parse(fs.readFileSync(filesPath, "utf8")) : {};

/**
 * Screen shapes (width / height), in bands. The image covers the screen, so a screen of another
 * shape sees a crop of it, and the zoom must clear the opening for every shape in its band. Each
 * band gets its own zoom (globals.css picks it by aspect ratio), so on every screen the edge of the
 * opening leaves just as the move ends, rather than early on the easy shapes.
 *   desktop / portrait          full blocks: the outline, the lip and the zoom ("hero geometry")
 *   desktop-square / -wide,
 *   portrait-tablet             the zoom only ("hero zoom"), inside their own media queries
 * fy: where the band anchors the image vertically when the screen crops its top and bottom (0.5 is
 * centred). Portrait tablets crop the tall render hard, so they hold it a little high, to keep the
 * base of the emblem and some floor on screen.
 * The landscape render serves aspect ratios above 4/5, the portrait render 4/5 and below.
 */
const BANDS = {
  desktop: { view: "desktop", full: true, screens: [1.4, 16 / 10, 16 / 9, 1.9, 2] },
  "desktop-square": { view: "desktop", screens: [0.81, 1, 1.25, 4 / 3, 1.4] },
  "desktop-wide": { view: "desktop", screens: [2, 21 / 9, 2.8, 3.6] },
  portrait: { view: "portrait", full: true, screens: [0.44, 9 / 19.5, 0.5, 9 / 16, 0.6] },
  "portrait-tablet": { view: "portrait", fy: 0.57, screens: [0.6, 2 / 3, 3 / 4, 0.8] },
};
/** Overshoot, so the edge of the opening (and its soft anti-aliased rim) has left the screen just
 * before the move comes to rest; the far view keeps growing a little after that. */
const MARGIN = 1.06;

const SOURCES = {
  wallDesktop: { file: "o-installation-desktop.webp", view: "desktop" },
  wallPortrait: { file: "o-installation-portrait.webp", view: "portrait" },
  scenery: { file: "o-scenery.jpg" },
};

/** The render's fresh output if present, else the copy already published. */
function source(key) {
  const fresh = path.join(HERO, SOURCES[key].file);
  if (fs.existsSync(fresh)) return fresh;
  if (published[key]) return path.join(ROOT, "public", published[key].src);
  throw new Error(`no ${SOURCES[key].file} in public/images/hero and nothing published for ${key}`);
}

async function alphaOf(file) {
  const meta = await sharp(file).metadata();
  if (!meta.hasAlpha) throw new Error(`${path.basename(file)} has no alpha channel: the opening must be transparent`);
  const { data, info } = await sharp(file).extractChannel(3).raw().toBuffer({ resolveWithObject: true });
  let open = 0;
  for (const a of data) if (a < 128) open++;
  if (open / data.length < 0.02) throw new Error(`${path.basename(file)}: only ${((100 * open) / data.length).toFixed(2)}% of it is see-through; expected the opening (about 15%)`);
  return { mask: data, w: info.width, h: info.height };
}

/** The visible part of the image, in image fractions, for a screen of aspect a. */
function visible(imageAspect, a, fy = 0.5) {
  // Cover. A screen wider than the image crops its top and bottom: the image is held at fy,
  // clamped so it never leaves a gap (globals.css, --img-t). A narrower one crops the sides evenly.
  if (a > imageAspect) {
    const h = imageAspect / a;
    const y0 = Math.min(1 - h, Math.max(0, fy - h / 2));
    return { x0: 0, y0, x1: 1, y1: y0 + h };
  }
  const w = a / imageAspect;
  return { x0: (1 - w) / 2, y0: 0, x1: (1 + w) / 2, y1: 1 };
}

/**
 * Smallest scale Z about centre c at which every visible point maps into the see-through region:
 * a screen point p shows the image point c + (p - c) / Z. Tests the mapped rectangle's samples.
 */
function requiredScale(m, c, rects) {
  const open = (x, y) => {
    const px = Math.min(m.w - 1, Math.max(0, Math.round(x * (m.w - 1))));
    const py = Math.min(m.h - 1, Math.max(0, Math.round(y * (m.h - 1))));
    return m.mask[py * m.w + px] < 96; // alpha well below half: the view, not the wall
  };
  const fits = (Z) =>
    rects.every((r) => {
      for (let i = 0; i <= 24; i++) {
        for (let j = 0; j <= 24; j++) {
          const sx = r.x0 + ((r.x1 - r.x0) * i) / 24;
          const sy = r.y0 + ((r.y1 - r.y0) * j) / 24;
          if (!open(c[0] + (sx - c[0]) / Z, c[1] + (sy - c[1]) / Z)) return false;
        }
      }
      return true;
    });
  let lo = 1;
  let hi = 60;
  if (!fits(hi)) return Infinity;
  for (let k = 0; k < 40; k++) {
    const mid = (lo + hi) / 2;
    if (fits(mid)) hi = mid;
    else lo = mid;
  }
  return hi;
}

function solveZoom(view, m, screens, fy) {
  const v = geo.views[view];
  const rects = screens.map((a) => visible(v.width / v.height, a, fy));
  // Search around the see-through region for the centre needing the least travel.
  const st = v.seeThrough;
  let best = { Z: Infinity, c: st.centroid };
  for (let i = 0; i <= 20; i++) {
    for (let j = 0; j <= 20; j++) {
      const c = [st.x + st.width * (0.15 + (0.7 * i) / 20), st.y + st.height * (0.15 + (0.7 * j) / 20)];
      const Z = requiredScale(m, c, rects);
      if (Z < best.Z) best = { Z, c };
    }
  }
  if (!Number.isFinite(best.Z)) throw new Error(`${view}: no zoom clears the opening; is the render's opening transparent?`);
  return { x: best.c[0], y: best.c[1], s: best.Z * MARGIN };
}

const f = (n) => Number(n.toFixed(5));

function block(view, zoom, full, fy) {
  const v = geo.views[view];
  const o = v.outer;
  const lip = v.innerFront;
  const outline = [
    `--o-x: ${f(o.x + o.width / 2)};`,
    `--o-y: ${f(o.y + o.height / 2)};`,
    `--o-w: ${f(o.width)};`,
    `--o-h: ${f(o.height)};`,
    `--lip-x: ${f(lip.x + lip.width / 2)};`,
    `--lip-y: ${f(lip.y + lip.height / 2)};`,
    `--lip-w: ${f(lip.width)};`,
    `--lip-h: ${f(lip.height)};`,
  ];
  const move = [`--zoom-x: ${f(zoom.x)};`, `--zoom-y: ${f(zoom.y)};`, `--zoom-s: ${Number(zoom.s.toFixed(2))};`];
  if (fy !== undefined) move.push(`--img-fy: ${fy};`);
  return full ? [...outline, ...move] : move;
}

/** The opening as a small mask: opaque where the view shows through, following the render's own edge. */
async function openingMask(m) {
  const rgba = Buffer.alloc(m.w * m.h * 4, 255);
  for (let i = 0; i < m.w * m.h; i++) rgba[i * 4 + 3] = 255 - m.mask[i];
  const width = Math.round(m.w * 0.375);
  return sharp(rgba, { raw: { width: m.w, height: m.h, channels: 4 } })
    .resize(width)
    .png({ compressionLevel: 9, palette: false })
    .toBuffer();
}

function publish(base, ext, buf) {
  const hash = crypto.createHash("sha1").update(buf).digest("hex").slice(0, 8);
  const name = `${base}.${hash}.${ext}`;
  fs.writeFileSync(path.join(HERO, name), buf);
  return `/images/hero/${name}`;
}

(async () => {
  // Check everything before changing anything.
  const files = {};
  const alpha = {};
  for (const key of Object.keys(SOURCES)) files[key] = source(key);
  for (const key of ["wallDesktop", "wallPortrait"]) {
    const view = SOURCES[key].view;
    alpha[view] = await alphaOf(files[key]);
    const meta = await sharp(files[key]).metadata();
    if (meta.width !== geo.views[view].width || meta.height !== geo.views[view].height) {
      throw new Error(`${key} is ${meta.width}x${meta.height}, o-installation.json says ${geo.views[view].width}x${geo.views[view].height}`);
    }
  }
  for (const file of Object.values(files)) {
    const meta = await sharp(file).metadata();
    if (meta.exif || meta.xmp || meta.iptc) throw new Error(`${path.basename(file)} carries metadata; strip it first`);
  }

  // Geometry.
  let css = fs.readFileSync(cssPath, "utf8");
  for (const [band, { view, full, screens, fy }] of Object.entries(BANDS)) {
    const lines = block(view, solveZoom(view, alpha[view], screens, fy), full, fy);
    const kind = full ? "hero geometry" : "hero zoom";
    const start = `/* ${kind}: ${band} (scripts/render/o-installation/site-geometry.cjs) */`;
    const end = `/* end ${kind}: ${band} */`;
    const a = css.indexOf(start);
    const b = css.indexOf(end);
    if (a < 0 || b < 0) throw new Error(`markers for ${band} not found in globals.css`);
    const indent = band === "desktop" ? "  " : "    ";
    css = css.slice(0, a + start.length) + "\n" + lines.map((l) => indent + l).join("\n") + "\n" + indent + css.slice(b);
    console.log(band.padEnd(16), lines.filter((l) => l.startsWith("--zoom") || l.startsWith("--img")).join(" "));
  }

  // Publish under content-hashed names.
  const out = {};
  for (const [key, file] of Object.entries(files)) {
    const buf = fs.readFileSync(file);
    const meta = await sharp(buf).metadata();
    const ext = path.extname(SOURCES[key].file).slice(1);
    out[key] = { src: publish(path.basename(SOURCES[key].file, `.${ext}`), ext, buf), width: meta.width, height: meta.height };
  }
  for (const [key, view] of [["maskDesktop", "desktop"], ["maskPortrait", "portrait"]]) {
    const buf = await openingMask(alpha[view]);
    const meta = await sharp(buf).metadata();
    out[key] = { src: publish(`o-opening-${view}`, "png", buf), width: meta.width, height: meta.height };
  }
  for (const view of ["desktop", "portrait"]) geo.views[view].file = out[view === "desktop" ? "wallDesktop" : "wallPortrait"].src;

  fs.writeFileSync(cssPath, css);
  fs.writeFileSync(jsonPath, JSON.stringify(geo, null, 2) + "\n");
  fs.writeFileSync(filesPath, JSON.stringify(out, null, 2) + "\n");

  // Remove superseded published copies; with --clean, the render's unhashed outputs too.
  const keep = new Set(Object.values(out).map((o) => path.basename(o.src)));
  for (const name of fs.readdirSync(HERO)) {
    const hashed = /\.[0-9a-f]{8}\.(webp|jpg|png)$/.test(name);
    const unhashed = Object.values(SOURCES).some((s) => s.file === name);
    if ((hashed && !keep.has(name)) || (CLEAN && unhashed)) fs.rmSync(path.join(HERO, name));
  }
  for (const [key, o] of Object.entries(out)) console.log(key.padEnd(14), o.src, `${o.width}x${o.height}`);
})().catch((e) => {
  console.error(String(e && e.message ? e.message : e));
  process.exit(1);
});

#!/usr/bin/env node
/**
 * Export curated project imagery for the web.
 *
 *   node scripts/media/export.cjs <raw-dir> [--only <project>]
 *
 * <raw-dir> holds one folder per project (rembayung/, ampang/, ...) with the original files from
 * the studio's Drive. For every image listed in curation.json this:
 *   - decodes HEIC with ffmpeg, applies EXIF orientation
 *   - applies the ROUANG grade (slightly warm, calmer saturation, soft contrast; much lighter on renders)
 *   - resizes to at most 2400 px on the long edge
 *   - strips ALL metadata (the iPhone originals carry GPS coordinates)
 *   - for entries with `wide`, also writes <out>-wide.jpg: a landscape crop around the focus line,
 *     served to large screens instead of the portrait, so no bytes are spent on rows never shown
 * and writes public/images/projects/<project>/<out>.jpg plus media-manifest.json with dimensions.
 */
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFileSync } = require("child_process");
const sharp = require("sharp");

const root = path.resolve(__dirname, "../..");
const rawDir = process.argv[2];
const onlyAt = process.argv.indexOf("--only");
const only = onlyAt > 0 ? process.argv[onlyAt + 1] : null;
if (!rawDir) {
  console.error("Usage: node scripts/media/export.cjs <raw-dir> [--only <project>]");
  process.exit(1);
}
const curation = JSON.parse(fs.readFileSync(path.join(__dirname, "curation.json"), "utf8"));
const outRoot = path.join(root, "public/images/projects");
const manifestPath = path.join(__dirname, "media-manifest.json");
const manifest = only && fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : {};
const JPEG = { quality: 82, mozjpeg: true, chromaSubsampling: "4:2:0" };

function grade(img, k) {
  return img
    .recomb([
      [1 + 0.025 * k, 0.01 * k, 0],
      [0, 1, 0],
      [0, 0.01 * k, 1 - 0.035 * k],
    ])
    .modulate({ saturation: 1 - 0.1 * k, brightness: 1 + 0.01 * k })
    .linear(1 - 0.05 * k, 6 * k);
}

async function exportOne(project, kind, entry) {
  const src = path.join(rawDir, project, entry.file);
  if (!fs.existsSync(src)) return { missing: entry.file };
  const dest = path.join(outRoot, project, `${entry.out}.jpg`);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  let input = src;
  let tmp = null;
  if (/\.(heic|heif)$/i.test(src)) {
    tmp = path.join(os.tmpdir(), `rouang-${process.pid}-${path.basename(src)}.jpg`);
    execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", src, "-frames:v", "1", "-q:v", "1", tmp]);
    input = tmp;
  }
  const k = kind === "render" ? curation.grade.render : curation.grade.photo;
  // Graded once into lossless pixels, so the portrait and any wide crop are each encoded only once.
  const { data, info: px } = await grade(sharp(input, { limitInputPixels: false }).rotate(), k)
    .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
    .toColourspace("srgb")
    .raw()
    .toBuffer({ resolveWithObject: true });
  const raw = { raw: { width: px.width, height: px.height, channels: px.channels } };
  const info = await sharp(data, raw).jpeg(JPEG).toFile(dest);
  const out = { src: `/images/projects/${project}/${entry.out}.jpg`, width: info.width, height: info.height, bytes: info.size };

  if (entry.wide) {
    const [aw, ah] = entry.wide.aspect;
    let width = px.width;
    let height = Math.round((width * ah) / aw);
    if (height > px.height) {
      height = px.height;
      width = Math.round((height * aw) / ah);
    }
    const top = Math.min(Math.max(Math.round(entry.wide.focusY * px.height - height / 2), 0), px.height - height);
    const left = Math.round((px.width - width) / 2);
    const wideDest = path.join(outRoot, project, `${entry.out}-wide.jpg`);
    const w = await sharp(data, raw).extract({ left, top, width, height }).jpeg(JPEG).toFile(wideDest);
    out.wide = { src: `/images/projects/${project}/${entry.out}-wide.jpg`, width: w.width, height: w.height, bytes: w.size };
  }
  if (tmp) fs.rmSync(tmp, { force: true });
  return out;
}

(async () => {
  for (const [project, cfg] of Object.entries(curation.projects)) {
    if (only && project !== only) continue;
    const done = new Map();
    const entries = [["hero", cfg.hero], ["card", cfg.card], ...cfg.gallery.map((g, i) => [`gallery-${i}`, g])];
    manifest[project] = {};
    for (const [key, entry] of entries) {
      if (!entry) continue;
      if (!done.has(entry.out)) done.set(entry.out, await exportOne(project, cfg.kind, entry));
      manifest[project][key] = { ...done.get(entry.out), alt: entry.alt, caption: entry.caption, span: entry.span, focus: entry.focus };
      const r = done.get(entry.out);
      console.log(`${project}/${entry.out}`, r.missing ? `MISSING ${r.missing}` : `${r.width}x${r.height} ${(r.bytes / 1024) | 0} KB`);
      if (r.wide) console.log(`${project}/${entry.out}-wide`, `${r.wide.width}x${r.wide.height} ${(r.wide.bytes / 1024) | 0} KB`);
    }
  }
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 1));
})();

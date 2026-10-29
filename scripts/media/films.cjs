#!/usr/bin/env node
/**
 * Cut silent web loops from real project footage.
 *
 *   node scripts/media/films.cjs <source-dir> [<source-dir> ...] [--only <out-name>]
 *
 * The source folders hold the original files named in films.json (the studio's Drive footage,
 * kept outside the repository); each file is looked up in them in turn. For every entry this:
 *   - trims the segment and crops it (16:9 for wide screens, 9:16 or 4:5 for phones and grids),
 *     either the largest crop around focusX / focusY or an explicit crop box
 *   - optionally slows it down (speed 0.5 plays a 50 fps source at half speed, still smooth)
 *   - applies the ROUANG grade (as export.cjs does for photographs)
 *   - crossfades the last half second into the first, so the loop has no visible jump
 *   - drops the audio and ALL metadata (the iPhone clips carry GPS coordinates)
 *   - encodes H.264 MP4 with fast start, and writes the loop's first frame as its poster
 * Output goes to public/films/projects/<project>/ and films-manifest.json.
 */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const root = path.resolve(__dirname, "../..");
const args = process.argv.slice(2);
const onlyAt = args.indexOf("--only");
const only = onlyAt >= 0 ? args[onlyAt + 1] : null;
const srcDirs = args.filter((a, i) => a !== "--only" && (onlyAt < 0 || i !== onlyAt + 1));
if (!srcDirs.length) {
  console.error("Usage: node scripts/media/films.cjs <source-dir> [<source-dir> ...] [--only <out-name>]");
  process.exit(1);
}
const findSource = (file) => srcDirs.map((d) => path.join(d, file)).find((p) => fs.existsSync(p));
const config = JSON.parse(fs.readFileSync(path.join(__dirname, "films.json"), "utf8"));
const manifestPath = path.join(__dirname, "films-manifest.json");
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : {};

// Output frame sizes by use. Phones are 390-430 CSS px wide, grid tiles at most about 450.
const SHAPES = {
  wide: { aspect: 16 / 9, width: 1920 },
  narrow: { aspect: 9 / 16, width: 720 },
  tile: { aspect: 4 / 5, width: 720 },
};

// The same grade as export.cjs (k = 1 for phone footage; lighter for footage already graded).
function gradeFilter(k) {
  const mix = `colorchannelmixer=rr=${(1 + 0.025 * k) * 1.01}:rg=${0.01 * k}:gg=1.01:br=0:bg=${0.01 * k}:bb=${(1 - 0.035 * k) * 1.01}`;
  return [mix, `eq=saturation=${1 - 0.1 * k}`, `curves=all='0/${((6 * k) / 255).toFixed(4)} 1/${(1 - 0.05 * k + (6 * k) / 255).toFixed(4)}'`].join(",");
}

function probe(file) {
  const j = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-print_format", "json", "-show_streams", file]).toString());
  const v = j.streams.find((s) => s.codec_type === "video");
  const rot = Math.abs((v.side_data_list || []).find((d) => d.rotation !== undefined)?.rotation ?? 0);
  // ffmpeg applies the rotation itself, so work in displayed dimensions.
  return rot === 90 || rot === 270 ? { w: v.height, h: v.width } : { w: v.width, h: v.height };
}

function encode(entry) {
  const src = findSource(entry.file);
  if (!src) return { missing: entry.file };
  const shape = SHAPES[entry.shape];
  const { w, h } = probe(src);
  let cw, ch, cx, cy;
  if (entry.crop) {
    // An explicit box in displayed pixels, e.g. to keep table numbers out of frame.
    ({ x: cx, y: cy, w: cw, h: ch } = entry.crop);
  } else {
    // Largest crop of the requested shape, placed by focusX / focusY (0-1, default centre).
    cw = w;
    ch = Math.round(w / shape.aspect);
    if (ch > h) {
      ch = h;
      cw = Math.round(h * shape.aspect);
    }
    cx = Math.round(Math.min(Math.max((entry.focusX ?? 0.5) * w - cw / 2, 0), w - cw));
    cy = Math.round(Math.min(Math.max((entry.focusY ?? 0.5) * h - ch / 2, 0), h - ch));
  }
  cw -= cw % 2;
  ch -= ch % 2;
  const outW = Math.min(shape.width, cw) - (Math.min(shape.width, cw) % 2);
  const outH = Math.round(outW / shape.aspect / 2) * 2;
  const fps = entry.fps ?? 25;
  const fade = entry.crossfade ?? 0.5;
  const speed = entry.speed ?? 1;
  const span = entry.end - entry.start;
  // Everything after the speed change works on the output timeline.
  const dur = span / speed;
  const base = `crop=${cw}:${ch}:${cx}:${cy},scale=${outW}:${outH}:flags=lanczos,setpts=PTS/${speed},fps=${fps},${gradeFilter(entry.grade ?? 1)},format=yuv420p`;
  // Loop seam: play from `fade` to the end, and dissolve the last `fade` seconds into the opening.
  const graph =
    `[0:v]${base},split[a][b];` +
    `[a]trim=start=${fade}:end=${dur},setpts=PTS-STARTPTS[body];` +
    `[b]trim=start=0:end=${fade},setpts=PTS-STARTPTS[head];` +
    `[body][head]xfade=transition=fade:duration=${fade}:offset=${(dur - 2 * fade).toFixed(3)}[out]`;
  const dir = path.join(root, "public/films/projects", entry.project);
  fs.mkdirSync(dir, { recursive: true });
  const mp4 = path.join(dir, `${entry.out}.mp4`);
  const jpg = path.join(dir, `${entry.out}.jpg`);
  execFileSync("ffmpeg", [
    "-v", "error", "-y",
    "-ss", String(entry.start), "-t", String(span), "-i", src,
    "-filter_complex", graph, "-map", "[out]",
    "-an", "-map_metadata", "-1", "-map_chapters", "-1",
    "-c:v", "libx264", "-preset", "slow", "-crf", String(entry.crf ?? 24),
    "-maxrate", entry.shape === "wide" ? "5M" : "2.5M", "-bufsize", entry.shape === "wide" ? "10M" : "5M",
    "-profile:v", "high", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
    mp4,
  ]);
  // The poster is the loop's own first frame, so the still and the film line up exactly.
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", mp4, "-frames:v", "1", "-q:v", "2", "-map_metadata", "-1", jpg]);
  return {
    src: `/films/projects/${entry.project}/${entry.out}.mp4`,
    poster: `/films/projects/${entry.project}/${entry.out}.jpg`,
    width: outW,
    height: outH,
    seconds: Number((dur - fade).toFixed(2)),
    kb: Math.round(fs.statSync(mp4).size / 1024),
    posterKb: Math.round(fs.statSync(jpg).size / 1024),
    source: `${entry.file} ${entry.start}-${entry.end}s${speed !== 1 ? ` at ${speed}x` : ""}`,
  };
}

for (const entry of config.films) {
  if (only && entry.out !== only) continue;
  const r = encode(entry);
  manifest[entry.out] = r;
  console.log(entry.out, r.missing ? `MISSING ${r.missing}` : `${r.width}x${r.height} ${r.seconds}s ${r.kb} KB (poster ${r.posterKb} KB)`);
}
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 1) + "\n");

#!/usr/bin/env node
/**
 * Cut the home hero's film (the generated Rembayung visualisation) for scrolling.
 *
 *   node scripts/media/hero-film.cjs "<path to Rembayung Vid Intro.mp4>" [--stills]
 *
 * The source (1920×1080, 30 fps, 10 s, 300 frames) stays outside the repository. This writes the
 * three cuts HeroFilm picks between, to public/films/hero/:
 *   - rembayung-film-1080.mp4      1920×1080, for landscape screens with the pixels to show it
 *   - rembayung-film-720.mp4       1280×720, for smaller landscape screens
 *   - rembayung-film-portrait.mp4  608×1080, a 9:16 slice from the middle, for phones held upright
 * and, with --stills, the first and last frames to public/images/hero/ (they stand in while a cut loads).
 *
 * The page plays the film forwards natively at the speed of the scroll and seeks it backwards, so
 * each cut is encoded for seeking as much as for playing:
 *   - every source frame (30 fps), evenly spaced: no frame dropped, so the dolly moves at an even pace;
 *   - a keyframe every 6 frames (0.2 s), a closed GOP and no B-frames, so any frame decodes from at
 *     most 5 others (the earlier cuts: a keyframe every 12 frames, with B-frames). All-intra was
 *     tried and rejected: at the quality below it costs 2-3 times the size;
 *   - CRF chosen per cut for an SSIM of about 0.96-0.965 against the source, above the earlier cuts
 *     (0.94-0.95), with the wide cut kept under 10 MB;
 *   - fast start (the index first), no audio, and no metadata or chapters.
 */
const fs = require("fs");
const path = require("path");
const { execFileSync, spawnSync } = require("child_process");

const root = path.resolve(__dirname, "../..");
const args = process.argv.slice(2);
const src = args.find((a) => !a.startsWith("--"));
const stills = args.includes("--stills");
if (!src || !fs.existsSync(src)) {
  console.error('Usage: node scripts/media/hero-film.cjs "<path to Rembayung Vid Intro.mp4>" [--stills]');
  process.exit(1);
}

const KEYINT = 6;
const CUTS = [
  { file: "rembayung-film-1080.mp4", filter: "null", crf: 29.5 },
  { file: "rembayung-film-720.mp4", filter: "scale=1280:720:flags=lanczos", crf: 28 },
  { file: "rembayung-film-portrait.mp4", filter: "crop=608:1080:(iw-608)/2:0", crf: 29.5 },
];

const probe = (file, entries, extra = []) =>
  execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", ...extra, "-show_entries", entries, "-of", "json", file]).toString();

const source = JSON.parse(probe(src, "stream=width,height,r_frame_rate,nb_frames")).streams[0];
if (source.width !== 1920 || source.height !== 1080 || source.r_frame_rate !== "30/1") {
  console.error(`Expected the 1920×1080, 30 fps source; got ${source.width}×${source.height} at ${source.r_frame_rate}.`);
  process.exit(1);
}

const films = path.join(root, "public/films/hero");
fs.mkdirSync(films, { recursive: true });
for (const cut of CUTS) {
  const out = path.join(films, cut.file);
  execFileSync("ffmpeg", [
    "-v", "error", "-y", "-i", src,
    "-vf", `${cut.filter},format=yuv420p`,
    "-an", "-map_metadata", "-1", "-map_chapters", "-1", "-fflags", "+bitexact",
    "-c:v", "libx264", "-preset", "slow", "-crf", String(cut.crf), "-profile:v", "high", "-pix_fmt", "yuv420p",
    "-x264-params", `keyint=${KEYINT}:min-keyint=${KEYINT}:scenecut=0:bframes=0:open-gop=0`,
    "-movflags", "+faststart",
    out,
  ]);
  const s = JSON.parse(probe(out, "stream=width,height,r_frame_rate,nb_frames,has_b_frames")).streams[0];
  const keys = JSON.parse(probe(out, "packet=flags", ["-show_packets"])).packets.filter((p) => p.flags.startsWith("K")).length;
  // ffmpeg reports the SSIM against the source on stderr.
  const { stderr } = spawnSync("ffmpeg", ["-i", out, "-i", src, "-lavfi", `[1:v]${cut.filter},format=yuv420p[ref];[0:v][ref]ssim`, "-f", "null", "-"], { encoding: "utf8" });
  const ssim = (stderr.match(/All:([0-9.]+)/g) || []).pop()?.slice(4) ?? "?";
  console.log(
    cut.file,
    `${s.width}×${s.height} ${s.r_frame_rate} fps, ${s.nb_frames} frames, ${keys} keyframes, B-frames ${s.has_b_frames},`,
    `${(fs.statSync(out).size / 1e6).toFixed(2)} MB, SSIM ${ssim}`,
  );
}

if (stills) {
  // The first and last frames, as the stills the page shows while a cut loads (next/image serves them).
  const images = path.join(root, "public/images/hero");
  fs.mkdirSync(images, { recursive: true });
  const last = Number(source.nb_frames) - 1;
  for (const [name, n] of [["rembayung-film-first.jpg", 0], ["rembayung-film-last.jpg", last]]) {
    execFileSync("ffmpeg", ["-v", "error", "-y", "-i", src, "-vf", `select=eq(n\\,${n})`, "-frames:v", "1", "-q:v", "2", "-map_metadata", "-1", path.join(images, name)]);
    console.log(name, `frame ${n}`);
  }
}

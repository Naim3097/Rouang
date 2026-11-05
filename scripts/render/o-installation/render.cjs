/*
 * render.cjs
 *
 * Runs the whole O installation pipeline:
 *
 *   1. generates the procedural textures if they are missing (textures.cjs)
 *   2. starts a tiny local web server (random port, 127.0.0.1 only) that serves
 *      this folder and the render tools' node_modules
 *   3. opens index.html in headless Chrome (GPU, WebGL2) and, for each view,
 *      path-traces the render passes (light groups) and rasterises the
 *      see-through matte
 *   4. "develops" the raw float images in Node: adds up the passes, then
 *      exposure, tone mapping (AgX), a very gentle vignette and film grain,
 *      alpha from the matte
 *   5. writes the site assets (WebP with alpha, the scenery JPEG, the layout
 *      JSON) and preview images for judging
 *
 * See README.md in this folder for usage, options and the tools it needs.
 */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

const HERE = __dirname;
const SITE = path.resolve(HERE, '../../..'); // the website folder
const argv = process.argv.slice(2);
const opt = (name, def) => {
  const i = argv.indexOf('--' + name);
  if (i === -1) return def;
  const v = argv[i + 1];
  return v === undefined || v.startsWith('--') ? true : v;
};

/*
 * Render passes. Each pass path-traces the same view with some of the light
 * groups switched on (see scene.js); developing adds the passes up. The
 * final image uses two: everything but the LED, and the LED on its own, so
 * the LED halo gets its own sample count and its strength can be tuned
 * afterwards. The single-group passes are there for look development.
 */
const PASSES = {
  main: { sun: 1, sky: 1, scenery: 1 },
  led: { led: 1 },
  sun: { sun: 1 },
  sky: { sky: 1 },
  scenery: { scenery: 1 },
};

const OPTS = {
  views: String(opt('views', 'desktop,portrait')).split(','),
  passes: String(opt('passes', 'main,led')).split(','),
  samples: Number(opt('samples', 1536)), // samples per pixel for every pass ...
  passSamples: JSON.parse(String(opt('pass-samples', '{"led":640}'))), // ... except these
  weights: JSON.parse(String(opt('weights', '{}'))), // extra strength per pass when developing, e.g. {"led":1.3}
  scale: Number(opt('scale', 1)), // < 1 for quick previews (outputs then go to the preview folder only)
  tools: path.resolve(String(opt('tools', process.env.O_RENDER_TOOLS || path.join(HERE, 'render-tools')))),
  puppeteer: String(opt('puppeteer', process.env.PUPPETEER_CORE || 'puppeteer-core')),
  chrome: String(opt('chrome', process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe')),
  cache: path.resolve(String(opt('cache', path.join(os.tmpdir(), 'rouang-o-installation')))),
  previews: path.resolve(String(opt('previews', path.join(os.tmpdir(), 'rouang-o-installation', 'previews')))),
  developOnly: Boolean(opt('develop-only', false)), // re-grade cached renders without rendering
  noMatteCut: Boolean(opt('show-scenery', false)), // beauty pass shows the glowing plane (debug)
  tiles: String(opt('tiles', '4,4')).split(',').map(Number), // the frame is drawn in tiles so no single GPU call runs long
  exposure: Number(opt('exposure', 0)), // extra exposure in stops
  tag: opt('tag', ''), // extra name for cached renders (look development)
  crop: opt('crop', '') ? String(opt('crop', '')).split(',').map(Number) : null, // look development: x,y,w,h window of the full-size frame
  hide: String(opt('hide', '')).split(',').filter(Boolean), // look development: objects to leave out, e.g. branch
  profile: opt('profile', ''), // Chrome profile folder; keeping one makes later runs compile faster
  fresh: Boolean(opt('fresh', false)), // ignore cached passes and start them again
};
for (const p of OPTS.passes) if (!PASSES[p]) throw new Error(`unknown pass "${p}" (known: ${Object.keys(PASSES).join(', ')})`);
const samplesFor = (pass) => Number(OPTS.passSamples[pass] || OPTS.samples);
// Ceiling on the light one path may carry, per pass (scene units, 0 = none).
// It only touches rare stray paths (ordinary ones carry well under 2); see
// patchPathTracerShader in scene.js. For the LED it removes the speckle of
// light bouncing out of the shadow gap, at the cost of a little of that light.
const CLAMP = { main: 8, led: 2, ...JSON.parse(String(opt('clamp', '{}'))) };
const clampFor = (pass) => Number(CLAMP[pass] === undefined ? 0 : CLAMP[pass]);

const sharp = require(require.resolve('sharp', { paths: [SITE] }));
sharp.cache(false);

const OUT_HERO = path.join(SITE, 'public', 'images', 'hero');
const OUT_JSON = path.join(OUT_HERO, 'o-installation.json');
const OUT_SCENERY = path.join(OUT_HERO, 'o-scenery.jpg');
const SCENERY_SRC = path.join(HERE, 'scenery-source.jpg');

// How the site places the photo behind the opening (see README): scale it to
// cover the frame, then reduce it to this share of the cover size, centred
// on the see-through region.
const SITE_PHOTO_SCALE = { desktop: 0.8, portrait: 0.45 };

// WebP encoding of the site images: lossy colour, lossless alpha (alphaQuality
// 100), no metadata (sharp writes none unless asked).
const WEBP = {
  // 90 rather than 82: at 82 the encoder smooths away the concrete's fine grain
  // and pores (the renders are smooth enough that 90 still lands far under
  // the size budget)
  quality: Number(opt('webp-quality', 90)),
  alphaQuality: 100,
  effort: 6,
  smartSubsample: true,
  ...JSON.parse(String(opt('webp', '{}'))),
};

// Develop settings (applied in Node to the linear float render).
const GRADE = {
  exposureStops: 1.95, // base exposure, plus --exposure
  whiteBalance: [1.05, 1.0, 0.91], // linear RGB gains before tone mapping (a touch warm)
  vignette: 0.16, // darkening at the far corners (linear light)
  grain: 1.1, // film grain strength (8-bit levels, standard deviation in mid-tones)
  saturation: 1.0,
  contrast: 0.15, // gentle extra S-curve after AgX (0 = none)
  // strength of each pass in the final image (the single light groups are
  // for look development; main = sun + sky + scenery)
  mix: { main: 1, led: 0.6, sun: 1, sky: 1, scenery: 1 },
  // look development: --grade '{"contrast":0.1}' overrides any of the above
  ...JSON.parse(String(opt('grade', '{}'))),
};

// ---------------------------------------------------------------------------
// Static file server for the render page
// ---------------------------------------------------------------------------

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.wasm': 'application/wasm',
};

function startServer() {
  const roots = [
    { prefix: '/nm/', dir: path.join(OPTS.tools, 'node_modules') },
    { prefix: '/', dir: HERE },
  ];
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent(req.url.split('?')[0]);
    const root = roots.find((r) => url.startsWith(r.prefix));
    const file = path.normalize(path.join(root.dir, url.slice(root.prefix.length)));
    if (!file.startsWith(root.dir) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404);
      res.end('not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

// ---------------------------------------------------------------------------
// Rendering in headless Chrome
// ---------------------------------------------------------------------------

async function fetchResult(page, bytes) {
  const out = Buffer.alloc(bytes);
  const CHUNK = 12 * 1024 * 1024;
  for (let o = 0; o < bytes; o += CHUNK) {
    const b64 = await page.evaluate((a, b) => window.readResultChunk(a, b), o, CHUNK);
    Buffer.from(b64, 'base64').copy(out, o);
  }
  return out;
}

// WebGL rows run bottom to top; flip to top to bottom.
function flipRows(f32, width, height, channels) {
  const out = new Float32Array(f32.length);
  const row = width * channels;
  for (let y = 0; y < height; y++) out.set(f32.subarray((height - 1 - y) * row, (height - y) * row), y * row);
  return out;
}

/*
 * Headless Chrome with the render page loaded and the scene built. Called
 * again after a lost WebGL context (the GPU driver can reset it during long
 * renders), so a run can carry on where it stopped.
 */
async function openRenderPage(puppeteer, port) {
  const browser = await puppeteer.launch({
    executablePath: OPTS.chrome,
    headless: 'new',
    args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'],
    protocolTimeout: 6 * 3600 * 1000,
    ...(OPTS.profile ? { userDataDir: path.resolve(String(OPTS.profile)) } : {}),
  });
  const page = await browser.newPage();
  page.on('console', (m) => {
    const t = m.text();
    if (!t.includes('deprecated')) console.log('  [page] ' + t);
  });
  page.on('pageerror', (e) => console.error('  [page error] ' + e.message));
  await page.goto(`http://127.0.0.1:${port}/index.html`);
  await page.waitForFunction('window.__sceneReady === true', { timeout: 60000 });
  const info = await page.evaluate(() => window.setupScene());
  console.log('scene:', JSON.stringify(info));
  const gpu = await page.evaluate(() => {
    const gl = document.querySelector('canvas').getContext('webgl2');
    const d = gl.getExtension('WEBGL_debug_renderer_info');
    return d ? gl.getParameter(d.UNMASKED_RENDERER_WEBGL) : 'unknown';
  });
  console.log('gpu:', gpu);
  return { browser, page };
}

// Samples per batch: each batch is read back and folded into a running mean
// on disk, so a lost context or an interrupted run costs at most one batch.
const BATCH = Number(opt('batch', 128));

const readJson = (file, def) => (fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : def);

async function renderAll() {
  const puppeteer = require(require.resolve(OPTS.puppeteer, { paths: [HERE, OPTS.tools, process.cwd()] }));
  const server = await startServer();
  const port = server.address().port;
  console.log(`server: http://127.0.0.1:${port}/`);
  let session = await openRenderPage(puppeteer, port);
  let restarts = 0;
  // Run fn(page). If the WebGL context is lost, reopen the page and try again.
  const withPage = async (what, fn) => {
    for (;;) {
      try {
        return await fn(session.page);
      } catch (e) {
        const msg = String(e && e.message);
        const lost = /context lost|Target closed|Session closed|crash/i.test(msg);
        if (!lost || restarts >= 6) throw e;
        restarts++;
        console.log(`  ${what}: ${msg.split('\n')[0]}; restarting Chrome (${restarts})`);
        await session.browser.close().catch(() => {});
        session = await openRenderPage(puppeteer, port);
      }
    }
  };

  try {
    fs.mkdirSync(OPTS.cache, { recursive: true });
    for (const view of OPTS.views) {
      const tag = cacheTag(view);
      const samples = {};
      let size = null;
      for (const pass of OPTS.passes) {
        const want = samplesFor(pass);
        const file = path.join(OPTS.cache, `${tag}-${pass}.f32`);
        const sideFile = path.join(OPTS.cache, `${tag}-${pass}.json`);
        // the running mean so far (resumes an earlier, unfinished run)
        let side = OPTS.fresh ? { samples: 0 } : readJson(sideFile, { samples: 0 });
        let mean = side.samples > 0 && fs.existsSync(file) ? new Float32Array(fs.readFileSync(file).buffer.slice(0)) : null;
        if (!mean) side = { samples: 0 };
        const where = OPTS.crop ? `crop ${OPTS.crop.join(',')}` : `scale ${OPTS.scale}`;
        if (side.samples >= want) console.log(`render ${view} / ${pass}: ${side.samples} spp already cached`);
        else console.log(`render ${view} / ${pass}: ${want} spp at ${where}${side.samples ? ` (resuming at ${side.samples})` : ''}`);
        const t0 = Date.now();
        while (side.samples < want) {
          const n = Math.min(BATCH, want - side.samples);
          const { r, buf } = await withPage(`${view}/${pass}`, async (page) => {
            const r = await page.evaluate(
              (o) => window.renderStill(o),
              { view, samples: n, scale: OPTS.scale, tiles: OPTS.tiles, matte: !OPTS.noMatteCut, groups: PASSES[pass], clamp: clampFor(pass), hide: OPTS.hide, crop: OPTS.crop },
            );
            const buf = flipRows(new Float32Array((await fetchResult(page, r.bytes)).buffer.slice(0)), r.width, r.height, 4);
            // an empty alpha channel means the GPU dropped the work
            let cov = 0;
            for (let i = 3; i < buf.length; i += 4 * 97) cov += buf[i];
            if (!(cov > 0)) throw new Error('WebGL context lost (empty result)');
            return { r, buf };
          });
          if (!mean) mean = new Float32Array(buf.length);
          const total = side.samples + r.samples;
          const a = side.samples / total, b = r.samples / total;
          for (let i = 0; i < buf.length; i++) mean[i] = mean[i] * a + buf[i] * b;
          side = { samples: total, width: r.width, height: r.height };
          fs.writeFileSync(file, Buffer.from(mean.buffer));
          fs.writeFileSync(sideFile, JSON.stringify(side));
          console.log(`  ${view} / ${pass}: ${total}/${want} spp (${r.msPerSample.toFixed(0)} ms/spp, ${((Date.now() - t0) / 60000).toFixed(1)} min so far)`);
        }
        samples[pass] = side.samples;
        size = [side.width, side.height];
      }

      const matte = await withPage(`${view}/matte`, async (page) => {
        const m = await page.evaluate((o) => window.renderMatte(o), { view, scale: OPTS.scale, crop: OPTS.crop });
        const mt = flipRows(new Float32Array((await fetchResult(page, m.bytes)).buffer.slice(0)), m.width, m.height, 1);
        let seen = 0;
        for (let i = 0; i < mt.length; i += 13) seen += mt[i];
        if (!(seen > 0)) throw new Error('WebGL context lost (empty matte)');
        return mt;
      });
      fs.writeFileSync(path.join(OPTS.cache, `${tag}-matte.f32`), Buffer.from(matte.buffer));

      const layout = await withPage(`${view}/layout`, (page) => page.evaluate((o) => window.getLayout(o), { view }));
      const settings = await withPage(`${view}/settings`, (page) => page.evaluate(() => window.sceneSettings()));
      // keep what earlier runs cached for other passes of this view
      const metaFile = path.join(OPTS.cache, `${tag}-layout.json`);
      const old = readJson(metaFile, {});
      const keep = old.width === size[0] && old.height === size[1] ? old.samples || {} : {};
      fs.writeFileSync(metaFile, JSON.stringify({ layout, settings, width: size[0], height: size[1], samples: { ...keep, ...samples } }, null, 2));
    }
  } finally {
    await session.browser.close().catch(() => {});
    server.close();
  }
}

const cacheTag = (view) => `${view}-${OPTS.crop ? 'c' + OPTS.crop.join('_') : 's' + OPTS.scale}${OPTS.tag ? '-' + OPTS.tag : ''}`;

// ---------------------------------------------------------------------------
// Developing: tone mapping and finishing in Node
// ---------------------------------------------------------------------------

// three.js AgX tone mapping, ported from tonemapping_pars_fragment (linear sRGB in and out).
const M = (c0, c1, c2) => (v) => [
  c0[0] * v[0] + c1[0] * v[1] + c2[0] * v[2],
  c0[1] * v[0] + c1[1] * v[1] + c2[1] * v[2],
  c0[2] * v[0] + c1[2] * v[1] + c2[2] * v[2],
];
const SRGB_TO_2020 = M([0.6274, 0.0691, 0.0164], [0.3293, 0.9195, 0.0880], [0.0433, 0.0113, 0.8956]);
const R2020_TO_SRGB = M([1.6605, -0.1246, -0.0182], [-0.5876, 1.1329, -0.1006], [-0.0728, -0.0083, 1.1187]);
const AGX_IN = M([0.856627153315983, 0.137318972929847, 0.11189821299995], [0.0951212405381588, 0.761241990602591, 0.0767994186031903], [0.0482516061458583, 0.101439036467562, 0.811302368396859]);
const AGX_OUT = M([1.1271005818144368, -0.1413297634984383, -0.14132976349843826], [-0.11060664309660323, 1.157823702216272, -0.11060664309660294], [-0.016493938717834573, -0.016493938717834257, 1.2519364065950405]);
const AGX_MIN = -12.47393, AGX_MAX = 4.026069;
const agxCurve = (x) => {
  const x2 = x * x, x4 = x2 * x2;
  return 15.5 * x4 * x2 - 40.14 * x4 * x + 31.96 * x4 - 6.868 * x2 * x + 0.4298 * x2 + 0.1191 * x - 0.00232;
};
function agx(rgb) {
  let c = AGX_IN(SRGB_TO_2020(rgb));
  c = c.map((v) => {
    let l = Math.log2(Math.max(v, 1e-10));
    l = (l - AGX_MIN) / (AGX_MAX - AGX_MIN);
    return agxCurve(Math.min(Math.max(l, 0), 1));
  });
  c = AGX_OUT(c).map((v) => Math.pow(Math.max(0, v), 2.2));
  return R2020_TO_SRGB(c).map((v) => Math.min(Math.max(v, 0), 1));
}
const toSrgb = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
const fromSrgb = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/*
 * Film grain: a fixed, seeded noise field, softened to about 1.3 px grains,
 * strongest in the mid-tones and fading in deep shadows and highlights.
 */
function grainField(width, height, seed) {
  const r = rng(seed);
  const n = new Float32Array(width * height);
  for (let i = 0; i < n.length; i++) {
    // approximately gaussian (sum of uniforms)
    n[i] = r() + r() + r() + r() - 2;
  }
  // soften with a small 3x3 blur and renormalise
  const out = new Float32Array(n.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let s = 0, w = 0;
      for (let dy = -1; dy <= 1; dy++) {
        const yy = Math.min(height - 1, Math.max(0, y + dy));
        for (let dx = -1; dx <= 1; dx++) {
          const xx = Math.min(width - 1, Math.max(0, x + dx));
          const k = dx === 0 && dy === 0 ? 4 : dx === 0 || dy === 0 ? 2 : 1;
          s += n[yy * width + xx] * k;
          w += k;
        }
      }
      out[y * width + x] = s / w;
    }
  }
  let v = 0;
  for (let i = 0; i < out.length; i++) v += out[i] * out[i];
  const sd = Math.sqrt(v / out.length);
  for (let i = 0; i < out.length; i++) out[i] /= sd;
  return out;
}

/*
 * Turn the raw renders into display pixels.
 *   passes: [{ buf, weight }], each buf float RGBA with colour premultiplied
 *           by coverage (alpha = share of the pixel NOT covered by the
 *           see-through scenery); the passes' colours are added up
 *   matte:  float, 1 where the scenery is seen
 * Returns RGBA 8-bit with straight (not premultiplied) colour.
 */
function develop(passes, matte, width, height, { exposureStops, whiteBalance, vignette, grain, saturation, contrast }) {
  const N = width * height;
  const out = Buffer.alloc(N * 4);
  const exp = Math.pow(2, exposureStops);
  const grainN = grain > 0 ? grainField(width, height, 777) : null;
  const valid = new Uint8Array(N);
  const cx = width / 2, cy = height / 2;
  const rMax = Math.hypot(cx, cy);
  for (let i = 0; i < N; i++) {
    const alpha = 1 - matte[i];
    const a8 = alpha <= 0.5 / 255 ? 0 : alpha >= 254.5 / 255 ? 255 : Math.round(alpha * 255);
    out[i * 4 + 3] = a8;
    // linear colour: each pass's average over the rays that hit the room, summed
    let c = [0, 0, 0];
    let any = false;
    for (const { buf, weight } of passes) {
      // Where the exact matte says the pixel shows no scenery at all, every
      // ray hit the room, so its coverage is 1. Trusting that over the path
      // tracer's own alpha also guards against the rare GPU hiccup that
      // drops a few samples' alpha (seen once: two 4x4-pixel blocks).
      const cov = matte[i] <= 0 ? 1 : buf[i * 4 + 3];
      if (cov < 2e-3) continue;
      any = true;
      c[0] += (buf[i * 4] / cov) * weight;
      c[1] += (buf[i * 4 + 1] / cov) * weight;
      c[2] += (buf[i * 4 + 2] / cov) * weight;
    }
    if (!any) continue; // nothing but scenery here: colour is filled in below
    valid[i] = 1;
    const x = i % width, y = (i / width) | 0;
    const rr = Math.hypot(x + 0.5 - cx, y + 0.5 - cy) / rMax;
    const vig = 1 - vignette * Math.pow(rr, 2.6);
    c = c.map((v, k) => Math.max(0, v) * exp * vig * whiteBalance[k]);
    c = agx(c);
    // optional saturation and contrast tweaks in display space
    const L = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    c = c.map((v) => L + (v - L) * saturation);
    let s = c.map((v) => toSrgb(Math.min(Math.max(v, 0), 1)));
    if (contrast) s = s.map((v) => v + contrast * (v - 0.5) * (1 - Math.abs(2 * v - 1)) * 1.0);
    if (grainN) {
      const lum = 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2];
      const amt = (grain / 255) * (0.35 + 0.65 * Math.sin(Math.PI * Math.min(Math.max(lum, 0), 1)));
      s = s.map((v) => v + grainN[i] * amt);
    }
    out[i * 4] = Math.round(Math.min(Math.max(s[0], 0), 1) * 255);
    out[i * 4 + 1] = Math.round(Math.min(Math.max(s[1], 0), 1) * 255);
    out[i * 4 + 2] = Math.round(Math.min(Math.max(s[2], 0), 1) * 255);
  }
  fillInvalid(out, valid, width, height);
  return out;
}

// Spread edge colours into pixels that have none (fully see-through), so the
// colour under the soft alpha edge is clean and compresses well.
function fillInvalid(rgba, valid, width, height) {
  let frontier = [];
  for (let i = 0; i < valid.length; i++) if (!valid[i]) frontier.push(i);
  for (let pass = 0; pass < 64 && frontier.length; pass++) {
    const next = [];
    const fills = [];
    for (const i of frontier) {
      const x = i % width, y = (i / width) | 0;
      let r = 0, g = 0, b = 0, n = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx, yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= width || yy >= height) continue;
        const j = yy * width + xx;
        if (valid[j]) { r += rgba[j * 4]; g += rgba[j * 4 + 1]; b += rgba[j * 4 + 2]; n++; }
      }
      if (n) fills.push([i, r / n, g / n, b / n]);
      else next.push(i);
    }
    for (const [i, r, g, b] of fills) {
      rgba[i * 4] = Math.round(r); rgba[i * 4 + 1] = Math.round(g); rgba[i * 4 + 2] = Math.round(b);
      valid[i] = 1;
    }
    frontier = next;
  }
  // anything left (deep inside the opening): a flat average of the edge
  if (frontier.length) {
    let r = 0, g = 0, b = 0, n = 0;
    for (let i = 0; i < valid.length; i += 97) if (valid[i]) { r += rgba[i * 4]; g += rgba[i * 4 + 1]; b += rgba[i * 4 + 2]; n++; }
    for (const i of frontier) { rgba[i * 4] = r / n; rgba[i * 4 + 1] = g / n; rgba[i * 4 + 2] = b / n; }
  }
}

// Bounding box (normalised) of pixels where the matte is above a threshold.
function matteBox(matte, width, height, thr = 0.5) {
  let x0 = width, y0 = height, x1 = -1, y1 = -1, sum = 0, sx = 0, sy = 0;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const m = matte[y * width + x];
    if (m > 0) { sum += m; sx += m * (x + 0.5); sy += m * (y + 0.5); }
    if (m >= thr) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  }
  return {
    x: x0 / width, y: y0 / height, width: (x1 + 1 - x0) / width, height: (y1 + 1 - y0) / height,
    center: [(x0 + x1 + 1) / 2 / width, (y0 + y1 + 1) / 2 / height],
    centroid: [sx / sum / width, sy / sum / height],
    areaFraction: sum / (width * height),
  };
}

const r6 = (v) => (Array.isArray(v) ? v.map(r6) : typeof v === 'number' ? +v.toFixed(6) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, r6(x)])) : v);

// The mark's two subpaths, for the silhouette check overlay.
function markSubpaths() {
  const svg = fs.readFileSync(path.join(HERE, 'mark.svg'), 'utf8');
  const d = svg.match(/\sd="([^"]+)"/)[1];
  const parts = d.split(/(?=M)/).map((s) => s.trim()).filter(Boolean);
  return parts; // [outer, inner] in the file's order
}

async function writeOutputs() {
  fs.mkdirSync(OPTS.previews, { recursive: true });
  const final = OPTS.scale === 1 && !OPTS.tag && !OPTS.crop;
  if (final) fs.mkdirSync(OUT_HERO, { recursive: true });
  const json = {
    about: 'Geometry of the O installation hero renders. All positions are normalised image coordinates (0..1 of width and height, origin top-left). See scripts/render/o-installation/README.md.',
    generatedBy: 'scripts/render/o-installation/render.cjs',
    markViewBox: [0, 0, 266.64, 261.71],
    sitePhotoPlacement: { rule: 'cover the frame, then scale to this share of the cover size, centred on seeThrough.center', scale: SITE_PHOTO_SCALE },
    views: {},
  };

  for (const view of OPTS.views) {
    const tag = cacheTag(view);
    const meta = JSON.parse(fs.readFileSync(path.join(OPTS.cache, `${tag}-layout.json`), 'utf8'));
    const { width: W, height: H } = meta;
    const readF32 = (file) => new Float32Array(fs.readFileSync(file).buffer.slice(0));
    const passes = OPTS.passes.map((pass) => ({
      pass,
      buf: readF32(path.join(OPTS.cache, `${tag}-${pass}.f32`)),
      weight: (GRADE.mix[pass] === undefined ? 1 : GRADE.mix[pass]) * (OPTS.weights[pass] === undefined ? 1 : OPTS.weights[pass]),
    }));
    const matte = readF32(path.join(OPTS.cache, `${tag}-matte.f32`));
    const grade = { ...GRADE, exposureStops: GRADE.exposureStops + OPTS.exposure, ...(OPTS.crop ? { vignette: 0 } : {}) };
    const t0 = Date.now();
    const rgba = develop(passes, matte, W, H, grade);
    console.log(`develop ${view} (${passes.map((p) => `${p.pass} x${p.weight}`).join(' + ')}): ${((Date.now() - t0) / 1000).toFixed(1)} s`);

    // compare the path tracer's own coverage with the rasterised matte
    const beauty = passes[0].buf;
    let maxDiff = 0, sumDiff = 0, nEdge = 0;
    for (let i = 0; i < W * H; i++) {
      const d = Math.abs(beauty[i * 4 + 3] - (1 - matte[i]));
      if (matte[i] > 0.001 && matte[i] < 0.999) { sumDiff += d; nEdge++; }
      maxDiff = Math.max(maxDiff, d);
    }
    console.log(`  matte vs path-traced coverage: max diff ${maxDiff.toFixed(4)}, mean diff on edge pixels ${(sumDiff / Math.max(1, nEdge)).toFixed(4)} (${nEdge} edge px)`);

    const img = sharp(rgba, { raw: { width: W, height: H, channels: 4 } });
    const webpFile = final && !OPTS.tag ? path.join(OUT_HERO, `o-installation-${view}.webp`) : path.join(OPTS.previews, `o-installation-${tag}.webp`);
    const info = await img.clone().webp(WEBP).toFile(webpFile);
    // the same pixels without compression, for judging what the encoder costs
    await img.clone().png({ compressionLevel: 6 }).toFile(path.join(OPTS.previews, `${view}${OPTS.tag ? '-' + OPTS.tag : ''}-lossless.png`));
    console.log(`  wrote ${webpFile} (${(info.size / 1024).toFixed(0)} KB)`);

    // a crop window (look development): just the developed pixels over a dark background
    if (OPTS.crop) {
      await sharp(rgba, { raw: { width: W, height: H, channels: 4 } }).flatten({ background: '#28241f' }).png()
        .toFile(path.join(OPTS.previews, `${tag}-crop.png`));
      continue;
    }

    // layout for the site, refined with the matte image itself
    const L = meta.layout;
    L.seeThrough = { ...matteBox(matte, W, H, 0.5), source: 'matte pass, pixels with alpha below 0.5' };
    json.views[view] = r6({
      file: `/images/hero/o-installation-${view}.webp`,
      width: L.width,
      height: L.height,
      outer: L.outer,
      innerFront: L.innerFront,
      tunnelExit: L.tunnelExit,
      seeThrough: L.seeThrough,
      emblemCenter: L.emblemCenter,
      floorLine: L.floorLine,
      innerContourPoints: L.innerContourPoints,
      camera: L.camera,
      render: { samples: meta.samples, renderedWidth: W, renderedHeight: H },
    });

    // ---------- previews ----------
    const pv = (name) => path.join(OPTS.previews, `${view}${OPTS.tag ? '-' + OPTS.tag : ''}-${name}`);
    // 1. the beauty over the ORIGINAL photo, placed the way the site does it
    const cover = Math.max(W / 1600, H / 900);
    const k = SITE_PHOTO_SCALE[view];
    const pw = Math.round(1600 * cover * k), ph = Math.round(900 * cover * k);
    const c = L.seeThrough.center;
    const left = Math.round(c[0] * W - pw / 2), top = Math.round(c[1] * H - ph / 2);
    const photo = await sharp(SCENERY_SRC).resize(pw, ph, { kernel: 'lanczos3' }).removeAlpha().raw().toBuffer();
    // place the photo on a canvas the size of the frame (it may hang over the edges)
    const bgRaw = Buffer.alloc(W * H * 3);
    for (let y = 0; y < H; y++) {
      const sy = y - top;
      for (let x = 0; x < W; x++) {
        const sx = x - left;
        const o = (y * W + x) * 3;
        if (sx >= 0 && sy >= 0 && sx < pw && sy < ph) photo.copy(bgRaw, o, (sy * pw + sx) * 3, (sy * pw + sx) * 3 + 3);
        else { bgRaw[o] = 40; bgRaw[o + 1] = 36; bgRaw[o + 2] = 32; }
      }
    }
    const beautyPng = await sharp(webpFile).png().toBuffer();
    await sharp(bgRaw, { raw: { width: W, height: H, channels: 3 } }).composite([{ input: beautyPng }]).jpeg({ quality: 92 }).toFile(pv('composite.jpg'));
    await sharp(pv('composite.jpg')).resize(Math.round(W / 2)).jpeg({ quality: 90 }).toFile(pv('composite-half.jpg'));

    // 2. 1:1 crops: concrete beside the O, and the floor
    const ob = L.outer;
    const crop = async (name, cx, cy, cw, ch) => {
      const l = Math.max(0, Math.min(W - cw, Math.round(cx - cw / 2)));
      const t = Math.max(0, Math.min(H - ch, Math.round(cy - ch / 2)));
      await sharp(pv('composite.jpg')).extract({ left: l, top: t, width: Math.min(cw, W), height: Math.min(ch, H) }).png().toFile(pv(name));
    };
    const cw = Math.round(900 * OPTS.scale), ch = Math.round(600 * OPTS.scale);
    await crop('crop-concrete-left.png', (ob.x - 0.02) * W, (ob.y + ob.height * 0.35) * H, cw, ch);
    await crop('crop-concrete-right.png', (ob.x + ob.width + 0.02) * W, (ob.y + ob.height * 0.4) * H, cw, ch);
    await crop('crop-frame-wave.png', (ob.x + ob.width * 0.3) * W, (ob.y + ob.height * 0.62) * H, cw, ch);
    await crop('crop-floor.png', 0.5 * W, (L.floorLine + (1 - L.floorLine) / 2) * H, cw, Math.min(ch, Math.round((1 - L.floorLine) * H)));

    // 3. the matte
    const m8 = Buffer.alloc(W * H);
    for (let i = 0; i < W * H; i++) m8[i] = Math.round(Math.min(1, Math.max(0, matte[i])) * 255);
    await sharp(m8, { raw: { width: W, height: H, channels: 1 } }).png().toFile(pv('matte.png'));

    // 4. silhouette check: the exact mark outline placed by the JSON, in red
    const [dOuter, dInner] = markSubpaths();
    const tr = (t) => `matrix(${t.scaleX * W} 0 0 ${t.scaleY * H} ${t.offsetX * W} ${t.offsetY * H})`;
    const sw = (t) => 1.6 / (t.scaleX * W);
    const overlay = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
      <path d="${dOuter}" transform="${tr(L.outer.svgToImage)}" fill="none" stroke="#ff2020" stroke-width="${sw(L.outer.svgToImage)}"/>
      <path d="${dInner}" transform="${tr(L.innerFront.svgToImage)}" fill="none" stroke="#ff2020" stroke-width="${sw(L.innerFront.svgToImage)}"/>
      <path d="${dInner}" transform="${tr(L.tunnelExit.svgToImage)}" fill="none" stroke="#20c0ff" stroke-width="${sw(L.tunnelExit.svgToImage)}" stroke-dasharray="${6 / (L.tunnelExit.svgToImage.scaleX * W)}"/>
    </svg>`;
    await sharp(pv('composite.jpg')).composite([{ input: Buffer.from(overlay) }]).jpeg({ quality: 92 }).toFile(pv('silhouette.jpg'));
    await crop2(pv('silhouette.jpg'), pv('silhouette-crop.png'), (ob.x + ob.width * 0.18) * W, (ob.y + ob.height * 0.62) * H, cw, ch, W, H);
  }

  // the scenery photo for the site: Lanczos upscale, nothing else
  if (final) {
    await sharp(SCENERY_SRC)
      .resize(2560, 1440, { kernel: 'lanczos3' })
      .sharpen({ sigma: 0.6, m1: 0.35, m2: 0.6, x1: 2, y2: 6, y3: 10 })
      .toColourspace('srgb')
      .jpeg({ quality: 88, chromaSubsampling: '4:4:4', mozjpeg: true })
      .toFile(OUT_SCENERY);
    console.log(`wrote ${OUT_SCENERY}`);
    // keep the other view's entry when only one view was rendered this time
    if (fs.existsSync(OUT_JSON)) {
      const old = JSON.parse(fs.readFileSync(OUT_JSON, 'utf8'));
      json.views = { ...(old.views || {}), ...json.views };
    }
    fs.writeFileSync(OUT_JSON, JSON.stringify(json, null, 2) + '\n');
    console.log(`wrote ${OUT_JSON}`);
  } else {
    fs.writeFileSync(path.join(OPTS.previews, `o-installation-s${OPTS.scale}.json`), JSON.stringify(json, null, 2));
  }
}

async function crop2(src, dst, cx, cy, cw, ch, W, H) {
  cw = Math.min(cw, W);
  ch = Math.min(ch, H);
  const l = Math.max(0, Math.min(W - cw, Math.round(cx - cw / 2)));
  const t = Math.max(0, Math.min(H - ch, Math.round(cy - ch / 2)));
  await sharp(src).extract({ left: l, top: t, width: cw, height: ch }).png().toFile(dst);
}

// ---------------------------------------------------------------------------

(async () => {
  const t0 = Date.now();
  if (!OPTS.developOnly) {
    await require('./textures.cjs').generateTextures();
    await renderAll();
  }
  await writeOutputs();
  console.log(`done in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

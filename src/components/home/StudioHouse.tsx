"use client";

import { useEffect, useRef, type CSSProperties, type RefObject } from "react";

/* ——— 02 Studio: the house beside "built" ———
 * A generic exploded drawing of a two-storey house (roof, upper floor, ground floor, with dashed
 * guides between them), drawn in Milky White line on the green. Purely decorative: it shows no
 * ROUANG project and carries no caption. As the visitor scrolls the house comes together in the
 * middle: the roof comes down while the ground floor, with its garden, rises onto the upper floor,
 * and the finished house stands on the middle of the stage (placement: styles/home/studio.css).
 *
 * The artwork is the layered line work in public/images/studio/ (scripts/studio-house/). All the
 * files share one viewBox, 1810 × 2866 units.
 *
 * It is drawn twice over:
 * - In CSS, as a still picture: each layer a box the size of the viewBox, masked by its line work.
 *   The house hangs apart as drawn; it stands whole where the browser has no scroll-driven
 *   animation. This is what shows without JavaScript, with reduced motion, and until the canvas
 *   below has drawn.
 * - On a canvas, which takes over where the house comes together. The house is solid: what a
 *   higher layer stands in front of is cut out of the lower ones, so the field shows through
 *   rather than a patch of flat green. Moving masks in CSS do the same, but the browser then
 *   resamples everything under the slanted roof twice on every frame, so the lines went soft as the
 *   roof came down, and sharpened with a jolt once a still copy took over. Here the floors move in
 *   whole device pixels and the roof is drawn from its outline at every step, so every line stays
 *   as sharp as the still picture, from the first frame to the last. Each frame is a handful of
 *   draws, made only when the scroll has moved the house.
 *
 * Behind it, three dotted rings, as in the client's mockup (23 Nov): centred on the finished
 * house, the outermost the clearest and each one inside it fainter, and hidden wherever a floor or
 * the roof stands in front of them. In the still picture they are an SVG, cut away by the three
 * layers' outlines (studio.css). On the canvas they are drawn first, from a picture made once for
 * the size on screen to the SVG's own measure, and every layer of the house is cut out of them as
 * it moves. They rise with the drawing as the roof lands, so the house is centred in them from the
 * first pose to the last: the hanging layers come together at the rings' centre.
 */

// The drawing's units (house.json).
const VIEW_W = 1810;
const VIEW_H = 2866;
// The assembled pose: the ground floor rises 587 units onto the upper floor; the roof comes down 507
// at the left guide (x 223), with a 3.556° vertical shear, because the drawing turns the roof
// slightly against the floors: so both eaves sit on the walls and vertical lines stay vertical.
const RISE = 587;
const DROP = 507;
const SHEAR = Math.tan((3.556 * Math.PI) / 180);
const ORIGIN_X = 223;
// The finished house runs from the roof's ridge (580 units) to the garden's lowest corner (2271).
const DONE_MID = 1425.6;

// Guide runs from house.json, in viewBox units: x, top, bottom.
type Run = [x: number, top: number, bottom: number];
const upperGuides: Run[] = [
  [223, 556, 1046],
  [535, 566, 886],
  [829, 770, 896],
  [1217, 552, 740],
  [1601, 360, 918],
];
const lowerGuides: Run[] = [
  [223, 1334, 1896],
  [535, 1480, 1730],
  [829, 1436, 1576],
  [1123, 1422, 1460],
  [1217, 1374, 1508],
  [1601, 1170, 1712],
];
// The one run that stays within the ground floor (the main block's corner down to the carport).
const groundGuide: Run = [1601, 2032, 2114];

/* ——— The still picture (CSS) ——— */

function Guide({ run, set }: { run: Run; set: "upper" | "lower" | "ground" }) {
  const [x, top, bottom] = run;
  // A strip 16 units wide around the run, 2 units of margin top and bottom. Under the upper floor
  // the strip rises with the ground floor, so it reaches as far again above the run.
  const reach = set === "lower" ? RISE : 0;
  const style = { "--gx": x - 8, "--gy": top - 2 - reach, "--gh": bottom - top + 4 + reach } as CSSProperties;
  return (
    <div className={`studio-house-guide studio-house-guide-${set}`} style={style}>
      <div />
    </div>
  );
}

/** The three layers, each lower one cut away where a higher one stands, with the guides. */
function Layers() {
  return (
    <>
      {/* Everything the roof stands in front of, cut away where the roof is. */}
      <div className="studio-house-frame studio-house-roof studio-house-under-roof">
        <div className="studio-house-frame studio-house-roof-undo">
          {/* Everything the upper floor stands in front of, cut away where it is. */}
          <div className="studio-house-frame studio-house-under-up">
            <div className="studio-house-frame studio-house-ground">
              <div className="studio-house-ink studio-house-ground-lines" />
              <Guide run={groundGuide} set="ground" />
              {lowerGuides.map((run) => (
                <Guide key={run[0]} run={run} set="lower" />
              ))}
            </div>
          </div>
          <div className="studio-house-ink studio-house-upper-lines" />
        </div>
        {upperGuides.map((run) => (
          <Guide key={run[0]} run={run} set="upper" />
        ))}
      </div>
      <div className="studio-house-frame studio-house-roof">
        <div className="studio-house-ink studio-house-roof-lines" />
      </div>
    </>
  );
}

/* ——— The rings ——— */

// Three rings, their radii set in studio.css. Each is a row of dots, evenly spaced all the way
// round: pathLength sets the count, so no gap is left where the circle closes. About 5.5px apart
// where the stage is 900px high, as in the mockup, closer on a smaller screen. The svg has no
// viewBox: its units are CSS pixels, so the dots are the same size at every scale.
const ringDots = [420, 360, 300];

function Rings() {
  return (
    <div className="studio-house-rings">
      <svg className="studio-rings" focusable="false">
        {ringDots.map((dots, i) => (
          <circle key={dots} className={`studio-ring studio-ring-${i + 1}`} cx="50%" cy="50%" pathLength={dots} />
        ))}
      </svg>
    </div>
  );
}

/* ——— The canvas ——— */

/** A CSS cubic-bezier() timing function. */
function bezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sy = (t: number) => ((ay * t + by) * t + cy) * t;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let lo = 0;
    let hi = 1;
    let t = x;
    for (let i = 0; i < 24; i++) {
      if (sx(t) < x) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
    return sy(t);
  };
}

const settle = bezier(0.42, 0, 0.22, 1);
const easeIn = bezier(0.42, 0, 1, 1);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * The pose at `t` (0 hanging apart, 1 whole) of the stretch over which the house comes together:
 * the ground floor rises over the first two thirds, eased out as it arrives; the roof sets off as the
 * floor nears its place and lands last; the short guide inside the ground floor is gone a quarter of
 * the way in.
 */
function pose(t: number) {
  return {
    ground: settle(t / 0.64),
    roof: settle((t - 0.36) / 0.64),
    guide: 1 - easeIn(t / 0.234),
  };
}

// The layers drawn from pictures made once for the size on screen (they only ever move by whole
// device pixels), and the roof, drawn from its outline at every step (it slants as it lands).
type Sheet = { image: CanvasImageSource; x: number; y: number };
type Art = {
  scale: number;
  groundLines: Sheet;
  groundSolid: Sheet;
  upperLines: Sheet;
  upperSolid: Sheet;
  guidesLower: Sheet;
  guidesUpper: Sheet;
  roofLines: Path2D;
  roofSolid: Path2D;
};

const files = ["ground-lines", "ground-solid", "upper-lines", "upper-solid", "guides-lower", "guides-upper", "roof-lines", "roof-solid"] as const;
type LayerFile = (typeof files)[number];
// Each picture covers its layer's box in the drawing (house.json), with 4 units to spare.
const boxes: Partial<Record<LayerFile, [number, number, number, number]>> = {
  "ground-lines": [8, 1466, 1802, 2858],
  "ground-solid": [8, 1466, 1802, 2858],
  "upper-lines": [204, 706, 1630, 1512],
  "upper-solid": [204, 706, 1630, 1512],
  "guides-lower": [220, 1170, 1600, 2114],
  "guides-upper": [220, 360, 1600, 1046],
};

async function loadPaths(): Promise<Record<LayerFile, Path2D>> {
  const texts = await Promise.all(
    files.map((name) =>
      fetch(`/images/studio/house-${name}.svg`).then((r) => {
        if (!r.ok) throw new Error(`house-${name}.svg: ${r.status}`);
        return r.text();
      }),
    ),
  );
  const paths = {} as Record<LayerFile, Path2D>;
  files.forEach((name, i) => {
    const d = / d="([^"]+)"/.exec(texts[i])?.[1];
    if (!d) throw new Error(`house-${name}.svg: no path`);
    paths[name] = new Path2D(d);
  });
  return paths;
}

function makeSheet(path: Path2D, box: [number, number, number, number], scale: number, ink: string, rule: CanvasFillRule = "evenodd"): Sheet {
  const x = Math.floor((box[0] - 4) * scale);
  const y = Math.floor((box[1] - 4) * scale);
  const w = Math.ceil((box[2] + 4) * scale) - x;
  const h = Math.ceil((box[3] + 4) * scale) - y;
  const paint = (ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null) => {
    if (!ctx) throw new Error("no 2d context");
    ctx.setTransform(scale, 0, 0, scale, -x, -y);
    ctx.fillStyle = ink;
    ctx.fill(path, rule);
  };
  if (typeof OffscreenCanvas === "function") {
    const sheet = new OffscreenCanvas(w, h);
    paint(sheet.getContext("2d"));
    return { image: sheet.transferToImageBitmap(), x, y };
  }
  const sheet = Object.assign(document.createElement("canvas"), { width: w, height: h });
  paint(sheet.getContext("2d"));
  return { image: sheet, x, y };
}

function makeArt(paths: Record<LayerFile, Path2D>, scale: number, ink: string): Art {
  const sheet = (name: LayerFile) => makeSheet(paths[name], boxes[name]!, scale, ink);
  return {
    scale,
    groundLines: sheet("ground-lines"),
    // The outline of the ground floor filled as the browser fills it for the still picture's mask.
    groundSolid: makeSheet(paths["ground-solid"], boxes["ground-solid"]!, scale, ink, "nonzero"),
    upperLines: sheet("upper-lines"),
    upperSolid: sheet("upper-solid"),
    guidesLower: sheet("guides-lower"),
    guidesUpper: sheet("guides-upper"),
    roofLines: paths["roof-lines"],
    roofSolid: paths["roof-solid"],
  };
}

function close(s: Sheet | null) {
  if (s && typeof ImageBitmap === "function" && s.image instanceof ImageBitmap) s.image.close();
}

function release(art: Art | null) {
  if (!art) return;
  for (const s of [art.groundLines, art.groundSolid, art.upperLines, art.upperSolid, art.guidesLower, art.guidesUpper]) close(s);
}

/* ——— The rings on the canvas ———
 * A picture of them made once for the size on screen, to the measure of the SVG in the still
 * picture, so the two agree dot for dot: the same centre, radii, dots, weight and fade (studio.css
 * is the one place they are set). In the canvas's device pixels. */
type RingGeometry = {
  cx: number;
  cy: number;
  rings: { r: number; width: number; alpha: number; dots: number }[];
  fade: [number, number] | null;
};

function measureRings(svg: SVGSVGElement, origin: DOMRect, k: number): RingGeometry {
  const box = svg.getBoundingClientRect();
  const rings = [...svg.querySelectorAll<SVGCircleElement>("circle")]
    .map((c) => {
      const style = getComputedStyle(c);
      return {
        r: (c.getBoundingClientRect().width / 2) * k,
        width: parseFloat(style.strokeWidth) * k,
        alpha: parseFloat(style.strokeOpacity),
        dots: Number(c.getAttribute("pathLength")),
      };
    })
    .filter(({ r, width, alpha, dots }) => r > 0 && width > 0 && alpha > 0 && dots > 0);
  // The fade on the left, where the screen is narrow: the first layer of the mask, when it is one.
  const mask = getComputedStyle(svg).maskImage;
  const stops = mask.startsWith("linear-gradient(to right") ? [...mask.matchAll(/(-?[\d.]+(?:e-?\d+)?)px/g)].slice(0, 2) : [];
  const fade = stops.length === 2 ? (stops.map((m) => (box.left + parseFloat(m[1]) - origin.left) * k) as [number, number]) : null;
  return { cx: ((box.left + box.right) / 2 - origin.left) * k, cy: ((box.top + box.bottom) / 2 - origin.top) * k, rings, fade };
}

function makeRings({ cx, cy, rings, fade }: RingGeometry, ink: string): Sheet | null {
  if (!rings.length) return null;
  const reach = Math.max(...rings.map(({ r, width }) => r + width)) + 2;
  const x = Math.floor(cx - reach);
  const y = Math.floor(cy - reach);
  const w = Math.ceil(cx + reach) - x;
  const h = Math.ceil(cy + reach) - y;
  const paint = (ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null) => {
    if (!ctx) throw new Error("no 2d context");
    ctx.strokeStyle = ink;
    ctx.lineCap = "round";
    // As the SVG draws a circle: from three o'clock, clockwise, a dot every 1/dots of the way round.
    for (const { r, width, alpha, dots } of rings) {
      ctx.globalAlpha = alpha;
      ctx.lineWidth = width;
      ctx.setLineDash([0, (2 * Math.PI * r) / dots]);
      ctx.beginPath();
      ctx.arc(cx - x, cy - y, r, 0, 2 * Math.PI);
      ctx.stroke();
    }
    if (fade) {
      const ramp = ctx.createLinearGradient(fade[0] - x, 0, fade[1] - x, 0);
      ramp.addColorStop(0, "rgb(0 0 0 / 0)");
      ramp.addColorStop(1, "rgb(0 0 0)");
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "destination-in";
      ctx.fillStyle = ramp;
      ctx.fillRect(0, 0, w, h);
    }
  };
  if (typeof OffscreenCanvas === "function") {
    const sheet = new OffscreenCanvas(w, h);
    paint(sheet.getContext("2d"));
    return { image: sheet.transferToImageBitmap(), x, y };
  }
  const sheet = Object.assign(document.createElement("canvas"), { width: w, height: h });
  paint(sheet.getContext("2d"));
  return { image: sheet, x, y };
}

/**
 * Draws the house at `t`, with `lift` units by which the whole drawing rises as the roof lands
 * (so the finished house stands on the middle of the stage), the rings with it. The corner of the
 * drawing lies at (ox, oy) on the canvas, which reaches round it to take in the rings.
 */
function draw(ctx: CanvasRenderingContext2D, art: Art, rings: Sheet | null, t: number, lift: number, ink: string, ox: number, oy: number) {
  const k = art.scale;
  const { ground, roof, guide } = pose(t);
  const px = (units: number) => Math.round(units * k);
  const up = -lift * roof; // the whole drawing
  const dy = px(up); // the upper floor, and the dashes fixed to it
  const gy = px(up - RISE * ground); // the ground floor
  // The roof's move: down DROP at the left guide, slanting about it, as one matrix.
  const slant = SHEAR * roof;
  const roofMatrix = (): [number, number, number, number, number, number] => [k, k * slant, 0, k, 0, px(up + DROP * roof - slant * ORIGIN_X)];
  const at = (s: Sheet, down: number) => ctx.drawImage(s.image, s.x, s.y + down);
  const strip = (path: Path2D, [x, top, bottom]: Run, from: number, down: number) => {
    const x0 = px(x - 8);
    const y0 = Math.round((top - 2 - from) * k) + down;
    path.rect(x0, y0, px(x + 8) - x0, Math.round((bottom + 2) * k) + down - y0);
  };

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // The rings, behind everything: they rise with the drawing.
  if (rings) at(rings, dy);
  ctx.setTransform(1, 0, 0, 1, ox, oy);

  // The ground floor, cut out of the rings, with the short guide inside it fading as it sets off.
  ctx.globalCompositeOperation = "destination-out";
  at(art.groundSolid, gy);
  ctx.globalCompositeOperation = "source-over";
  at(art.groundLines, gy);
  if (guide > 0) {
    const clip = new Path2D();
    strip(clip, groundGuide, 0, gy);
    ctx.save();
    ctx.clip(clip);
    ctx.globalAlpha = guide;
    at(art.guidesLower, gy);
    ctx.restore();
  }
  // The guides below the upper floor: the dashes hang from it; each is seen through a strip that
  // rises with the ground floor, so it shortens as the gap closes.
  if (ground < 1) {
    const clip = new Path2D();
    for (const run of lowerGuides) strip(clip, run, RISE, gy);
    ctx.save();
    ctx.clip(clip);
    at(art.guidesLower, dy);
    ctx.restore();
  }
  // The upper floor, cut out of what lies behind it.
  ctx.globalCompositeOperation = "destination-out";
  at(art.upperSolid, dy);
  ctx.globalCompositeOperation = "source-over";
  at(art.upperLines, dy);
  // The guides above it: seen through strips that come down with the roof.
  if (roof < 1) {
    const clip = new Path2D();
    const [a, b, , d, , f] = roofMatrix();
    for (const [x, top, bottom] of upperGuides) {
      const xs = [x - 8, x + 8];
      const y = (u: number, v: number) => b * u + d * v + f;
      clip.moveTo(a * xs[0], y(xs[0], top - 2));
      clip.lineTo(a * xs[1], y(xs[1], top - 2));
      clip.lineTo(a * xs[1], y(xs[1], bottom + 2));
      clip.lineTo(a * xs[0], y(xs[0], bottom + 2));
      clip.closePath();
    }
    ctx.save();
    ctx.clip(clip);
    at(art.guidesUpper, dy);
    ctx.restore();
  }
  // The roof, cut out of everything under it, then its lines.
  const roofAt = roofMatrix();
  ctx.setTransform(roofAt[0], roofAt[1], roofAt[2], roofAt[3], roofAt[4] + ox, roofAt[5] + oy);
  ctx.globalCompositeOperation = "destination-out";
  ctx.fill(art.roofSolid, "evenodd");
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = ink;
  ctx.fill(art.roofLines, "evenodd");
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

function useHouseCanvas(ref: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const house = ref.current;
    const artBox = house?.querySelector<HTMLElement>(".studio-house-art");
    const canvas = house?.querySelector<HTMLCanvasElement>(".studio-house-canvas");
    const ringSvg = house?.querySelector<SVGSVGElement>(".studio-rings");
    const scene = house?.closest<HTMLElement>(".studio-scene");
    const stage = scene?.firstElementChild;
    if (!house || !artBox || !canvas || !ringSvg || !scene || !stage) return;
    // Where the house does not come together, the still picture stays.
    if (!CSS.supports("animation-timeline: view()")) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    // The stage pins here (studio.css): the house comes together early in the pinned run.
    const pinned = window.matchMedia("(min-width: 64rem)");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const ink = getComputedStyle(house).getPropertyValue("--color-kapur").trim() || "#f3f3f3";

    let paths: Record<LayerFile, Path2D> | null = null;
    let loading: Promise<void> | null = null;
    let art: Art | null = null;
    let size: [number, number] = [0, 0];
    let near = false;
    let frame = 0;
    let drawn = "";
    let dead = false;
    let rings: Sheet | null = null;
    let ringsKey = "";

    const off = () => {
      house.removeAttribute("data-canvas");
      drawn = "";
    };

    const render = () => {
      frame = 0;
      if (dead || reduce.matches || !near || !paths) return;
      const [w, h] = size;
      if (!w || !h) return;
      // Device pixels per CSS pixel on the canvas, and where the drawing lies on it.
      const area = canvas.getBoundingClientRect();
      const box = artBox.getBoundingClientRect();
      if (!area.width || !box.width) return;
      const k = w / area.width;
      const scale = (box.width * k) / VIEW_W;
      const ox = Math.round((box.left - area.left) * k);
      const oy = Math.round((box.top - area.top) * k);
      if (!art || art.scale !== scale) {
        release(art);
        art = makeArt(paths, scale, ink);
        drawn = "";
      }
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        drawn = "";
      }
      const ringGeometry = measureRings(ringSvg, area, k);
      const ringKey = JSON.stringify(ringGeometry, (_, v: unknown) => (typeof v === "number" ? Math.round(v * 100) / 100 : v));
      if (ringKey !== ringsKey) {
        close(rings);
        rings = makeRings(ringGeometry, ink);
        ringsKey = ringKey;
        drawn = "";
      }
      const vh = document.documentElement.clientHeight;
      let t: number;
      let lift = 0;
      if (pinned.matches) {
        // Early in the pinned run (contain 4% to 34%), as the CSS pans are timed against it.
        const s = scene.getBoundingClientRect();
        const run = s.height - vh;
        t = clamp01((-s.top / run - 0.04) / 0.3);
        // So the finished house stands on the middle of the stage. The pan is sideways only, so
        // the drawing's height on the stage is its place in the layout.
        const st = stage.getBoundingClientRect();
        lift = ((box.top - st.top + (DONE_MID / VIEW_H) * box.height - st.height / 2) / box.height) * VIEW_H;
        lift = Math.max(-300, Math.min(300, lift));
      } else {
        // Elsewhere, as the drawing crosses the screen: whole by the time it reaches the middle.
        t = clamp01(((vh - box.top) / (vh + box.height) - 0.12) / 0.38);
      }
      const key = `${t.toFixed(4)} ${lift.toFixed(1)} ${w}x${h} ${ox},${oy}`;
      if (key === drawn) return;
      drawn = key;
      draw(ctx, art, rings, t, lift, ink, ox, oy);
      if (!house.hasAttribute("data-canvas")) house.setAttribute("data-canvas", "");
    };

    const schedule = () => {
      if (!frame && near && !reduce.matches) frame = requestAnimationFrame(render);
    };

    const load = () => {
      loading ??= loadPaths()
        .then((p) => {
          paths = p;
          schedule();
        })
        .catch(() => {
          // The still picture stays.
        });
    };

    // The canvas's own size in device pixels, so the drawing maps one to one onto the screen.
    const sizes = new ResizeObserver(([entry]) => {
      const device = entry.devicePixelContentBoxSize?.[0];
      const dpr = window.devicePixelRatio || 1;
      size = device
        ? [device.inlineSize, device.blockSize]
        : [Math.round(entry.contentRect.width * dpr), Math.round(entry.contentRect.height * dpr)];
      drawn = "";
      schedule();
    });
    try {
      sizes.observe(canvas, { box: "device-pixel-content-box" });
    } catch {
      sizes.observe(canvas);
    }

    // Within a screen and a half of the window: ready the drawing, and follow the scroll.
    const watch = new IntersectionObserver(
      ([entry]) => {
        near = entry.isIntersecting;
        if (near) {
          load();
          schedule();
        }
      },
      { rootMargin: "150% 0px" },
    );
    watch.observe(scene);

    const onMotion = () => {
      if (reduce.matches) off();
      else schedule();
    };
    const onPin = () => {
      drawn = "";
      schedule();
    };
    window.addEventListener("scroll", schedule, { passive: true });
    reduce.addEventListener("change", onMotion);
    pinned.addEventListener("change", onPin);

    return () => {
      dead = true;
      cancelAnimationFrame(frame);
      sizes.disconnect();
      watch.disconnect();
      window.removeEventListener("scroll", schedule);
      reduce.removeEventListener("change", onMotion);
      pinned.removeEventListener("change", onPin);
      release(art);
      close(rings);
      off();
    };
  }, [ref]);
}

export function StudioHouse() {
  const ref = useRef<HTMLDivElement>(null);
  useHouseCanvas(ref);
  return (
    <div ref={ref} className="studio-house" aria-hidden="true">
      <div className="studio-house-art">
        <Rings />
        <div className="studio-house-stack">
          <Layers />
        </div>
        <canvas className="studio-house-canvas" />
      </div>
    </div>
  );
}

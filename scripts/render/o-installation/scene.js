/*
 * scene.js
 *
 * The three.js scene for the ROUANG "O installation" hero still, and the
 * functions render.cjs calls from headless Chrome:
 *
 *   await window.setupScene()                       build geometry, load textures
 *   await window.renderStill({ view, samples, groups, clamp })
 *                                                   path-trace one pass (some light groups)
 *   await window.renderMatte({ view })              exact see-through matte
 *   window.getLayout({ view })                      projected geometry for the site
 *   await window.readResultChunk(offset, length)    fetch result bytes (base64)
 *
 * The scene (all units are metres; x to the right, y up, z toward the camera):
 *
 *   - A thick wall of exposed concrete whose front face is the plane z = 0.
 *     It has an opening shaped like the outer contour of the ROUANG O, made a
 *     little smaller so the frame's front plate overlaps the wall.
 *   - The frame, in cream plaster: a front plate in the exact O shape, standing
 *     proud of the wall with rounded edges, and behind it a lining that carries
 *     the inner contour back through the wall, so the opening is a short,
 *     sculpted tunnel.
 *   - A hidden warm LED strip on the back of the plate, near its outer edge,
 *     facing the wall. It washes a soft halo onto the concrete around the O.
 *   - A polished concrete floor at y = 0, meeting the wall in a small shadow
 *     reveal.
 *   - A side wall on the left with a tall window of horizontal louvres; a low,
 *     warm sun outside it lays diagonal bands of light across the left part of
 *     the back wall. A ceiling and a right wall close the room; its front is
 *     open to a dim evening sky.
 *   - Behind the camera, a large softly lit surface (the sunlit room behind
 *     the photographer), which gives the soft frontal fill.
 *   - Out of frame on the left, in that sunbeam, the branch of an indoor tree:
 *     only its leaf shadows show, across the wave of the frame.
 *   - Behind the wall, a large plane that glows with the client's sunset photo,
 *     so warm light really comes in through the opening and onto the inner
 *     faces of the frame; and, in the direction of the photo's own sun, a
 *     small distant sun that grazes the tunnel's inner faces.
 *
 * Nothing here depicts a real place.
 */

import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { WebGLPathTracer, ProceduralEquirectTexture } from 'three-gpu-pathtracer';

// ---------------------------------------------------------------------------
// Dimensions and look settings
// ---------------------------------------------------------------------------

export const DIM = {
  emblemWidth: 3.0, // outer width of the O
  emblemBase: 0.025, // lowest point of the O above the floor

  wallThickness: 0.5, // the concrete wall (front face z = 0, back face z = -0.5)
  gap: 0.085, // shadow gap between the wall face and the back of the plate
  plate: 0.06, // thickness of the front plate (front face at z = gap + plate)
  overlap: 0.05, // how far the plate overlaps the wall around the opening

  outerRound: 0.016, // radius of the rounded front outer edge
  outerBackRound: 0.006, // small round on the back outer edge
  innerRound: 0.025, // radius of the rounded lip where the plate turns into the tunnel
  exitRound: 0.012, // round at the back end of the tunnel
  // hairline V-joint where the front plate meets the tunnel lining, just
  // behind the rounded lip: width along the tunnel and depth (m)
  joint: { width: 0.003, depth: 0.002 },

  ledInset: 0.035, // LED strip: distance in from the plate's outer edge
  ledWidth: 0.012, // LED strip: width of the glowing face
  ledDrop: 0.003, // LED strip: stands this far off the back of the plate

  // shadow reveal where the wall meets the floor: height and depth (m)
  reveal: { height: 0.012, depth: 0.008 },

  // the room: inner face of the left wall, right wall, ceiling height, open front
  room: { left: -7.5, leftThickness: 0.3, right: 7.5, ceiling: 7.2, front: 14 },
  // tall window in the left wall (z range, sill and head heights) with
  // horizontal louvres; the sun through it lands on the left of the back wall.
  // Its far jamb throws its shadow off the left of the frame and its head the
  // diagonal upper edge of the lit area, all the way down to the floor (the
  // window runs far enough toward the camera that no jamb edge shows).
  window: { z0: 3.9, z1: 11.6, y0: 0.5, y1: 4.37, pitch: 0.5, slatDepth: 0.26, slatThick: 0.045 },

  sceneryZ: -12, // the glowing scenery plane behind the wall
};
DIM.plateFront = DIM.gap + DIM.plate;

export const LOOK = {
  // Low golden-hour sun outside the louvred window (direction of travel).
  // Low (17 degrees) so it reads as the same late sun as the one setting in
  // the view ahead, and coming in at a raking angle that shows the
  // concrete's relief.
  sunElevation: 17, // degrees above the horizon
  sunAzimuth: 48, // degrees from +x toward the wall (-z)
  sunAngularDiameter: 0.6, // degrees; a little larger than the real sun (0.53), as through haze
  sunIrradiance: 7.4, // on a surface facing the sun (scene units)
  sunColor: [1.0, 0.58, 0.3],

  // The indoor tree's branch: how far up the sunbeam it sits from the wave
  // (m). Nearer gives crisper leaf shadows, but the leaves must stay out of
  // frame and out of the floor's reflection.
  branchDistance: 4.3,

  // Evening sky seen through the open front and the window: neutral, cool
  // overhead, warm only low toward the sun.
  skyIntensity: 0.65,

  // The room behind the photographer, lit by the sky through its open
  // front: a large, dim, cool (blue evening sky) surface behind the camera,
  // out of both frames and out of the floor's reflection. It is the soft
  // frontal fill every interior photograph has, and balances the sun's warm
  // bounce light so the shadows stay a neutral warm grey.
  fillSize: [10, 4], // m, width x height
  fillCenter: [0, 2.3, 13.8],
  fillColor: [0.85, 0.95, 1.07],
  fillRadiance: 1.1,

  // The glowing scenery photo behind the wall: about as bright as the
  // photo itself looks through the opening on the site, so the floor's
  // reflection of it agrees with the view.
  sceneryIntensity: 0.6,

  // The photo's own sun, low over the lake straight ahead: a small, distant
  // sun in that direction (as seen from each view's camera), so the
  // tunnel's inner faces facing it catch a warm graze of light.
  viewSunIrradiance: 2.2,
  viewSunColor: [1.0, 0.6, 0.32],
  viewSunAngularDiameter: 0.6,

  // Hidden LED strip (about 2700 K, as photographed with a warm daylight
  // balance). It is modelled as a chain of small rectangular area lights
  // that follow the outer contour behind the plate, so the path tracer can
  // aim shadow rays at it (a tiny glowing surface on its own would only be
  // found by chance and stay noisy). They face the wall, tilted outward,
  // like a strip in an angled aluminium profile, so the light spreads into
  // a soft wash rather than a bright outline.
  ledColor: [1.0, 0.62, 0.33],
  ledRadiance: 40, // radiance of the diffuser face (scene units)
  ledSegments: 56, // straight pieces around the contour (about 17 cm each)
  ledTilt: 45, // degrees the strip is turned outward from facing the wall
};

/*
 * The client's scenery photo, and how the site places it behind the opening
 * (render.cjs writes this rule into o-installation.json):
 *   - scale it to cover the frame, then to `scale` of that cover size;
 *   - centre it horizontally at 0.5 + `offsetX` of the frame width;
 *   - place it vertically so the photo's horizon (`horizon`, a share of the
 *     photo's height) lies on the view's `horizon` row, which is also the
 *     camera's eye level: the room's perspective and the landscape's then
 *     share one vanishing line, as they would in one photograph.
 * The offsets keep the photo's sun clear of the wave lip and give each view
 * a natural crop: sun, mountains, lake, the branch at the top left, the white
 * curved wall at the right.
 */
export const PHOTO = {
  width: 1600,
  height: 900,
  horizon: 0.739, // the lake's horizon, as a share of the photo height
  sun: [0.3395, 0.6187], // the sun's centre, as shares of the photo size
  placement: {
    desktop: { scale: 0.72, offsetX: 0.047 },
    portrait: { scale: 0.4, offsetX: 0.08 },
  },
};

// The two framings of the same scene.
export const VIEWS = {
  desktop: {
    width: 2560,
    height: 1440,
    focalMm: 40, // full-frame equivalent, the frame's long side = 36 mm
    fit: 'height', // the O's outer height fills `fill` of the frame height
    fill: 0.745,
    floorLine: 0.87, // where the wall meets the floor, from the top of the frame
    // the camera's eye level (the horizon), from the top of the frame; this
    // sets the camera height (about 0.87 m)
    horizon: 0.654,
  },
  portrait: {
    width: 1290,
    height: 2796,
    focalMm: 40,
    fit: 'width', // the O's outer width fills `fill` of the frame width
    fill: 0.86,
    // The O stands on the floor and is 39% of the frame tall at this width,
    // so it cannot sit above the centre with the floor in the lowest 14-18%.
    // The floor takes the lowest 23% here, which puts the O's centre at
    // about 57% from the top: a balance between the two.
    floorLine: 0.77,
    horizon: 0.661, // camera height about 0.84 m
  },
};

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const signedArea = (pts) => {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[(i + 1) % pts.length];
    a += p.x * q.y - q.x * p.y;
  }
  return a / 2;
};

// ---------------------------------------------------------------------------
// The emblem: read mark.svg and turn its two contours into metres
// ---------------------------------------------------------------------------

/*
 * A closed contour with, for every point, the unit tangent, the unit normal
 * pointing AWAY from the solid frame material (outward on the outer contour,
 * into the opening on the inner contour) and the arc length so far.
 */
function makeContour(points) {
  const n = points.length;
  const tan = [], nrm = [], len = [];
  let total = 0;
  for (let i = 0; i < n; i++) {
    const a = points[(i - 1 + n) % n], b = points[(i + 1) % n];
    const t = new THREE.Vector2(b.x - a.x, b.y - a.y).normalize();
    tan.push(t);
    nrm.push(new THREE.Vector2(t.y, -t.x));
    len.push(total);
    total += points[i].distanceTo(points[(i + 1) % n]);
  }
  return { pts: points, tan, nrm, len, total, n };
}

// Points of a contour pushed `d` metres along its normal (negative = into the material).
const offsetPts = (c, d) => c.pts.map((p, i) => new THREE.Vector2(p.x + c.nrm[i].x * d, p.y + c.nrm[i].y * d));

let EMBLEM = null;

async function loadEmblem() {
  const svgText = await (await fetch('./mark.svg')).text();
  const data = new SVGLoader().parse(svgText);
  const shapes = SVGLoader.createShapes(data.paths[0]);
  // The mark is one shape with one hole. If the loader ever reports it as two
  // separate shapes, the larger one is the outer contour.
  let outerCurve, innerCurve;
  if (shapes.length === 1 && shapes[0].holes.length === 1) {
    outerCurve = shapes[0];
    innerCurve = shapes[0].holes[0];
  } else {
    const parts = data.paths[0].subPaths.slice().sort((a, b) => Math.abs(signedArea(b.getPoints(64))) - Math.abs(signedArea(a.getPoints(64))));
    outerCurve = parts[0];
    innerCurve = parts[1];
  }
  const N = 2400; // samples per contour (about 4 mm apart at 3 m)
  const sample = (curve) => {
    const p = curve.getSpacedPoints(N);
    while (p.length > 1 && p[p.length - 1].distanceTo(p[0]) < 1e-6) p.pop();
    return p;
  };
  const outerSvg = sample(outerCurve);
  const innerSvg = sample(innerCurve);

  // SVG units -> metres. The SVG y axis points down, so flip it.
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of outerSvg) {
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
  }
  const scale = DIM.emblemWidth / (maxX - minX);
  const cx = (minX + maxX) / 2;
  const toWorld = (p) => new THREE.Vector2((p.x - cx) * scale, (maxY - p.y) * scale + DIM.emblemBase);

  let outer = outerSvg.map(toWorld);
  let inner = innerSvg.map(toWorld);
  let outerSvgOrdered = outerSvg, innerSvgOrdered = innerSvg;
  // outer contour counter-clockwise, inner contour clockwise (seen from the camera)
  if (signedArea(outer) < 0) { outer.reverse(); outerSvgOrdered = outerSvg.slice().reverse(); }
  if (signedArea(inner) > 0) { inner.reverse(); innerSvgOrdered = innerSvg.slice().reverse(); }

  EMBLEM = {
    outer: makeContour(outer),
    inner: makeContour(inner),
    svg: {
      viewBox: data.xml ? data.xml.getAttribute('viewBox') : null,
      scale, cx, maxY, // world = ((x - cx) * scale, (maxY - y) * scale + base)
      outer: outerSvgOrdered,
      inner: innerSvgOrdered,
    },
    heightWorld: (maxY - minY) * scale,
  };
  return EMBLEM;
}

// ---------------------------------------------------------------------------
// Geometry builders
// ---------------------------------------------------------------------------

/*
 * Collects triangles with position, smooth normal, uv and tangent, and
 * produces one BufferGeometry. Triangles are wound so their geometric normal
 * agrees with the shading normal.
 */
class MeshBuilder {
  /*
   * `shadeFn`, if given, maps a vertex position to a grey multiplier stored
   * as its vertex colour (used for the faint grime near the floor).
   */
  constructor(shadeFn = null) {
    this.pos = []; this.nor = []; this.uv = []; this.tan = []; this.idx = []; this.col = [];
    this.shadeFn = shadeFn;
  }
  vertex(p, n, uv, t) {
    this.pos.push(p.x, p.y, p.z);
    this.nor.push(n.x, n.y, n.z);
    this.uv.push(uv.x, uv.y);
    this.tan.push(t.x, t.y, t.z, t.w);
    if (this.shadeFn) {
      const s = this.shadeFn(p);
      this.col.push(s, s, s, 1);
    }
    return this.pos.length / 3 - 1;
  }
  tri(a, b, c) {
    const P = (i) => new THREE.Vector3(this.pos[i * 3], this.pos[i * 3 + 1], this.pos[i * 3 + 2]);
    const N = (i) => new THREE.Vector3(this.nor[i * 3], this.nor[i * 3 + 1], this.nor[i * 3 + 2]);
    const pa = P(a), pb = P(b), pc = P(c);
    const fn = new THREE.Vector3().subVectors(pb, pa).cross(new THREE.Vector3().subVectors(pc, pa));
    if (fn.lengthSq() < 1e-20) return;
    const sn = N(a).add(N(b)).add(N(c));
    if (fn.dot(sn) < 0) this.idx.push(a, c, b);
    else this.idx.push(a, b, c);
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setAttribute('tangent', new THREE.Float32BufferAttribute(this.tan, 4));
    // RGBA: the path tracer merges colour attributes as four components
    if (this.shadeFn) g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 4));
    g.setIndex(this.idx);
    return g;
  }
}

/*
 * Sweep a cross-section profile along a contour. Each profile row is
 * { off, z, no, nz }: offset along the contour normal (m), height z (m), and
 * the surface normal in the (contour normal, z) plane. UVs follow arc length
 * along the contour (u) and along the profile (v), in metres / `uvScale`,
 * starting at v = `vBase`.
 */
function sweep(builder, c, profile, uvScale, vBase = 0) {
  const m = profile.length;
  const vAcc = [0];
  for (let j = 1; j < m; j++) {
    vAcc.push(vAcc[j - 1] + Math.hypot(profile[j].off - profile[j - 1].off, profile[j].z - profile[j - 1].z));
  }
  const rows = [];
  for (let i = 0; i <= c.n; i++) {
    const k = i % c.n;
    const p = c.pts[k], nr = c.nrm[k], tg = c.tan[k];
    const u = (i === c.n ? c.total : c.len[k]) / uvScale;
    const col = [];
    for (let j = 0; j < m; j++) {
      const pr = profile[j];
      const pos = new THREE.Vector3(p.x + nr.x * pr.off, p.y + nr.y * pr.off, pr.z);
      const nor = new THREE.Vector3(nr.x * pr.no, nr.y * pr.no, pr.nz).normalize();
      const T = new THREE.Vector3(tg.x, tg.y, 0);
      // direction of increasing v (along the profile)
      const jn = Math.min(j + 1, m - 1), jp = Math.max(j - 1, 0);
      const B = new THREE.Vector3(
        nr.x * (profile[jn].off - profile[jp].off),
        nr.y * (profile[jn].off - profile[jp].off),
        profile[jn].z - profile[jp].z,
      );
      const w = new THREE.Vector3().crossVectors(nor, T).dot(B) >= 0 ? 1 : -1;
      col.push(builder.vertex(pos, nor, new THREE.Vector2(u, vBase + vAcc[j] / uvScale), new THREE.Vector4(T.x, T.y, T.z, w)));
    }
    rows.push(col);
  }
  for (let i = 0; i < c.n; i++) {
    for (let j = 0; j < m - 1; j++) {
      const a = rows[i][j], b = rows[i + 1][j], cc = rows[i + 1][j + 1], d = rows[i][j + 1];
      builder.tri(a, b, cc);
      builder.tri(a, cc, d);
    }
  }
}

/*
 * A flat face at height z, facing +z or -z, covering `contour` minus `holes`
 * (arrays of Vector2). UVs are planar: (x - ox) / sx, (y - oy) / sy.
 */
function planarFace(builder, contour, holes, z, facing, uvMap) {
  const tris = THREE.ShapeUtils.triangulateShape(contour.slice(), holes.map((h) => h.slice()));
  const all = contour.concat(...holes);
  const n = new THREE.Vector3(0, 0, facing);
  // tangent along +x; bitangent should point along +y (increasing v)
  const w = new THREE.Vector3().crossVectors(n, new THREE.Vector3(1, 0, 0)).y >= 0 ? 1 : -1;
  const base = all.map((p) => builder.vertex(new THREE.Vector3(p.x, p.y, z), n, uvMap(p), new THREE.Vector4(1, 0, 0, w)));
  for (const t of tris) builder.tri(base[t[0]], base[t[1]], base[t[2]]);
}

// An axis-aligned box made of 6 faces (used for room surfaces and slats).
function box(builder, min, max, uvScale = 4) {
  const faces = [
    { n: [1, 0, 0], u: [0, 0, -1], v: [0, 1, 0] },
    { n: [-1, 0, 0], u: [0, 0, 1], v: [0, 1, 0] },
    { n: [0, 1, 0], u: [1, 0, 0], v: [0, 0, -1] },
    { n: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1] },
    { n: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] },
    { n: [0, 0, -1], u: [-1, 0, 0], v: [0, 1, 0] },
  ];
  const c = new THREE.Vector3().addVectors(min, max).multiplyScalar(0.5);
  const h = new THREE.Vector3().subVectors(max, min).multiplyScalar(0.5);
  for (const f of faces) {
    const N = new THREE.Vector3(...f.n), U = new THREE.Vector3(...f.u), V = new THREE.Vector3(...f.v);
    const corner = (su, sv) => {
      const p = c.clone()
        .add(new THREE.Vector3(N.x * h.x, N.y * h.y, N.z * h.z))
        .add(new THREE.Vector3(U.x * h.x * su, U.y * h.y * su, U.z * h.z * su))
        .add(new THREE.Vector3(V.x * h.x * sv, V.y * h.y * sv, V.z * h.z * sv));
      const uv = new THREE.Vector2(p.dot(U) / uvScale, p.dot(V) / uvScale);
      const w = new THREE.Vector3().crossVectors(N, U).dot(V) >= 0 ? 1 : -1;
      return builder.vertex(p, N, uv, new THREE.Vector4(U.x, U.y, U.z, w));
    };
    const a = corner(-1, -1), b = corner(1, -1), cc = corner(1, 1), d = corner(-1, 1);
    builder.tri(a, b, cc);
    builder.tri(a, cc, d);
  }
}

// A thin square rod between two points (four side faces), for twigs.
function rod(builder, p, q, thickness) {
  const axis = new THREE.Vector3().subVectors(q, p);
  const a = new THREE.Vector3(0, 1, 0).cross(axis);
  if (a.lengthSq() < 1e-8) a.set(1, 0, 0);
  a.normalize().multiplyScalar(thickness / 2);
  const b = new THREE.Vector3().crossVectors(axis, a).normalize().multiplyScalar(thickness / 2);
  const sides = [[a, b], [b, a.clone().negate()], [a.clone().negate(), b.clone().negate()], [b.clone().negate(), a]];
  const t = axis.clone().normalize();
  for (const [s0, s1] of sides) {
    const n = s0.clone().add(s1).normalize();
    const T = new THREE.Vector4(t.x, t.y, t.z, 1);
    const v0 = builder.vertex(p.clone().add(s0), n, new THREE.Vector2(0, 0), T);
    const v1 = builder.vertex(q.clone().add(s0), n, new THREE.Vector2(1, 0), T);
    const v2 = builder.vertex(q.clone().add(s1), n, new THREE.Vector2(1, 1), T);
    const v3 = builder.vertex(p.clone().add(s1), n, new THREE.Vector2(0, 1), T);
    builder.tri(v0, v1, v2);
    builder.tri(v0, v2, v3);
  }
}

// Quarter-round profile rows from angle 0 to 90 degrees.
function quarter(steps, fn) {
  const rows = [];
  for (let s = 0; s <= steps; s++) rows.push(fn((s / steps) * Math.PI * 0.5));
  return rows;
}

// ---------------------------------------------------------------------------
// Scene construction
// ---------------------------------------------------------------------------

let MANIFEST = null;
const loader = new THREE.TextureLoader();

async function loadTex(file, srgb) {
  const t = await loader.loadAsync(file);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 1;
  t.generateMipmaps = false;
  t.minFilter = THREE.LinearFilter;
  return t;
}

async function makeMaterials() {
  MANIFEST = await (await fetch('./textures/manifest.json')).json();
  const [wa, wr, wn, fa, fr, fn, pa, pr, pn, scenery] = await Promise.all([
    loadTex('./textures/wall_albedo.jpg', true),
    loadTex('./textures/wall_roughness.png', false),
    loadTex('./textures/wall_normal.png', false),
    loadTex('./textures/floor_albedo.jpg', true),
    loadTex('./textures/floor_roughness.png', false),
    loadTex('./textures/floor_normal.png', false),
    loadTex('./textures/plaster_albedo.jpg', true),
    loadTex('./textures/plaster_roughness.png', false),
    loadTex('./textures/plaster_normal.png', false),
    loadTex('./textures/scenery_extended.jpg', true),
  ]);
  // The normal maps store exaggerated slopes (see NORMAL_BOOST in
  // textures.cjs); dividing by the boost gives the height field's true
  // relief, times the strength wanted here.
  const boost = MANIFEST.normalBoost || { wall: 1, floor: 1, plaster: 1 };
  const nScale = (m, strength) => new THREE.Vector2(strength / boost[m], strength / boost[m]);

  const mats = {
    wall: new THREE.MeshStandardMaterial({
      map: wa, roughnessMap: wr, normalMap: wn, roughness: 1, metalness: 0,
      normalScale: nScale('wall', 1.6), side: THREE.DoubleSide,
    }),
    // the roughness map holds the floor's final roughness: satin polished
    // concrete (about 0.2) broken up by burnish clouds, wear and scuffs
    floor: new THREE.MeshPhysicalMaterial({
      map: fa, roughnessMap: fr, normalMap: fn, roughness: 1, metalness: 0, ior: 1.5,
      normalScale: nScale('floor', 1.0), side: THREE.DoubleSide,
    }),
    // the flat front face of the plate (its faint grime near the floor is
    // in the texture) ...
    plaster: new THREE.MeshStandardMaterial({
      map: pa, roughnessMap: pr, normalMap: pn, roughness: 1, metalness: 0,
      normalScale: nScale('plaster', 1.0), side: THREE.DoubleSide,
    }),
    // ... and its rounded edges and the tunnel, which get the same grime
    // from vertex colours
    plasterSwept: new THREE.MeshStandardMaterial({
      map: pa, roughnessMap: pr, normalMap: pn, roughness: 1, metalness: 0, vertexColors: true,
      normalScale: nScale('plaster', 1.0), side: THREE.DoubleSide,
    }),
    // plain concrete for room surfaces the camera never sees directly
    room: new THREE.MeshStandardMaterial({ color: new THREE.Color().setRGB(0.34, 0.33, 0.32), roughness: 0.9, side: THREE.DoubleSide }),
    slat: new THREE.MeshStandardMaterial({ color: new THREE.Color().setRGB(0.22, 0.19, 0.16), roughness: 0.7, side: THREE.DoubleSide }),
    // the opal diffuser of the LED strip; its light comes from the area
    // lights placed just in front of it (see buildLedLights)
    led: new THREE.MeshStandardMaterial({ color: new THREE.Color().setRGB(0.7, 0.68, 0.64), roughness: 0.6, side: THREE.DoubleSide }),
    ledHousing: new THREE.MeshStandardMaterial({ color: new THREE.Color().setRGB(0.05, 0.05, 0.05), roughness: 0.5, side: THREE.DoubleSide }),
    scenery: new THREE.MeshStandardMaterial({
      color: 0x000000, roughness: 1, side: THREE.DoubleSide,
      emissive: 0xffffff, emissiveMap: scenery, emissiveIntensity: LOOK.sceneryIntensity,
    }),
    leaf: new THREE.MeshStandardMaterial({ color: new THREE.Color().setRGB(0.09, 0.12, 0.03), roughness: 0.6, side: THREE.DoubleSide }),
    twig: new THREE.MeshStandardMaterial({ color: new THREE.Color().setRGB(0.07, 0.05, 0.04), roughness: 0.8, side: THREE.DoubleSide }),
  };
  // the scenery is cut out of the beauty pass by the path tracer's "matte"
  // flag: camera rays that hit it return transparent black, every other ray
  // still sees it glow (so it still lights the tunnel and shows in reflections)
  mats.scenery.matte = true;
  // ... and it does not block shadow rays, so the photo's own sun (a
  // distant light far behind it) still reaches the tunnel through it
  mats.scenery.castShadow = false;
  return mats;
}

const domainUV = (d) => (p) => new THREE.Vector2((p.x - d.originX) / d.width, (p.y - d.originY) / d.height);

/*
 * Faint grime on the frame's lowest 30 cm (dust and mop splash near the
 * floor): a grey multiplier by height. The flat front face has the same
 * gradient baked into its texture (textures.cjs).
 */
const grimeAt = (p) => {
  const t = Math.min(1, Math.max(0, (p.y - DIM.emblemBase - 0.0) / 0.31));
  return 0.93 + 0.07 * t * t * (3 - 2 * t);
};

function buildFrame(mats) {
  const { outer, inner } = EMBLEM;
  const D = DIM;
  const zF = D.plateFront, zB = D.gap, T = D.wallThickness;
  const pd = MANIFEST.domains.plaster;
  const uvS = pd.width;
  // The swept surfaces take their texture from rows near the top of the
  // plaster texture (v from 0.8), clear of the grime baked into its bottom.
  const vB = 0.8;
  const flat = new MeshBuilder();
  const plaster = new MeshBuilder(grimeAt);
  const led = new MeshBuilder();
  const housing = new MeshBuilder();

  // 1. front face of the plate: between the two rounded edges
  planarFace(flat, offsetPts(outer, -D.outerRound), [offsetPts(inner, -D.innerRound)], zF, 1, domainUV(pd));

  // 2. outer edge: front round, side, back round
  const ro = D.outerRound, rb = D.outerBackRound;
  const outerProfile = [
    ...quarter(8, (a) => ({ off: -ro + ro * Math.sin(a), z: zF - ro + ro * Math.cos(a), no: Math.sin(a), nz: Math.cos(a) })),
    ...quarter(4, (a) => ({ off: -rb + rb * Math.cos(a), z: zB + rb - rb * Math.sin(a), no: Math.cos(a), nz: -Math.sin(a) })),
  ];
  sweep(plaster, outer, outerProfile, uvS, vB);

  // 3. back of the plate (facing the wall), split around the LED strip
  const l0 = -(rb + D.ledInset), l1 = l0 - D.ledWidth;
  const backRow = (off) => ({ off, z: zB, no: 0, nz: -1 });
  sweep(plaster, outer, [backRow(-rb), backRow(l0 + 0.003)], uvS, vB);
  sweep(plaster, outer, [backRow(l1 - 0.003), backRow(-D.overlap)], uvS, vB);
  // the LED strip: a small dark channel with a glowing face just off the plate
  const zl = zB - D.ledDrop;
  sweep(housing, outer, [backRow(l0 + 0.003), { off: l0 + 0.003, z: zl, no: 1, nz: 0 }], uvS);
  sweep(housing, outer, [{ off: l1 - 0.003, z: zl, no: -1, nz: 0 }, backRow(l1 - 0.003)], uvS);
  sweep(housing, outer, [{ off: l0 + 0.003, z: zl, no: 0, nz: -1 }, { off: l0, z: zl, no: 0, nz: -1 }], uvS);
  sweep(housing, outer, [{ off: l1, z: zl, no: 0, nz: -1 }, { off: l1 - 0.003, z: zl, no: 0, nz: -1 }], uvS);
  sweep(led, outer, [{ off: l0, z: zl, no: 0, nz: -1 }, { off: l1, z: zl, no: 0, nz: -1 }], uvS);

  // 4. outside of the lining, visible only inside the shadow gap
  sweep(plaster, outer, [{ off: -D.overlap, z: zB, no: 1, nz: 0 }, { off: -D.overlap, z: -T, no: 1, nz: 0 }], uvS, vB);

  // 5. the inner surface: rounded lip, a hairline V-joint where the plate
  //    meets the tunnel lining, the tunnel through the wall, rounded exit.
  //    (Repeated rows with different normals give the joint sharp creases.)
  const ri = D.innerRound, re = D.exitRound;
  const jz = zF - ri - 0.006; // the joint, 6 mm behind the end of the lip
  const jw = D.joint.width, jd = D.joint.depth;
  const jn = Math.hypot(jw / 2, jd);
  const wall1 = { no: jw / 2 / jn, nz: jd / jn }; // the joint's two faces
  const wall2 = { no: jw / 2 / jn, nz: -jd / jn };
  const innerProfile = [
    ...quarter(10, (a) => ({ off: -ri + ri * Math.sin(a), z: zF - ri + ri * Math.cos(a), no: Math.sin(a), nz: Math.cos(a) })),
    { off: 0, z: jz + jw / 2, no: 1, nz: 0 },
    { off: 0, z: jz + jw / 2, ...wall2 },
    { off: -jd, z: jz, ...wall2 },
    { off: -jd, z: jz, ...wall1 },
    { off: 0, z: jz - jw / 2, ...wall1 },
    { off: 0, z: jz - jw / 2, no: 1, nz: 0 },
    ...quarter(6, (a) => ({ off: -re + re * Math.cos(a), z: -T + re - re * Math.sin(a), no: Math.cos(a), nz: -Math.sin(a) })),
  ];
  sweep(plaster, inner, innerProfile, uvS, vB);

  // 6. back face of the frame, flush with the back of the wall
  planarFace(flat, offsetPts(outer, -D.overlap), [offsetPts(inner, -re)], -T, -1, domainUV(pd));

  const group = new THREE.Group();
  group.add(new THREE.Mesh(flat.build(), mats.plaster));
  group.add(new THREE.Mesh(plaster.build(), mats.plasterSwept));
  group.add(new THREE.Mesh(led.build(), mats.led));
  group.add(new THREE.Mesh(housing.build(), mats.ledHousing));
  return group;
}

/*
 * The light of the hidden LED strip: one small rectangular area light per
 * straight piece of the strip, centred on the strip, a hair in front of the
 * diffuser, facing the wall and turned outward by LOOK.ledTilt. The camera
 * never sees them directly (the plate hides them, and the path tracer does
 * not draw area lights for camera rays); it sees the light they put on the
 * wall around the O.
 */
function buildLedLights() {
  const c = EMBLEM.outer;
  const D = DIM;
  const N = LOOK.ledSegments;
  const centreOff = -(D.outerBackRound + D.ledInset + D.ledWidth / 2);
  const pts = offsetPts(c, centreOff);
  const tilt = THREE.MathUtils.degToRad(LOOK.ledTilt);
  const h = D.ledWidth * 0.9;
  // just in front of the diffuser, low enough that the tilted rectangle stays clear of it
  const zc = D.gap - D.ledDrop - 0.001 - (h / 2) * Math.sin(tilt);
  const color = new THREE.Color().setRGB(...LOOK.ledColor);
  const lights = [];
  for (let k = 0; k < N; k++) {
    const i0 = Math.round((k * c.n) / N) % c.n;
    const i1 = Math.round(((k + 1) * c.n) / N) % c.n;
    const a = pts[i0], b = pts[i1];
    const len = a.distanceTo(b);
    const t = new THREE.Vector3(b.x - a.x, b.y - a.y, 0).normalize();
    const out = new THREE.Vector3(t.y, -t.x, 0); // outward (the outer contour runs counter-clockwise)
    const emit = new THREE.Vector3(0, 0, -1).multiplyScalar(Math.cos(tilt)).addScaledVector(out, Math.sin(tilt));
    // light basis: x along the strip, local -z = direction of emission
    const zAxis = emit.clone().negate();
    const yAxis = new THREE.Vector3().crossVectors(zAxis, t);
    const light = new THREE.RectAreaLight(color, LOOK.ledRadiance, len * 1.01, h);
    light.position.set((a.x + b.x) / 2, (a.y + b.y) / 2, zc);
    light.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(t, yAxis, zAxis));
    light.userData.group = 'led';
    lights.push(light);
  }
  return lights;
}

function buildRoom(mats) {
  const D = DIM, R = D.room, W = D.window, T = D.wallThickness;
  const group = new THREE.Group();
  const wd = MANIFEST.domains.wall, fd = MANIFEST.domains.floor;

  // back wall: front and back faces with the opening; top and ends as boxes
  const wall = new MeshBuilder();
  const x0 = R.left - R.leftThickness, x1 = R.right, top = R.ceiling;
  const rh = D.reveal.height, rd = D.reveal.depth;
  const rect = [new THREE.Vector2(x0, rh), new THREE.Vector2(x1, rh), new THREE.Vector2(x1, top), new THREE.Vector2(x0, top)];
  const opening = offsetPts(EMBLEM.outer, -D.overlap);
  planarFace(wall, rect, [opening], 0, 1, domainUV(wd));
  // the shadow reveal along the floor: the wall's face steps back `rd` for
  // its lowest `rh`, so the wall stands on a thin dark line instead of a
  // ruler-straight crease
  const n0 = new THREE.Vector3(0, -1, 0), nb = new THREE.Vector3(0, 0, 1);
  const quad = (p, n, t) => p.map((q) => wall.vertex(q, n, domainUV(wd)(new THREE.Vector2(q.x, q.y)), t));
  const under = quad([new THREE.Vector3(x0, rh, 0), new THREE.Vector3(x1, rh, 0), new THREE.Vector3(x1, rh, -rd), new THREE.Vector3(x0, rh, -rd)], n0, new THREE.Vector4(1, 0, 0, 1));
  wall.tri(under[0], under[1], under[2]);
  wall.tri(under[0], under[2], under[3]);
  const back = quad([new THREE.Vector3(x0, -0.01, -rd), new THREE.Vector3(x1, -0.01, -rd), new THREE.Vector3(x1, rh, -rd), new THREE.Vector3(x0, rh, -rd)], nb, new THREE.Vector4(1, 0, 0, 1));
  wall.tri(back[0], back[1], back[2]);
  wall.tri(back[0], back[2], back[3]);
  group.add(new THREE.Mesh(wall.build(), mats.wall));
  const wallBack = new MeshBuilder();
  const rectBack = [new THREE.Vector2(x0, 0), new THREE.Vector2(x1, 0), new THREE.Vector2(x1, top), new THREE.Vector2(x0, top)];
  planarFace(wallBack, rectBack, [opening], -T, -1, domainUV(wd));
  box(wallBack, new THREE.Vector3(x1, 0, -T), new THREE.Vector3(x1 + 0.3, top, 0));
  group.add(new THREE.Mesh(wallBack.build(), mats.room));

  // polished floor, starting under the wall
  const floor = new MeshBuilder();
  const fz0 = -0.2, fz1 = R.front;
  const n = new THREE.Vector3(0, 1, 0);
  const fuv = (x, z) => new THREE.Vector2((x - fd.originX) / fd.width, (z - fd.originY) / fd.height);
  // tangent +x; increasing v is +z; cross(n, t) = -z so w = -1
  const a = floor.vertex(new THREE.Vector3(x0, 0, fz0), n, fuv(x0, fz0), new THREE.Vector4(1, 0, 0, -1));
  const b = floor.vertex(new THREE.Vector3(x1, 0, fz0), n, fuv(x1, fz0), new THREE.Vector4(1, 0, 0, -1));
  const c = floor.vertex(new THREE.Vector3(x1, 0, fz1), n, fuv(x1, fz1), new THREE.Vector4(1, 0, 0, -1));
  const d = floor.vertex(new THREE.Vector3(x0, 0, fz1), n, fuv(x0, fz1), new THREE.Vector4(1, 0, 0, -1));
  floor.tri(a, b, c);
  floor.tri(a, c, d);
  group.add(new THREE.Mesh(floor.build(), mats.floor));

  // left wall with a tall window of horizontal louvres, and the ceiling
  const room = new MeshBuilder();
  const lx0 = R.left - R.leftThickness, lx1 = R.left;
  box(room, new THREE.Vector3(lx0, 0, -T), new THREE.Vector3(lx1, W.y0, R.front)); // below the sill
  box(room, new THREE.Vector3(lx0, W.y1, -T), new THREE.Vector3(lx1, top, R.front)); // above the head
  box(room, new THREE.Vector3(lx0, W.y0, -T), new THREE.Vector3(lx1, W.y1, W.z0)); // left of the window
  box(room, new THREE.Vector3(lx0, W.y0, W.z1), new THREE.Vector3(lx1, W.y1, R.front)); // right of it
  box(room, new THREE.Vector3(lx0, top, -T), new THREE.Vector3(x1 + 0.3, top + 0.3, R.front)); // ceiling
  box(room, new THREE.Vector3(x1, 0, -T), new THREE.Vector3(x1 + 0.3, top, R.front)); // right wall
  group.add(new THREE.Mesh(room.build(), mats.room));

  const slats = new MeshBuilder();
  for (let y = W.y0 + W.pitch / 2; y < W.y1 - 0.01; y += W.pitch) {
    box(slats, new THREE.Vector3(lx0 + 0.04, y - W.slatThick / 2, W.z0), new THREE.Vector3(lx0 + 0.04 + W.slatDepth, y + W.slatThick / 2, W.z1));
  }
  group.add(new THREE.Mesh(slats.build(), mats.slat));
  return group;
}

/*
 * Where the site shows the photo in a view (the rule in PHOTO), in pixels:
 * its rectangle, and where its sun and horizon land.
 */
function photoPlacement(viewName) {
  const v = VIEWS[viewName];
  const p = PHOTO.placement[viewName];
  const cover = Math.max(v.width / PHOTO.width, v.height / PHOTO.height);
  const w = PHOTO.width * cover * p.scale, h = PHOTO.height * cover * p.scale;
  const left = (0.5 + p.offsetX) * v.width - w / 2;
  const top = v.horizon * v.height - PHOTO.horizon * h;
  return { left, top, width: w, height: h, sun: [left + PHOTO.sun[0] * w, top + PHOTO.sun[1] * h] };
}

// The world point on the plane z = zP seen at pixel (pxX, pxY) of a view.
function pixelToPlane(cam, v, pxX, pxY, zP) {
  const dir = pixelDirection(cam, v, pxX, pxY);
  const t = (zP - cam.position.z) / dir.z;
  return cam.position.clone().addScaledVector(dir, t);
}

function pixelDirection(cam, v, pxX, pxY) {
  const ndc = new THREE.Vector3((pxX / v.width) * 2 - 1, 1 - (pxY / v.height) * 2, 0.5).unproject(cam);
  return ndc.sub(cam.position).normalize();
}

/*
 * The glowing scenery plane, laid out for one view: the photo covers exactly
 * the part of the plane that the site shows through the opening in that
 * view, so the light in the tunnel and the reflection in the floor come
 * from the same part of the photo the site shows. Around it the photo
 * continues in a blurred, mirrored border (textures.cjs), and beyond that
 * the border's edge is stretched, so the tunnel sees "outdoors" in every
 * direction.
 */
function sceneryGeometry(viewName) {
  const v = VIEWS[viewName];
  const cam = makeCamera(viewName);
  const zP = DIM.sceneryZ;
  const pl = photoPlacement(viewName);
  const bd = MANIFEST.sceneryBorder; // border, as a share of the photo size
  const tl = pixelToPlane(cam, v, pl.left - bd * pl.width, pl.top - bd * pl.height, zP);
  const br = pixelToPlane(cam, v, pl.left + (1 + bd) * pl.width, pl.top + (1 + bd) * pl.height, zP);
  const xs = [-80, tl.x, br.x, 80];
  const ys = [-40, br.y, tl.y, 40];
  const us = [0, 0, 1, 1];
  const vs = [0, 0, 1, 1];
  const b = new MeshBuilder();
  const n = new THREE.Vector3(0, 0, 1);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    const q = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]].map(([ii, jj]) =>
      b.vertex(new THREE.Vector3(xs[ii], ys[jj], zP), n, new THREE.Vector2(us[ii], vs[jj]), new THREE.Vector4(1, 0, 0, 1)));
    b.tri(q[0], q[1], q[2]);
    b.tri(q[0], q[2], q[3]);
  }
  return b.build();
}

function buildScenery(mats) {
  const mesh = new THREE.Mesh(sceneryGeometry('desktop'), mats.scenery);
  mesh.userData.isScenery = true;
  mesh.userData.view = 'desktop';
  return mesh;
}

// Lay the scenery plane and the photo's sun out for a view.
function setView(viewName) {
  const { scenery, viewSun } = STATE;
  if (scenery.userData.view !== viewName) {
    scenery.geometry.dispose();
    scenery.geometry = sceneryGeometry(viewName);
    scenery.userData.view = viewName;
  }
  // the photo's sun: in the direction its pixel is seen from this camera
  const v = VIEWS[viewName];
  const cam = makeCamera(viewName);
  const pl = photoPlacement(viewName);
  const toSun = pixelDirection(cam, v, pl.sun[0], pl.sun[1]);
  placeSun(viewSun, toSun.clone().negate(), LOOK.viewSunAngularDiameter, LOOK.viewSunIrradiance, new THREE.Vector3(0, 1.5, -0.25), true);
  viewSun.userData.direction = toSun;
  scenery.updateMatrixWorld(true);
  viewSun.updateMatrixWorld(true);
}

/*
 * The branch of an indoor tree (think of a ficus in a planter) standing out
 * of frame to the left, in the sunbeam from the louvred window. It throws a
 * few leaf shadows across the wave of the frame and the wall beside it.
 * The camera sees the wave as the front face of the plate, so its light has
 * to come from the front: this is that light's last obstacle.
 *
 * It is built so its shadow reads as a branch rather than a smudge: a main
 * stem 3-4.5 cm thick crossing the beam, a few side stems, and separate leaf
 * clusters (10-15 cm) with gaps of light between them, spread over about a
 * metre of wall so the shadow crosses two louvre bands. At 4.3 m from the
 * wall the sun's disc softens every edge by about 5 cm, so the shapes are
 * kept larger than that.
 *
 * Leaves and stems that either camera could see, directly or reflected in
 * the polished floor, are left out, so the branch shows only as shadow.
 */
function buildBranch(mats, sunDir) {
  const r = rng(5157);
  const leaves = new MeshBuilder();
  const twigs = new MeshBuilder();
  const cams = Object.keys(VIEWS).map((v) => makeCamera(v));
  // in frame (with a small margin) for any camera, or mirrored in the floor?
  const inFrame = (p) => cams.some((cam) => [p, new THREE.Vector3(p.x, -p.y, p.z)].some((q) => {
    const s = q.clone().project(cam);
    return s.z < 1 && Math.abs(s.x) < 1.06 && Math.abs(s.y) < 1.06;
  }));
  let kept = 0, dropped = 0;

  // the branch sits on the sun ray through a point on the wave, this far back
  const target = new THREE.Vector3(-0.75, 0.8, DIM.plateFront);
  const back = sunDir.clone().negate(); // toward the sun
  const centre = target.clone().addScaledVector(back, LOOK.branchDistance);
  // two directions across the sunbeam: e1 roughly horizontal, e2 roughly up
  const e1 = new THREE.Vector3().crossVectors(back, new THREE.Vector3(0, 1, 0)).normalize();
  const e2 = new THREE.Vector3().crossVectors(e1, back).normalize();
  // a point across the beam (a, b in metres) and a little along it (c)
  const at = (a, b, c = 0) => centre.clone().addScaledVector(e1, a).addScaledVector(e2, b).addScaledVector(back, c);

  // a stem as a chain of short rods, tapering from t0 to t1 (m)
  const stem = (pts, t0, t1) => {
    for (let i = 0; i < pts.length - 1; i++) {
      const p = pts[i], q = pts[i + 1];
      const th = t0 + ((t1 - t0) * i) / Math.max(1, pts.length - 2);
      if (!inFrame(p) && !inFrame(q)) rod(twigs, p, q, th);
    }
  };
  // points along a gently curving path in the (a, b) plane
  const path = (a0, b0, angle, length, bend, steps) => {
    const pts = [];
    let a = a0, b = b0, ang = angle;
    const step = length / steps;
    for (let s = 0; s <= steps; s++) {
      pts.push({ a, b, p: at(a, b, (r() - 0.5) * 0.03) });
      ang += bend + (r() - 0.5) * 0.15;
      a += Math.cos(ang) * step;
      b += Math.sin(ang) * step;
    }
    return pts;
  };
  // one broad, pointed leaf, 8-12 cm long, mostly facing the sun so its
  // silhouette reads in the shadow
  const leaf = (lc, dirA, dirB) => {
    const len = 0.08 + r() * 0.045, wid = len * (0.42 + r() * 0.14);
    const nrm = back.clone().addScaledVector(e1, (r() - 0.5) * 0.9).addScaledVector(e2, (r() - 0.5) * 0.9).normalize();
    const along = e1.clone().multiplyScalar(dirA).addScaledVector(e2, dirB).normalize();
    const ax = along.clone().addScaledVector(nrm, -along.dot(nrm)).normalize();
    const ay = new THREE.Vector3().crossVectors(nrm, ax).normalize();
    const centreL = lc.clone().addScaledVector(ax, len * 0.5);
    const outline = [];
    const seg = 12;
    for (let s2 = 0; s2 < seg; s2++) {
      const a = (s2 / seg) * Math.PI * 2;
      const u = Math.cos(a);
      const v = Math.sin(a) * Math.pow(1 - Math.abs(u), 0.45) * (u > 0 ? 0.8 : 1);
      outline.push(centreL.clone().addScaledVector(ax, u * len * 0.5).addScaledVector(ay, v * wid * 0.5));
    }
    if (inFrame(centreL) || outline.some(inFrame)) { dropped++; return; }
    kept++;
    const T = new THREE.Vector4(ax.x, ax.y, ax.z, 1);
    const c0 = leaves.vertex(centreL, nrm, new THREE.Vector2(0.5, 0.5), T);
    const ring = outline.map((v) => leaves.vertex(v, nrm, new THREE.Vector2(0, 0), T));
    for (let s2 = 0; s2 < seg; s2++) leaves.tri(c0, ring[s2], ring[(s2 + 1) % seg]);
  };
  // a cluster of 4-7 leaves fanning out from a point, about 10-15 cm across
  const cluster = (a, b, ang) => {
    const n = 4 + Math.floor(r() * 4);
    const base = at(a, b, (r() - 0.5) * 0.04);
    for (let k = 0; k < n; k++) {
      const da = ang + (k / (n - 1) - 0.5) * 2.4 + (r() - 0.5) * 0.4;
      const lc = base.clone().addScaledVector(e1, Math.cos(da) * 0.015).addScaledVector(e2, Math.sin(da) * 0.015);
      leaf(lc, Math.cos(da), Math.sin(da));
    }
  };

  // the main stem enters the beam from the upper left and runs down across it
  const main = path(-0.85, 0.45, -0.4, 1.6, 0.035, 11);
  stem(main.map((m) => m.p), 0.045, 0.028);
  cluster(main[main.length - 1].a, main[main.length - 1].b, -0.3);
  // side stems, alternating up and down, each ending in a cluster, with one
  // more cluster part way along the longer ones
  const sides = [
    { at: 1, ang: 0.8, len: 0.3 },
    { at: 2, ang: -1.2, len: 0.34 },
    { at: 4, ang: 0.95, len: 0.4 },
    { at: 5, ang: -1.0, len: 0.3 },
    { at: 7, ang: 0.7, len: 0.36 },
    { at: 8, ang: -1.25, len: 0.32 },
    { at: 10, ang: 0.5, len: 0.25 },
  ];
  for (const s of sides) {
    const m = main[s.at];
    const branch = path(m.a, m.b, s.ang + (r() - 0.5) * 0.2, s.len, (r() - 0.5) * 0.12, 4);
    stem(branch.map((q) => q.p), 0.026, 0.014);
    const tip = branch[branch.length - 1];
    cluster(tip.a, tip.b, s.ang);
    if (s.len > 0.28) cluster(branch[2].a, branch[2].b, s.ang + (s.ang > 0 ? -1.1 : 1.1));
  }

  const g = new THREE.Group();
  g.add(new THREE.Mesh(leaves.build(), mats.leaf));
  g.add(new THREE.Mesh(twigs.build(), mats.twig));
  g.userData.leaves = { kept, dropped, centre: centre.toArray().map((v) => +v.toFixed(2)) };
  return g;
}

/*
 * A distant sun as a small area light 150 m away, so its shadows have a real
 * penumbra. `irradiance` is what it delivers to a surface facing it.
 * `circular` makes it a disc instead of a square.
 */
function makeSun(travelDir, angularDiameterDeg, irradiance, color, target, circular = false) {
  const light = new THREE.RectAreaLight(new THREE.Color().setRGB(...color), 1, 1, 1);
  placeSun(light, travelDir, angularDiameterDeg, irradiance, target, circular);
  return light;
}

function placeSun(light, travelDir, angularDiameterDeg, irradiance, target, circular = false) {
  const distance = 150;
  const size = 2 * distance * Math.tan(THREE.MathUtils.degToRad(angularDiameterDeg) / 2);
  const solidAngle = ((circular ? Math.PI / 4 : 1) * size * size) / (distance * distance);
  light.isCircular = circular;
  light.width = light.height = size;
  light.intensity = irradiance / solidAngle;
  light.position.copy(target).addScaledVector(travelDir, -distance);
  light.lookAt(target);
  light.userData.baseIntensity = light.intensity;
}

function dirFromAngles(elevationDeg, azimuthDeg) {
  const el = THREE.MathUtils.degToRad(elevationDeg), az = THREE.MathUtils.degToRad(azimuthDeg);
  // travels toward +x and toward the wall (-z), downward
  return new THREE.Vector3(Math.cos(el) * Math.cos(az), -Math.sin(el), -Math.cos(el) * Math.sin(az)).normalize();
}

/*
 * Dim evening sky for fill light through the window and the open front of
 * the room: cool blue-grey overhead, a neutral pale horizon, warm peach only
 * low toward the sun in the west (-x), a neutral dull ground below the
 * horizon. Keeping it neutral keeps the shadows a warm grey rather than
 * brown; the warmth belongs to the sun.
 */
function makeSky(sunTravel) {
  const tex = new ProceduralEquirectTexture(512, 256);
  const zenith = new THREE.Color().setRGB(0.42, 0.5, 0.7);
  const horizon = new THREE.Color().setRGB(0.82, 0.77, 0.7);
  const glow = new THREE.Color().setRGB(1.0, 0.7, 0.48);
  const ground = new THREE.Color().setRGB(0.13, 0.125, 0.115);
  const toSun = new THREE.Vector3(-sunTravel.x, 0, -sunTravel.z).normalize();
  const dir = new THREE.Vector3();
  const flat = new THREE.Vector3();
  const low = new THREE.Color();
  tex.generationCallback = (polar, uv, coord, color) => {
    dir.setFromSpherical(polar);
    const y = dir.y;
    flat.set(dir.x, 0, dir.z).normalize();
    const facing = 0.5 + 0.5 * flat.dot(toSun); // 1 toward the sun, 0 away from it
    const f3 = facing * facing * facing;
    low.copy(horizon).lerp(glow, f3); // the horizon, peach only toward the sun
    if (y >= 0) {
      const t = Math.pow(1 - y, 3.0);
      color.copy(zenith).lerp(low, t);
      color.multiplyScalar(0.6 + 0.6 * f3 * t);
    } else {
      const t = Math.min(1, -y * 6);
      color.copy(low).multiplyScalar(0.45).lerp(ground, t);
    }
  };
  tex.update();
  return tex;
}

// ---------------------------------------------------------------------------
// Cameras
// ---------------------------------------------------------------------------

/*
 * A level camera looking straight at the wall. The distance makes the O
 * fill the requested share of the frame. The camera height is chosen so the
 * horizon (eye level) falls on the view's `horizon` row, where the site
 * places the photo's own horizon; a vertical lens shift (like a tilt-shift
 * lens) then puts the floor line where requested while keeping verticals
 * vertical.
 */
function makeCamera(viewName, crop = null) {
  const v = VIEWS[viewName];
  const aspect = v.width / v.height;
  const longHalf = 18 / v.focalMm; // tan of half the FOV along the long side
  const tanV = aspect >= 1 ? longHalf / aspect : longHalf;
  const tanH = tanV * aspect;
  const zO = DIM.plateFront - DIM.outerRound; // the plane of the outer silhouette
  const extent = v.fit === 'height' ? EMBLEM.heightWorld : DIM.emblemWidth;
  const tanFit = v.fit === 'height' ? tanV : tanH;
  const dist = extent / (2 * tanFit * v.fill); // camera to the silhouette plane
  const camZ = zO + dist;
  // The floor line (y = 0, z = 0) sits (floorLine - horizon) of the frame
  // height below the horizon, which fixes the camera height ...
  const eyeHeight = (v.floorLine - v.horizon) * 2 * camZ * tanV;
  // ... and the lens shift moves the horizon to its row (ndc units,
  // positive moves content down)
  const shift = 2 * v.horizon - 1;

  const cam = new THREE.PerspectiveCamera(THREE.MathUtils.radToDeg(2 * Math.atan(tanV)), aspect, 0.05, 200);
  cam.position.set(0, eyeHeight, camZ);
  cam.lookAt(0, eyeHeight, 0);
  // view offset in pixels: negative y moves the frame up. A `crop`
  // ([x, y, width, height] in full-size pixels) renders just that window
  // of the frame, for checking detail at 1:1 without rendering all of it.
  const [cx, cy, cw, ch] = crop || [0, 0, v.width, v.height];
  cam.setViewOffset(v.width, v.height, cx, cy + (-shift * v.height) / 2, cw, ch);
  cam.updateProjectionMatrix();
  cam.updateMatrixWorld(true);
  cam.userData = { tanV, tanH, shift, camZ, eyeHeight, focalMm: v.focalMm };
  return cam;
}

// Project a world point to normalised image coordinates (0..1, y down).
function project(cam, x, y, z) {
  const p = new THREE.Vector3(x, y, z).project(cam);
  return [(p.x + 1) / 2, (1 - p.y) / 2];
}

function bboxOf(points) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of points) {
    x0 = Math.min(x0, x); x1 = Math.max(x1, x);
    y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0, center: [(x0 + x1) / 2, (y0 + y1) / 2] };
}

/*
 * Everything the site needs to line things up with the image, in normalised
 * image coordinates. Planar contours parallel to the image plane project as
 * an exact scale + offset of the SVG, so we report that transform too.
 */
function computeLayout(viewName, cam = makeCamera(viewName)) {
  const v = VIEWS[viewName];
  const s = EMBLEM.svg;
  const zOuter = DIM.plateFront - DIM.outerRound; // frontmost point of the outer side wall
  const zInner = DIM.plateFront - DIM.innerRound; // where the rounded lip meets the tunnel
  const zExit = -DIM.wallThickness + DIM.exitRound; // last point of the tunnel wall
  const projContour = (c, z) => c.pts.map((p) => project(cam, p.x, p.y, z));
  // SVG -> image transform at depth z: x_img = ax * x_svg + bx, y_img = ay * y_svg + by
  const svgTransform = (z) => {
    const p0 = project(cam, (0 - s.cx) * s.scale, (s.maxY - 0) * s.scale + DIM.emblemBase, z);
    const p1 = project(cam, (100 - s.cx) * s.scale, (s.maxY - 100) * s.scale + DIM.emblemBase, z);
    const ax = (p1[0] - p0[0]) / 100, ay = (p1[1] - p0[1]) / 100;
    return { scaleX: ax, scaleY: ay, offsetX: p0[0], offsetY: p0[1] };
  };
  const outerPts = projContour(EMBLEM.outer, zOuter);
  const innerPts = projContour(EMBLEM.inner, zInner);
  const exitPts = projContour(EMBLEM.inner, zExit);
  // a few named points on the inner contour (SVG coordinates and image position)
  const samples = [];
  const nS = 24;
  for (let k = 0; k < nS; k++) {
    const i = Math.floor((k / nS) * s.inner.length);
    const sp = s.inner[i];
    const wp = EMBLEM.inner.pts[i];
    samples.push({ svg: [+sp.x.toFixed(3), +sp.y.toFixed(3)], image: project(cam, wp.x, wp.y, zInner).map((q) => +q.toFixed(6)) });
  }
  const pl = photoPlacement(viewName);
  return {
    view: viewName,
    width: v.width,
    height: v.height,
    outer: { ...bboxOf(outerPts), depth: zOuter, svgToImage: svgTransform(zOuter) },
    innerFront: { ...bboxOf(innerPts), depth: zInner, svgToImage: svgTransform(zInner) },
    tunnelExit: { ...bboxOf(exitPts), depth: zExit, svgToImage: svgTransform(zExit) },
    seeThrough: bboxOf(exitPts), // refined from the matte image by render.cjs
    innerContourPoints: samples,
    floorLine: project(cam, 0, 0, 0)[1],
    horizonY: v.horizon,
    emblemCenter: project(cam, 0, DIM.emblemBase + EMBLEM.heightWorld / 2, zOuter),
    photo: {
      x: pl.left / v.width, y: pl.top / v.height, width: pl.width / v.width, height: pl.height / v.height,
      sun: [pl.sun[0] / v.width, pl.sun[1] / v.height],
    },
    camera: {
      position: cam.position.toArray(),
      eyeHeight: cam.userData.eyeHeight,
      lookDirection: [0, 0, -1],
      verticalFovDeg: cam.fov,
      horizontalFovDeg: THREE.MathUtils.radToDeg(2 * Math.atan(cam.userData.tanH)),
      focalLengthMm35: cam.userData.focalMm,
      verticalShiftNdc: cam.userData.shift,
      verticalShiftFrame: cam.userData.shift / 2,
      near: cam.near,
      far: cam.far,
    },
  };
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

const STATE = { renderer: null, scene: null, pathTracer: null, mats: null, result: null };

/*
 * Two small changes to the path tracer's shader (three-gpu-pathtracer 0.0.28),
 * made as text replacements so the installed package stays untouched:
 *
 * 1. Smarter choice of light. For each shadow ray the stock shader picks one
 *    light at random, all equally likely. With the LED strip split into 56
 *    pieces, a point on the wall then aims at a piece on the far side of the
 *    O most of the time, and the halo stays noisy; and a dim, large fill
 *    light would be picked as often as the bright sun. Here a light is picked
 *    in proportion to a rough guess of its contribution at that point (its
 *    radiance times the solid angle it covers: radiance x area x facing over
 *    distance cubed; zero for lights facing away), and every probability is
 *    accounted for, so the result is still unbiased, just far less noisy.
 *
 * 2. An optional ceiling on the light a single path may bring back
 *    (`sampleClamp`, 0 = off). Very rare, very bright paths ("fireflies")
 *    would otherwise need hours of samples to average out. Used gently.
 */
function patchPathTracerShader(pt) {
  const mat = pt._pathTracer.material;
  let fs = mat.fragmentShader;
  const swap = (from, to) => {
    if (!fs.includes(from)) throw new Error('path tracer shader patch: snippet not found: ' + from.slice(0, 60));
    fs = fs.replace(from, to);
  };
  const helpers = /* glsl */ `
	// rough share of light l at point p (see patchPathTracerShader in scene.js)
	float lightSelectWeight( sampler2D lightsTex, uint l, vec3 p ) {
		Light light = readLightInfo( lightsTex, l );
		if ( light.type != RECT_AREA_LIGHT_TYPE && light.type != CIRC_AREA_LIGHT_TYPE ) return 1.0;
		vec3 n = normalize( cross( light.u, light.v ) );
		vec3 toLight = light.position - p;
		float facing = dot( n, toLight ); // > 0 when p is on the lit side
		if ( facing <= 0.0 ) return 0.0;
		float d2 = dot( toLight, toLight ) + light.area;
		// radiance x solid angle: roughly the light this light brings to p
		float radiance = light.intensity * dot( light.color, vec3( 0.2126, 0.7152, 0.0722 ) );
		return radiance * light.area * facing / ( d2 * sqrt( d2 ) );
	}

	float lightSelectTotal( sampler2D lightsTex, uint count, vec3 p ) {
		float total = 0.0;
		for ( uint i = 0u; i < count; i ++ ) total += lightSelectWeight( lightsTex, i, p );
		return total;
	}

	float lightSelectProb( sampler2D lightsTex, uint count, vec3 p, uint l ) {
		float total = lightSelectTotal( lightsTex, count, p );
		return total > 0.0 ? lightSelectWeight( lightsTex, l, p ) / total : 0.0;
	}
`;
  // keep the stock sampling code, renamed, for a light chosen by the caller;
  // the helpers go just in front of it
  swap('LightRecord randomLightSample( sampler2D lights, sampler2DArray iesProfiles, uint lightCount, vec3 rayOrigin, vec3 ruv ) {',
    helpers + '\n\tLightRecord randomLightSampleStock( sampler2D lights, sampler2DArray iesProfiles, uint lightCount, vec3 rayOrigin, vec3 ruv, uint l ) {');
  swap('uint l = uint( ruv.x * float( lightCount ) );', '');
  // the new randomLightSample: weighted pick, then the stock sampling of that light
  swap('vec3 directLightContribution( vec3 worldWo, SurfaceRecord surf, RenderState state, vec3 rayOrigin ) {', /* glsl */ `
	LightRecord randomLightSample( sampler2D lightsTex, sampler2DArray ies, uint lightCount, vec3 rayOrigin, vec3 ruv ) {
		float total = lightSelectTotal( lightsTex, lightCount, rayOrigin );
		LightRecord rec;
		rec.pdf = 0.0;
		if ( total <= 0.0 ) return rec;
		float target = ruv.x * total;
		float acc = 0.0;
		uint pick = 0u;
		float w = 0.0;
		for ( uint i = 0u; i < lightCount; i ++ ) {
			float wi = lightSelectWeight( lightsTex, i, rayOrigin );
			if ( wi <= 0.0 ) continue;
			pick = i;
			w = wi;
			acc += wi;
			if ( target < acc ) break;
		}
		rec = randomLightSampleStock( lightsTex, ies, lightCount, rayOrigin, ruv, pick );
		// the stock code divides by lightsDenom, which assumes 1 / lightCount per light
		rec.pdf *= float( lightCount ) * w / total;
		return rec;
	}

	vec3 directLightContribution( vec3 worldWo, SurfaceRecord surf, RenderState state, vec3 rayOrigin ) {`);
  // light hit by a bounce ray: its MIS weight must use the same pick probability
  swap('float misWeight = misHeuristic( scatterRec.pdf, lightRec.pdf / lightsDenom );',
    'float misWeight = misHeuristic( scatterRec.pdf, lightRec.pdf * float( lights.count ) * lightSelectProb( lights.tex, lights.count, ray.origin, i ) / lightsDenom );');
  // the per-path ceiling
  swap('uniform float opacity;', 'uniform float opacity;\n\t\t\t\tuniform float sampleClamp;');
  swap('gl_FragColor.a *= opacity;', /* glsl */ `
					if ( sampleClamp > 0.0 ) {
						float lum = luminance( gl_FragColor.rgb );
						if ( lum > sampleClamp ) gl_FragColor.rgb *= sampleClamp / lum;
					}
					gl_FragColor.a *= opacity;`);
  mat.fragmentShader = fs;
  mat.uniforms.sampleClamp = { value: 0 };
  mat.needsUpdate = true;
  return mat;
}

async function setupScene() {
  await loadEmblem();
  const mats = await makeMaterials();
  const scene = new THREE.Scene();
  scene.add(buildFrame(mats));
  scene.add(buildRoom(mats));
  const scenery = buildScenery(mats);
  scene.add(scenery);

  const sunDir = dirFromAngles(LOOK.sunElevation, LOOK.sunAzimuth);
  const sun = makeSun(sunDir, LOOK.sunAngularDiameter, LOOK.sunIrradiance, LOOK.sunColor, new THREE.Vector3(-2.5, 1.5, 0));
  scene.add(sun);
  const branch = buildBranch(mats, sunDir);
  branch.name = 'branch';
  scene.add(branch);
  const led = buildLedLights();
  for (const l of led) scene.add(l);

  // the sunlit room behind the photographer, facing the wall (-z)
  const fill = new THREE.RectAreaLight(new THREE.Color().setRGB(...LOOK.fillColor), LOOK.fillRadiance, LOOK.fillSize[0], LOOK.fillSize[1]);
  fill.position.set(...LOOK.fillCenter);
  fill.lookAt(LOOK.fillCenter[0], LOOK.fillCenter[1], 0);
  scene.add(fill);

  // the photo's own sun, placed per view by setView()
  const viewSun = makeSun(new THREE.Vector3(0, 0, 1), LOOK.viewSunAngularDiameter, LOOK.viewSunIrradiance, LOOK.viewSunColor, new THREE.Vector3(0, 1.5, 0), true);
  scene.add(viewSun);

  scene.background = null; // so the path tracer keeps an alpha channel (coverage)
  scene.environment = makeSky(sunDir);
  scene.environmentIntensity = LOOK.skyIntensity;
  STATE.scenery = scenery;
  STATE.viewSun = viewSun;
  setView('desktop');
  scene.updateMatrixWorld(true);
  STATE.lights = { sun, led, fill, viewSun, sunBase: sun.intensity };

  const canvas = document.createElement('canvas');
  document.body.appendChild(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1);

  const pt = new WebGLPathTracer(renderer);
  patchPathTracerShader(pt);
  pt.textureSize.set(MANIFEST.size, MANIFEST.size);
  pt.renderDelay = 0;
  pt.fadeDuration = 0;
  pt.minSamples = 0;
  pt.renderToCanvas = false;
  pt.rasterizeScene = false;
  pt.dynamicLowRes = false;
  pt.bounces = 9;
  pt.transmissiveBounces = 2;
  pt.filterGlossyFactor = 0.4;
  pt.multipleImportanceSampling = true;

  Object.assign(STATE, { renderer, scene, pathTracer: pt, mats, canvas });
  let tris = 0;
  scene.traverse((o) => { if (o.isMesh) tris += o.geometry.index.count / 3; });
  return {
    triangles: tris, outerPerimeter: EMBLEM.outer.total, innerPerimeter: EMBLEM.inner.total, emblemHeight: EMBLEM.heightWorld,
    leaves: branch.userData.leaves, ledLights: led.length,
  };
}

const tick = () => new Promise((r) => setTimeout(r, 0));

/*
 * Light groups. Light adds up linearly, so the image can be rendered as
 * separate passes, one per group of light sources, and summed afterwards
 * (render.cjs does that). Each group can then get the number of samples it
 * needs, and its strength can be fine-tuned without rendering again.
 *
 *   sun      the low sun through the louvred window on the left
 *   sky      the dim evening sky (environment) for fill light
 *   fill     the sunlit room behind the photographer
 *   scenery  the glowing sunset photo behind the wall
 *   vsun     the photo's own sun, low over the lake ahead
 *   led      the hidden LED strip behind the plate
 *
 * `groups` maps a group name to a strength (1 = as set in LOOK, 0 = off).
 */
const ALL_GROUPS = ['sun', 'sky', 'fill', 'scenery', 'vsun', 'led'];

function setLightGroups(groups) {
  const { lights, mats, scene } = STATE;
  const g = (name) => (groups[name] === undefined ? 0 : Number(groups[name]));
  lights.sun.intensity = lights.sunBase * g('sun');
  lights.sun.visible = g('sun') > 0;
  for (const l of lights.led) {
    l.intensity = LOOK.ledRadiance * g('led');
    l.visible = g('led') > 0;
  }
  lights.fill.intensity = LOOK.fillRadiance * g('fill');
  lights.fill.visible = g('fill') > 0;
  lights.viewSun.intensity = lights.viewSun.userData.baseIntensity * g('vsun');
  lights.viewSun.visible = g('vsun') > 0;
  scene.environmentIntensity = LOOK.skyIntensity * g('sky');
  mats.scenery.emissiveIntensity = LOOK.sceneryIntensity * g('scenery');
}

/*
 * Path-trace one view with the given light groups switched on. `scale` < 1
 * renders a smaller preview. The result (float RGBA, rows bottom to top,
 * colour premultiplied by coverage) is kept in STATE.result for render.cjs
 * to read in chunks.
 */
async function renderStill({
  view = 'desktop', samples = 64, scale = 1, tiles = [3, 3], matte = true, onProgress = true,
  groups = { sun: 1, sky: 1, fill: 1, scenery: 1, vsun: 1, led: 1 }, clamp = 0, hide = [], crop = null,
} = {}) {
  const v = VIEWS[view];
  const { renderer, scene, pathTracer: pt, mats } = STATE;
  const W = crop ? crop[2] : Math.round(v.width * scale), H = crop ? crop[3] : Math.round(v.height * scale);
  renderer.setSize(W, H, false);
  const cam = makeCamera(view, crop);
  mats.scenery.matte = matte;
  setView(view);
  setLightGroups(groups);
  // look development: leave named objects out (e.g. hide: ['branch'])
  scene.traverse((o) => { if (o.name) o.visible = !hide.includes(o.name); });
  pt._pathTracer.material.uniforms.sampleClamp.value = clamp;
  pt.tiles.set(tiles[0], tiles[1]);
  const t0 = performance.now();
  pt.setScene(scene, cam);
  const tBuild = performance.now() - t0;
  pt.reset();
  const t1 = performance.now();
  let last = t1;
  // Chrome queues GPU work without waiting for it. Each renderSample() call
  // draws one tile; left alone, Chrome would send all the tiles of a sample
  // to the GPU as one batch, and at full size that batch runs longer than
  // the 2 seconds Windows allows a GPU job before it resets the driver
  // (which loses the WebGL context). Reading back one pixel after every
  // tile makes the page wait for that tile, so each job stays short, and
  // keeps the progress honest.
  const px = new Float32Array(4);
  const gl = renderer.getContext();
  const sync = () => {
    renderer.readRenderTargetPixels(pt.target, 0, 0, 1, 1, px);
    // a reset GPU leaves the page running but drawing nothing: stop, so the
    // runner can reopen the page and redo this batch
    if (gl.isContextLost()) throw new Error('WebGL context lost');
  };
  let tFirst = 0, sFirst = 0;
  let nextSync = 1;
  while (pt.samples < samples) {
    pt.renderSample();
    if (pt.isCompiling) { await tick(); continue; }
    sync(); // wait for this tile (see above)
    if (pt.samples >= nextSync) {
      nextSync = Math.floor(pt.samples) + 1;
      if (!tFirst) { tFirst = performance.now(); sFirst = pt.samples; } // shaders compiled, first sample done
      await tick();
      const now = performance.now();
      if (onProgress && now - last > 30000 && pt.samples - sFirst >= 1) {
        const rate = (now - tFirst) / Math.max(1e-6, pt.samples - sFirst);
        console.log(`progress ${view} ${Math.floor(pt.samples)}/${samples} spp, ${((now - t1) / 1000).toFixed(0)} s, ${rate.toFixed(0)} ms/spp, ~${(((samples - pt.samples) * rate) / 60000).toFixed(1)} min left`);
        last = now;
      }
    }
  }
  const buf = new Float32Array(W * H * 4);
  renderer.readRenderTargetPixels(pt.target, 0, 0, W, H, buf);
  const tEnd = performance.now();
  STATE.result = new Uint8Array(buf.buffer);
  const msPerSample = (tEnd - tFirst) / Math.max(1, pt.samples - sFirst);
  return { width: W, height: H, bytes: STATE.result.byteLength, buildMs: tBuild, renderMs: tEnd - t1, msPerSample, samples: pt.samples };
}

/*
 * The see-through matte: the scenery plane white, everything else black,
 * rasterised at 4x and reduced with the same 2-pixel tent filter the path
 * tracer uses for its own pixels, so its edge matches the beauty pass.
 */
async function renderMatte({ view = 'desktop', scale = 1, ss = 4, crop = null } = {}) {
  const v = VIEWS[view];
  const { renderer, scene } = STATE;
  const W = crop ? crop[2] : Math.round(v.width * scale), H = crop ? crop[3] : Math.round(v.height * scale);
  const cam = makeCamera(view, crop);
  setView(view);
  const white = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
  const black = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide });
  const saved = new Map();
  scene.traverse((o) => {
    if (o.isMesh) { saved.set(o, o.material); o.material = o.userData.isScenery ? white : black; }
  });
  const bg = scene.background;
  scene.background = new THREE.Color(0x000000);
  const big = new THREE.WebGLRenderTarget(W * ss, H * ss, { type: THREE.UnsignedByteType, depthBuffer: true });
  renderer.setSize(W, H, false);
  renderer.setRenderTarget(big);
  renderer.setClearColor(0x000000, 1);
  renderer.clear();
  renderer.render(scene, cam);
  // restore
  scene.traverse((o) => { if (saved.has(o)) o.material = saved.get(o); });
  scene.background = bg;

  const small = new THREE.WebGLRenderTarget(W, H, { type: THREE.FloatType });
  const quad = new FullScreenQuad(new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    uniforms: { src: { value: big.texture }, ss: { value: ss } },
    vertexShader: 'out vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `
      precision highp float;
      uniform sampler2D src; uniform int ss;
      in vec2 vUv; out vec4 outColor;
      void main() {
        ivec2 o = ivec2(gl_FragCoord.xy);           // output pixel
        vec2 c = vec2(o) + 0.5;                     // its centre, in output pixels
        float fs = float(ss);
        float acc = 0.0, wsum = 0.0;
        ivec2 size = textureSize(src, 0);
        for (int j = -ss / 2; j < 2 * ss - ss / 2; j++) {
          for (int i = -ss / 2; i < 2 * ss - ss / 2; i++) {
            ivec2 q = o * ss + ivec2(i, j);
            vec2 p = (vec2(q) + 0.5) / fs;          // subsample centre in output pixels
            float wx = max(0.0, 1.0 - abs(p.x - c.x));
            float wy = max(0.0, 1.0 - abs(p.y - c.y));
            float w = wx * wy;
            q = clamp(q, ivec2(0), size - 1);
            acc += w * texelFetch(src, q, 0).r;
            wsum += w;
          }
        }
        float m = acc / wsum;
        outColor = vec4(m, m, m, 1.0);
      }`,
  }));
  renderer.setRenderTarget(small);
  quad.render(renderer);
  renderer.setRenderTarget(null);
  const buf = new Float32Array(W * H * 4);
  renderer.readRenderTargetPixels(small, 0, 0, W, H, buf);
  if (renderer.getContext().isContextLost()) throw new Error('WebGL context lost');
  // keep one channel only
  const one = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) one[i] = buf[i * 4];
  STATE.result = new Uint8Array(one.buffer);
  big.dispose(); small.dispose(); quad.dispose();
  return { width: W, height: H, bytes: STATE.result.byteLength };
}

// Hand a slice of the last result to the runner as base64.
async function readResultChunk(offset, length) {
  const slice = STATE.result.subarray(offset, Math.min(offset + length, STATE.result.byteLength));
  const blob = new Blob([slice]);
  const url = await new Promise((res) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.readAsDataURL(blob);
  });
  return url.slice(url.indexOf(',') + 1);
}

function getLayout({ view = 'desktop' } = {}) {
  return computeLayout(view);
}

window.setupScene = setupScene;
window.renderStill = renderStill;
window.renderMatte = renderMatte;
window.readResultChunk = readResultChunk;
window.getLayout = getLayout;
window.sceneSettings = () => ({ DIM, LOOK, VIEWS, PHOTO, lightGroups: ALL_GROUPS });
window.__sceneReady = true;

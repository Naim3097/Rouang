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
 *     facing the wall. It washes a narrow halo onto the concrete around the O.
 *   - A polished concrete floor at y = 0.
 *   - A side wall on the left with a tall window of horizontal louvres; a low,
 *     warm sun outside it lays diagonal bands of light across the left part of
 *     the back wall. A ceiling closes the room; the front and right are open to
 *     a dim, warm evening sky.
 *   - Out of frame on the left, in that sunbeam, the branch of an indoor tree:
 *     only its soft leaf shadows show, across the wave of the frame.
 *   - Behind the wall, a large plane that glows with the client's sunset photo,
 *     so warm light really comes in through the opening and onto the inner
 *     faces of the frame.
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
  gap: 0.04, // shadow gap between the wall face and the back of the plate
  plate: 0.075, // thickness of the front plate (front face at z = gap + plate)
  overlap: 0.05, // how far the plate overlaps the wall around the opening

  outerRound: 0.016, // radius of the rounded front outer edge
  outerBackRound: 0.006, // small round on the back outer edge
  innerRound: 0.04, // radius of the rounded lip where the plate turns into the tunnel
  exitRound: 0.012, // round at the back end of the tunnel

  ledInset: 0.014, // LED strip: distance in from the plate's outer edge
  ledWidth: 0.012, // LED strip: width of the glowing face
  ledDrop: 0.003, // LED strip: stands this far off the back of the plate

  // the room: inner face of the left wall, right wall, ceiling height, open front
  room: { left: -7.5, leftThickness: 0.3, right: 7.5, ceiling: 7.2, front: 14 },
  // tall window in the left wall (z range, sill and head heights) with
  // horizontal louvres; the sun through it lands on the left of the back wall.
  // It runs far enough toward the camera that the lit area ends along the
  // diagonal shadow of the window head, not along a vertical jamb shadow.
  window: { z0: 3.4, z1: 7.6, y0: 0.5, y1: 5.25, pitch: 0.55, slatDepth: 0.28, slatThick: 0.05 },

  sceneryZ: -12, // the glowing scenery plane behind the wall
};
DIM.plateFront = DIM.gap + DIM.plate;

export const LOOK = {
  // Low golden-hour sun outside the louvred window (direction of travel).
  sunElevation: 24, // degrees above the horizon
  sunAzimuth: 42, // degrees from +x toward the wall (-z)
  sunAngularDiameter: 0.75, // degrees; a little larger than the real sun (0.53), as through haze
  sunIrradiance: 2.9, // on a surface facing the sun (scene units)
  sunColor: [1.0, 0.68, 0.40],

  // The indoor tree's branch: how far up the sunbeam it sits from the wave
  // (m). Nearer gives crisper leaf shadows, but the leaves must stay out of
  // frame and out of the floor's reflection.
  branchDistance: 4.3,

  // Evening sky seen through the open sides of the room.
  skyIntensity: 0.75,

  // The glowing scenery photo behind the wall.
  sceneryIntensity: 1.6,

  // Hidden LED strip (about 2700 K, as photographed with a warm daylight
  // balance). It is modelled as a chain of small rectangular area lights
  // that follow the outer contour behind the plate, so the path tracer can
  // aim shadow rays at it (a tiny glowing surface on its own would only be
  // found by chance and stay noisy). They face the wall, tilted outward a
  // little, like a strip in an angled aluminium profile.
  ledColor: [1.0, 0.62, 0.33],
  ledRadiance: 40, // radiance of the diffuser face (scene units)
  ledSegments: 56, // straight pieces around the contour (about 17 cm each)
  ledTilt: 12, // degrees the strip is turned outward from facing the wall
};

// The two framings of the same scene.
export const VIEWS = {
  desktop: {
    width: 2560,
    height: 1440,
    focalMm: 40, // full-frame equivalent, the frame's long side = 36 mm
    eyeHeight: 1.5,
    fit: 'height', // the O's outer height fills `fill` of the frame height
    fill: 0.76,
    floorLine: 0.87, // where the wall meets the floor, from the top of the frame
  },
  portrait: {
    width: 1290,
    height: 2796,
    focalMm: 40,
    eyeHeight: 1.5,
    fit: 'width', // the O's outer width fills `fill` of the frame width
    fill: 0.86,
    // The O stands on the floor, so with the floor in the lowest ~17% of the
    // frame its centre lands at about 63% from the top (it is 39% of the
    // frame tall at this width); it cannot also sit above the centre.
    floorLine: 0.83,
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
  constructor() {
    this.pos = []; this.nor = []; this.uv = []; this.tan = []; this.idx = [];
  }
  vertex(p, n, uv, t) {
    this.pos.push(p.x, p.y, p.z);
    this.nor.push(n.x, n.y, n.z);
    this.uv.push(uv.x, uv.y);
    this.tan.push(t.x, t.y, t.z, t.w);
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
    g.setIndex(this.idx);
    return g;
  }
}

/*
 * Sweep a cross-section profile along a contour. Each profile row is
 * { off, z, no, nz }: offset along the contour normal (m), height z (m), and
 * the surface normal in the (contour normal, z) plane. UVs follow arc length
 * along the contour (u) and along the profile (v), in metres / `uvScale`.
 */
function sweep(builder, c, profile, uvScale) {
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
      col.push(builder.vertex(pos, nor, new THREE.Vector2(u, vAcc[j] / uvScale), new THREE.Vector4(T.x, T.y, T.z, w)));
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
    loadTex('./scenery-source.jpg', true),
  ]);

  const mats = {
    wall: new THREE.MeshStandardMaterial({
      map: wa, roughnessMap: wr, normalMap: wn, roughness: 1, metalness: 0,
      normalScale: new THREE.Vector2(0.9, 0.9), side: THREE.DoubleSide,
    }),
    // roughness scales the map: about 0.25 on average, a polished but not
    // mirror-like floor whose reflections blur and break up
    floor: new THREE.MeshPhysicalMaterial({
      map: fa, roughnessMap: fr, normalMap: fn, roughness: 0.8, metalness: 0, ior: 1.5,
      normalScale: new THREE.Vector2(0.6, 0.6), side: THREE.DoubleSide,
    }),
    plaster: new THREE.MeshStandardMaterial({
      map: pa, roughnessMap: pr, normalMap: pn, roughness: 1, metalness: 0,
      normalScale: new THREE.Vector2(0.8, 0.8), side: THREE.DoubleSide,
    }),
    // plain concrete for room surfaces the camera never sees directly
    room: new THREE.MeshStandardMaterial({ color: new THREE.Color().setRGB(0.30, 0.28, 0.25), roughness: 0.9, side: THREE.DoubleSide }),
    slat: new THREE.MeshStandardMaterial({ color: new THREE.Color().setRGB(0.20, 0.15, 0.11), roughness: 0.7, side: THREE.DoubleSide }),
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
  return mats;
}

const domainUV = (d) => (p) => new THREE.Vector2((p.x - d.originX) / d.width, (p.y - d.originY) / d.height);

function buildFrame(mats) {
  const { outer, inner } = EMBLEM;
  const D = DIM;
  const zF = D.plateFront, zB = D.gap, T = D.wallThickness;
  const pd = MANIFEST.domains.plaster;
  const uvS = pd.width;
  const plaster = new MeshBuilder();
  const led = new MeshBuilder();
  const housing = new MeshBuilder();

  // 1. front face of the plate: between the two rounded edges
  planarFace(plaster, offsetPts(outer, -D.outerRound), [offsetPts(inner, -D.innerRound)], zF, 1, domainUV(pd));

  // 2. outer edge: front round, side, back round
  const ro = D.outerRound, rb = D.outerBackRound;
  const outerProfile = [
    ...quarter(8, (a) => ({ off: -ro + ro * Math.sin(a), z: zF - ro + ro * Math.cos(a), no: Math.sin(a), nz: Math.cos(a) })),
    ...quarter(4, (a) => ({ off: -rb + rb * Math.cos(a), z: zB + rb - rb * Math.sin(a), no: Math.cos(a), nz: -Math.sin(a) })),
  ];
  sweep(plaster, outer, outerProfile, uvS);

  // 3. back of the plate (facing the wall), split around the LED strip
  const l0 = -(rb + D.ledInset), l1 = l0 - D.ledWidth;
  const backRow = (off) => ({ off, z: zB, no: 0, nz: -1 });
  sweep(plaster, outer, [backRow(-rb), backRow(l0 + 0.003)], uvS);
  sweep(plaster, outer, [backRow(l1 - 0.003), backRow(-D.overlap)], uvS);
  // the LED strip: a small dark channel with a glowing face just off the plate
  const zl = zB - D.ledDrop;
  sweep(housing, outer, [backRow(l0 + 0.003), { off: l0 + 0.003, z: zl, no: 1, nz: 0 }], uvS);
  sweep(housing, outer, [{ off: l1 - 0.003, z: zl, no: -1, nz: 0 }, backRow(l1 - 0.003)], uvS);
  sweep(housing, outer, [{ off: l0 + 0.003, z: zl, no: 0, nz: -1 }, { off: l0, z: zl, no: 0, nz: -1 }], uvS);
  sweep(housing, outer, [{ off: l1, z: zl, no: 0, nz: -1 }, { off: l1 - 0.003, z: zl, no: 0, nz: -1 }], uvS);
  sweep(led, outer, [{ off: l0, z: zl, no: 0, nz: -1 }, { off: l1, z: zl, no: 0, nz: -1 }], uvS);

  // 4. outside of the lining, visible only inside the shadow gap
  sweep(plaster, outer, [{ off: -D.overlap, z: zB, no: 1, nz: 0 }, { off: -D.overlap, z: -T, no: 1, nz: 0 }], uvS);

  // 5. the inner surface: rounded lip, the tunnel through the wall, rounded exit
  const ri = D.innerRound, re = D.exitRound;
  const innerProfile = [
    ...quarter(12, (a) => ({ off: -ri + ri * Math.sin(a), z: zF - ri + ri * Math.cos(a), no: Math.sin(a), nz: Math.cos(a) })),
    ...quarter(6, (a) => ({ off: -re + re * Math.cos(a), z: -T + re - re * Math.sin(a), no: Math.cos(a), nz: -Math.sin(a) })),
  ];
  sweep(plaster, inner, innerProfile, uvS);

  // 6. back face of the frame, flush with the back of the wall
  planarFace(plaster, offsetPts(outer, -D.overlap), [offsetPts(inner, -re)], -T, -1, domainUV(pd));

  const group = new THREE.Group();
  group.add(new THREE.Mesh(plaster.build(), mats.plaster));
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
  const rect = [new THREE.Vector2(x0, 0), new THREE.Vector2(x1, 0), new THREE.Vector2(x1, top), new THREE.Vector2(x0, top)];
  const opening = offsetPts(EMBLEM.outer, -D.overlap);
  planarFace(wall, rect, [opening], 0, 1, domainUV(wd));
  group.add(new THREE.Mesh(wall.build(), mats.wall));
  const wallBack = new MeshBuilder();
  planarFace(wallBack, rect, [opening], -T, -1, domainUV(wd));
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
 * Where the site will show the photo behind the opening, seen from the
 * desktop camera, projected onto the scenery plane. The photo covers this
 * rectangle; outside it the photo's edge pixels are stretched, so the tunnel
 * still sees "outdoors" in every direction.
 */
function buildScenery(mats) {
  const cam = makeCamera('desktop');
  const layout = computeLayout('desktop', cam);
  const zP = DIM.sceneryZ;
  const v = VIEWS.desktop;
  // site rule: photo scaled to cover the frame, then 80% of that, centred on the opening
  const coverW = Math.max(v.width, v.height * (16 / 9));
  const photoWpx = coverW * 0.8, photoHpx = photoWpx * (9 / 16);
  const c = layout.seeThrough.center; // normalised
  const corners = [
    [c[0] * v.width - photoWpx / 2, c[1] * v.height - photoHpx / 2],
    [c[0] * v.width + photoWpx / 2, c[1] * v.height + photoHpx / 2],
  ];
  // unproject pixel corners onto the plane z = zP
  const toPlane = (pxX, pxY) => {
    const ndc = new THREE.Vector3((pxX / v.width) * 2 - 1, 1 - (pxY / v.height) * 2, 0.5).unproject(cam);
    const dir = ndc.sub(cam.position).normalize();
    const t = (zP - cam.position.z) / dir.z;
    return cam.position.clone().addScaledVector(dir, t);
  };
  const tl = toPlane(corners[0][0], corners[0][1]);
  const br = toPlane(corners[1][0], corners[1][1]);
  const xs = [-60, tl.x, br.x, 60];
  const ys = [-30, br.y, tl.y, 18];
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
  const mesh = new THREE.Mesh(b.build(), mats.scenery);
  mesh.userData.isScenery = true;
  mesh.userData.photoRect = { tl, br };
  return mesh;
}

/*
 * The branch of an indoor tree (think of a ficus in a planter) standing out
 * of frame to the left, in the sunbeam from the louvred window. It throws a
 * few soft leaf shadows across the wave of the frame and the wall beside it.
 * The camera sees the wave as the front face of the plate, so its light has
 * to come from the front: this is that light's last obstacle.
 *
 * Leaves and twigs that either camera could see, directly or reflected in
 * the polished floor, are left out, so the branch shows only as shadow.
 */
function buildBranch(mats, sunDir) {
  const r = rng(5151);
  const leaves = new MeshBuilder();
  const twigs = new MeshBuilder();
  const cams = Object.keys(VIEWS).map((v) => makeCamera(v));
  // in frame (with a small margin) for any camera, or mirrored in the floor?
  const inFrame = (p) => cams.some((cam) => [p, new THREE.Vector3(p.x, -p.y, p.z)].some((q) => {
    const s = q.clone().project(cam);
    return s.z < 1 && Math.abs(s.x) < 1.06 && Math.abs(s.y) < 1.06;
  }));
  let kept = 0, dropped = 0;

  // the cluster sits on the sun ray through a point on the wave, this far back
  const target = new THREE.Vector3(-0.8, 0.85, DIM.plateFront);
  const back = sunDir.clone().negate(); // toward the sun
  const centre = target.clone().addScaledVector(back, LOOK.branchDistance);
  // two directions across the sunbeam
  const e1 = new THREE.Vector3().crossVectors(back, new THREE.Vector3(0, 1, 0)).normalize();
  const e2 = new THREE.Vector3().crossVectors(e1, back).normalize();

  const nTwigs = 8;
  for (let k = 0; k < nTwigs; k++) {
    // twigs spread across the beam, a little deeper along it
    let p = centre.clone()
      .addScaledVector(e1, (r() - 0.5) * 1.3)
      .addScaledVector(e2, (r() - 0.5) * 0.9)
      .addScaledVector(back, (r() - 0.5) * 0.5);
    const dir = e1.clone().multiplyScalar(r() - 0.5).addScaledVector(e2, (r() - 0.5) * 0.8).addScaledVector(back, (r() - 0.5) * 0.4).normalize();
    const steps = 4 + Math.floor(r() * 5);
    for (let s = 0; s < steps; s++) {
      dir.add(new THREE.Vector3((r() - 0.5) * 0.6, (r() - 0.5) * 0.4, (r() - 0.5) * 0.6)).normalize();
      const q = p.clone().addScaledVector(dir, 0.09);
      if (!inFrame(p) && !inFrame(q)) rod(twigs, p, q, 0.008 * (1 - s / (steps + 3)));
      p = q;
      const nLeaves = 1 + Math.floor(r() * 3);
      for (let l = 0; l < nLeaves; l++) {
        const lc = p.clone().add(new THREE.Vector3((r() - 0.5) * 0.16, (r() - 0.5) * 0.12, (r() - 0.5) * 0.16));
        // broad, pointed leaves 9-16 cm long
        const len = 0.09 + r() * 0.07, wid = len * (0.45 + r() * 0.15);
        // mostly facing the sun, so their silhouettes read in the shadow
        const nrm = back.clone().addScaledVector(e1, (r() - 0.5) * 1.4).addScaledVector(e2, (r() - 0.5) * 1.4).normalize();
        const ax = new THREE.Vector3().crossVectors(nrm, e2.clone().addScaledVector(e1, (r() - 0.5) * 2)).normalize();
        const ay = new THREE.Vector3().crossVectors(nrm, ax).normalize();
        const outline = [];
        const seg = 12;
        for (let s2 = 0; s2 < seg; s2++) {
          const a = (s2 / seg) * Math.PI * 2;
          const along = Math.cos(a);
          const across = Math.sin(a) * Math.pow(1 - Math.abs(along), 0.45) * (along > 0 ? 0.8 : 1);
          outline.push(lc.clone().addScaledVector(ax, along * len * 0.5).addScaledVector(ay, across * wid * 0.5));
        }
        if (inFrame(lc) || outline.some(inFrame)) { dropped++; continue; }
        kept++;
        const T = new THREE.Vector4(ax.x, ax.y, ax.z, 1);
        const c0 = leaves.vertex(lc, nrm, new THREE.Vector2(0.5, 0.5), T);
        const ring = outline.map((v) => leaves.vertex(v, nrm, new THREE.Vector2(0, 0), T));
        for (let s2 = 0; s2 < seg; s2++) leaves.tri(c0, ring[s2], ring[(s2 + 1) % seg]);
      }
    }
  }
  const g = new THREE.Group();
  g.add(new THREE.Mesh(leaves.build(), mats.leaf));
  g.add(new THREE.Mesh(twigs.build(), mats.twig));
  g.userData.leaves = { kept, dropped, centre: centre.toArray().map((v) => +v.toFixed(2)) };
  return g;
}

// A distant sun as a small rectangle light, so its shadows have a real penumbra.
function makeSun(travelDir, angularDiameterDeg, irradiance, color, target) {
  const distance = 150;
  const size = 2 * distance * Math.tan(THREE.MathUtils.degToRad(angularDiameterDeg) / 2);
  const solidAngle = (size * size) / (distance * distance);
  const light = new THREE.RectAreaLight(new THREE.Color().setRGB(...color), irradiance / solidAngle, size, size);
  light.position.copy(target).addScaledVector(travelDir, -distance);
  light.lookAt(target);
  return light;
}

function dirFromAngles(elevationDeg, azimuthDeg) {
  const el = THREE.MathUtils.degToRad(elevationDeg), az = THREE.MathUtils.degToRad(azimuthDeg);
  // travels toward +x and toward the wall (-z), downward
  return new THREE.Vector3(Math.cos(el) * Math.cos(az), -Math.sin(el), -Math.cos(el) * Math.sin(az)).normalize();
}

/*
 * Dim, warm evening sky for fill light through the window and the open front
 * of the room: lavender overhead, peach at the horizon, brightest toward the
 * low sun in the west (-x), dull warm ground below the horizon.
 */
function makeSky(sunTravel) {
  const tex = new ProceduralEquirectTexture(512, 256);
  const zenith = new THREE.Color().setRGB(0.40, 0.42, 0.56);
  const horizon = new THREE.Color().setRGB(1.0, 0.70, 0.48);
  const ground = new THREE.Color().setRGB(0.14, 0.115, 0.09);
  const toSun = new THREE.Vector3(-sunTravel.x, 0, -sunTravel.z).normalize();
  const dir = new THREE.Vector3();
  const flat = new THREE.Vector3();
  tex.generationCallback = (polar, uv, coord, color) => {
    dir.setFromSpherical(polar);
    const y = dir.y;
    flat.set(dir.x, 0, dir.z).normalize();
    const facing = 0.5 + 0.5 * flat.dot(toSun); // 1 toward the sun, 0 away from it
    if (y >= 0) {
      const t = Math.pow(1 - y, 3.0);
      color.copy(zenith).lerp(horizon, t * (0.45 + 0.55 * facing));
      color.multiplyScalar(0.45 + 0.75 * facing * facing * (0.4 + 0.6 * t));
    } else {
      const t = Math.min(1, -y * 6);
      color.copy(horizon).multiplyScalar(0.4 * (0.5 + 0.5 * facing)).lerp(ground, t);
    }
  };
  tex.update();
  return tex;
}

// ---------------------------------------------------------------------------
// Cameras
// ---------------------------------------------------------------------------

/*
 * A level camera at eye height looking straight at the wall. The distance
 * makes the O fill the requested share of the frame; a vertical lens shift
 * (like a tilt-shift lens) puts the floor line where requested while
 * keeping verticals vertical.
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
  // floor line (y = 0, z = 0) at `floorLine` from the top: solve for the shift
  const ndcFloor = 1 - 2 * v.floorLine;
  const shift = -v.eyeHeight / (camZ * tanV) - ndcFloor; // ndc units, positive moves content down

  const cam = new THREE.PerspectiveCamera(THREE.MathUtils.radToDeg(2 * Math.atan(tanV)), aspect, 0.05, 200);
  cam.position.set(0, v.eyeHeight, camZ);
  cam.lookAt(0, v.eyeHeight, 0);
  // view offset in pixels: negative y moves the frame up. A `crop`
  // ([x, y, width, height] in full-size pixels) renders just that window
  // of the frame, for checking detail at 1:1 without rendering all of it.
  const [cx, cy, cw, ch] = crop || [0, 0, v.width, v.height];
  cam.setViewOffset(v.width, v.height, cx, cy + (-shift * v.height) / 2, cw, ch);
  cam.updateProjectionMatrix();
  cam.updateMatrixWorld(true);
  cam.userData = { tanV, tanH, shift, camZ, focalMm: v.focalMm };
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
    emblemCenter: project(cam, 0, DIM.emblemBase + EMBLEM.heightWorld / 2, zOuter),
    camera: {
      position: cam.position.toArray(),
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
 *    O most of the time, and the halo stays noisy. Here a light is picked in
 *    proportion to a rough guess of its contribution at that point (its area
 *    and facing over distance cubed; zero for lights facing away), and every
 *    probability is accounted for, so the result is still unbiased, just far
 *    less noisy. With only the two distant suns it behaves like the original.
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
		return light.area * facing / ( d2 * sqrt( d2 ) );
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
  scene.add(buildScenery(mats));

  const sunDir = dirFromAngles(LOOK.sunElevation, LOOK.sunAzimuth);
  const sun = makeSun(sunDir, LOOK.sunAngularDiameter, LOOK.sunIrradiance, LOOK.sunColor, new THREE.Vector3(-2.5, 1.5, 0));
  scene.add(sun);
  const branch = buildBranch(mats, sunDir);
  branch.name = 'branch';
  scene.add(branch);
  const led = buildLedLights();
  for (const l of led) scene.add(l);

  scene.background = null; // so the path tracer keeps an alpha channel (coverage)
  scene.environment = makeSky(sunDir);
  scene.environmentIntensity = LOOK.skyIntensity;
  scene.updateMatrixWorld(true);
  STATE.lights = { sun, led, sunBase: sun.intensity };

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
 *   scenery  the glowing sunset photo behind the wall
 *   led      the hidden LED strip behind the plate
 *
 * `groups` maps a group name to a strength (1 = as set in LOOK, 0 = off).
 */
const ALL_GROUPS = ['sun', 'sky', 'scenery', 'led'];

function setLightGroups(groups) {
  const { lights, mats, scene } = STATE;
  const g = (name) => (groups[name] === undefined ? 0 : Number(groups[name]));
  lights.sun.intensity = lights.sunBase * g('sun');
  lights.sun.visible = g('sun') > 0;
  for (const l of lights.led) {
    l.intensity = LOOK.ledRadiance * g('led');
    l.visible = g('led') > 0;
  }
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
  groups = { sun: 1, sky: 1, scenery: 1, led: 1 }, clamp = 0, hide = [], crop = null,
} = {}) {
  const v = VIEWS[view];
  const { renderer, scene, pathTracer: pt, mats } = STATE;
  const W = crop ? crop[2] : Math.round(v.width * scale), H = crop ? crop[3] : Math.round(v.height * scale);
  renderer.setSize(W, H, false);
  const cam = makeCamera(view, crop);
  mats.scenery.matte = matte;
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
  // Chrome queues GPU work without waiting for it; reading back one pixel
  // now and then makes the page wait, which keeps the queue short and the
  // progress honest.
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
    if (pt.samples >= nextSync) {
      sync();
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
window.sceneSettings = () => ({ DIM, LOOK, VIEWS, lightGroups: ALL_GROUPS });
window.__sceneReady = true;

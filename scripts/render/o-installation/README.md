# O installation hero render

This folder builds the hero still for the ROUANG home page: a path-traced
"photograph" of an architectural installation. A warm-grey exposed-concrete
wall has the ROUANG O cut into it. The O is framed in cream microcement, lit
by a hidden LED strip and by low golden-hour sun coming through louvres. A
polished concrete floor runs in front of it.

The scene is entirely made up. It shows no real place, building or
landscape. The only outside inputs are the client's own O emblem
(`mark.svg`) and the client's scenery photo (`scenery-source.jpg`), which
shows through the opening.

## What it makes

| File | What it is |
| --- | --- |
| `public/images/hero/o-installation-desktop.webp` | 2560 x 1440 render. Alpha is 0 exactly where the scenery shows through the opening, with a soft anti-aliased edge, and 1 everywhere else. The RGB is lossy WebP at quality 90 and the alpha is lossless. No metadata. Quality 90 is used rather than 82 because at 82 the encoder smooths away the concrete's fine grain and pores. The file is still about 210 KB, well under the 650 KB budget (500 KB for portrait). Use `--webp-quality` to change it. |
| `public/images/hero/o-installation-portrait.webp` | The same scene framed for phones, 1290 x 2796. |
| `public/images/hero/o-scenery.jpg` | The client's scenery photo, enlarged to 2560 x 1440 with Lanczos resampling and a very light unsharp mask, and otherwise left alone. sRGB, quality 88, no metadata. The site places it behind the WebP. |
| `public/images/hero/o-installation.json` | Where things fall in each image, so the site can line up the photo, outlines and text. The fields are described below. |
| previews (see `--previews`) | Images for judging the render. See below. |

The site layers the images like this. `o-scenery.jpg` goes at the back. It is
scaled to cover the hero, then reduced to `sitePhotoPlacement.scale` of that
cover size (0.8 on desktop, 0.45 on phones) and centred on
`views.<view>.seeThrough.center`. The WebP goes on top. The opening in the
WebP is transparent, so the original photo shows through it at full quality.
The render's own scenery is only used to light the frame. It never appears
on the site.

## How to run it

```
node scripts/render/o-installation/render.cjs \
  --tools <folder with node_modules/three, three-gpu-pathtracer, three-mesh-bvh> \
  --puppeteer <path to puppeteer-core> \
  --cache <scratch folder for raw renders> \
  --previews <folder for preview images>
```

With no options it renders both views at full size and writes the site files.
The steps are:

1. `textures.cjs` generates the procedural textures into `textures/`, if they
   are missing. It takes about 1.5 minutes. Run `node textures.cjs --force`
   to rebuild them.
2. A small web server starts on a random port, on 127.0.0.1 only. It serves
   this folder, and the render tools at `/nm/`. The page needs it because ES
   modules will not load from `file://`.
3. Headless Chrome opens `index.html`. For each view and each pass it calls
   `window.renderStill()`, which path-traces the image on the GPU. It then
   calls `window.renderMatte()`, which rasterises the see-through matte.
4. Node "develops" the raw float images. It adds up the passes, applies
   exposure, AgX tone mapping, a very slight vignette and fine film grain,
   and takes the alpha from the matte.
5. It writes the files listed above and stops the server.

Useful options:

| Option | Default | Meaning |
| --- | --- | --- |
| `--views desktop,portrait` | both | which framings to render |
| `--samples N` | 1536 | samples per pixel for each pass |
| `--pass-samples '{"led":640}'` | as shown | per-pass sample counts |
| `--passes main,led` | as shown | which light groups to render, as separate passes (see below) |
| `--clamp '{"led":2}'` | main 8, led 2 | ceiling on the light a single path may carry, per pass |
| `--weights '{"led":0.8}'` | none | strength of a pass when developing, on top of the defaults in `GRADE.mix` |
| `--exposure 0.3` | 0 | extra exposure in stops |
| `--scale 0.5` | 1 | render smaller, for tests. Results go to the previews folder only. |
| `--develop-only` | off | re-develop cached renders without rendering again, e.g. to try other weights |
| `--batch N` | 128 | samples per batch (see "Long renders" below) |
| `--fresh` | off | start the passes again instead of resuming from the cache |
| `--tiles 4,4` | 4,4 | how many pieces each sample is drawn in, so no single GPU call runs long |
| `--tag name` | none | extra name for cached renders and previews, for look development |
| `--profile <folder>` | none | Chrome profile folder. Reusing one caches the compiled shaders, which saves about a minute per run. |
| `--chrome <exe>` | Chrome's default Windows path | the browser to use |
| `--webp-quality N` | 90 | WebP colour quality |
| `--grade '{"contrast":0.1}'` | none | override any develop setting in `GRADE` (exposure, white balance, vignette, grain, contrast, mix) |
| `--crop x,y,w,h` | none | render only this window of the full-size frame, to check detail at 1:1 (look development) |
| `--hide branch` | none | leave named objects out (look development) |
| `--show-scenery` | off | let the camera see the glowing scenery plane instead of cutting it out (debugging) |

Time: on an Intel Arc 140V a full-size pass costs about 1.5 s per sample. The
defaults are 1536 samples for the main pass and 640 for the LED pass, which
comes to about 55 minutes per view.

### Long renders

Each pass is rendered in batches of `--batch` samples. After every batch the
runner adds the result to a running mean in the cache folder
(`<view>-s1-<pass>.f32`, with its sample count in `<view>-s1-<pass>.json`).
The GPU driver sometimes resets during long renders, which loses the WebGL
context. When that happens the runner reopens Chrome and redoes that batch.
If a run is interrupted, starting it again with the same `--cache` resumes
each pass where it stopped, and a pass that already has enough samples is
skipped. Use `--fresh` after changing the scene, or delete the cache.

### Tools it needs

- Node 24.
- Google Chrome. Headless Chrome must expose WebGL2 with float colour
  buffers. It is launched with `--use-angle=d3d11 --enable-gpu
  --ignore-gpu-blocklist`.
- `puppeteer-core` (tested with 24.43).
- `three@0.187.0`, `three-gpu-pathtracer@0.0.28` and `three-mesh-bvh@0.9.18`,
  all MIT-licensed. Install them in a separate folder with
  `npm init -y && npm install three@0.187.0 three-gpu-pathtracer three-mesh-bvh`
  and pass that folder as `--tools`. They are not website dependencies.
- `sharp`, taken from the website's own `node_modules`.

## How the render works

All of this is in `scene.js`. Units are metres. x points right, y up, and z
toward the camera.

- **The emblem.** `mark.svg` is read with three.js's `SVGLoader`, and its two
  subpaths are used exactly as drawn. The only changes are scaling to 3.0 m
  wide and flipping the y axis. The outer contour bounds the frame. The
  inner contour, with its curved intrusion, bounds the opening.
- **The frame.** A front plate in the exact O shape stands 11.5 cm proud of the
  wall: a 4 cm shadow gap, then a 7.5 cm plate. Its edges are rounded. Behind
  it, a lining carries the inner contour back through the 50 cm wall, so the
  wave becomes a sculpted surface.
- **The LED.** A strip sits behind the plate near its outer edge, facing the
  wall, and washes a halo onto the concrete around the O. It is modelled as
  56 small rectangular area lights, one per straight piece of the strip.
  Neither the camera nor the floor reflection can see the strip itself.
- **The light.** A low warm sun (24° up) shines through a louvred window
  off-camera to the left. It lays diagonal bands across the left of the
  wall, the frame and a little of the floor. In that sunbeam, out of frame,
  stands the branch of an indoor tree. Only its soft leaf shadows appear,
  across the wave. From eye level the camera sees the wave as the front face
  of the plate, so this dapple has to come from the front. Leaves that either
  camera could see, directly or reflected in the floor, are left out. A dim
  evening sky gives fill light. The scenery photo glows on a large plane
  12 m behind the wall, so warm sunset light comes in through the opening
  onto the frame's inner faces. All bounce light comes from the path tracer.
- **Light groups.** Light adds up linearly, so the image is rendered as separate
  passes and summed. `main` holds the sun, sky and scenery, and `led` holds
  the LED. Each pass gets the sample count it needs, and the LED's strength
  can be fine-tuned afterwards with `--weights` or `GRADE.mix`. The single
  groups (`sun`, `sky`, `scenery`) can also be rendered on their own for look
  development.
- **Shader patch.** `patchPathTracerShader()` makes two text changes to the
  path tracer's shader at run time. The installed package is not modified.
  First, it picks the light for each shadow ray in proportion to that light's
  likely contribution, instead of picking uniformly. This matters for the 56
  LED pieces and keeps the result unbiased. Second, it adds an optional
  per-path clamp against stray fireflies.
- **The matte.** The scenery plane is drawn white and everything else black
  with the ordinary WebGL rasteriser at 4x the size. It is then reduced with
  the same 2-pixel tent filter the path tracer uses for its pixels, so the
  matte's edge lines up with the render.
- **Textures.** `textures.cjs` builds them from seeded noise, so every run
  gives the same textures. Each one covers several metres at 4096 px, so
  nothing repeats in view. There are three:
  - the wall: pores, bug holes, sand grain, blotchy tonal mottling, faint
    vertical formwork joints with slight colour shifts between panels, and
    very faint form-tie holes
  - the floor: darker and finer, with polished aggregate specks, two saw
    joints, a few hairline cracks, and roughness that varies so reflections
    break up
  - the plaster: subtle trowel strokes, matte

  `textures/` is generated (about 50 MB) and ignored by git.

## o-installation.json

All positions are normalised image coordinates: 0..1 of the image's width
and height, with the origin at the top left. Each view (`views.desktop`,
`views.portrait`) has the fields below.

| Field | Meaning |
| --- | --- |
| `file`, `width`, `height` | the image and its size in pixels |
| `outer` | the emblem's outer edge, i.e. the silhouette of the front plate. `x`, `y`, `width`, `height` give its bounding box and `center` its centre. `depth` is the z (m) of the edge the camera sees. `svgToImage` is the exact mapping from `mark.svg` coordinates to image coordinates at that depth: `image_x = scaleX * svg_x + offsetX` and `image_y = scaleY * svg_y + offsetY`. Apply it to the mark's outer subpath and it traces the outer edge. |
| `innerFront` | the emblem's inner edge at the front, where the rounded lip meets the opening. It has the same fields as `outer`. Its `svgToImage` maps the mark's inner subpath, wave included, onto that edge. |
| `tunnelExit` | the inner contour at the back of the wall, with the same fields. |
| `seeThrough` | the region where the scenery shows, measured from the matte, i.e. pixels with alpha below 0.5. It has a bounding box, a `center` (the centre of that box), a `centroid` (weighted by alpha) and `areaFraction`, the share of the image it covers. Centre the scenery photo on `center`. |
| `emblemCenter` | the centre of the emblem's outer bounding box |
| `floorLine` | the y of the line where the wall meets the floor |
| `innerContourPoints` | 24 points spread along the inner contour. Each has `svg` (its position in `mark.svg`) and `image` (where it lands at the `innerFront` depth). Use them to check an outline's alignment, or to fit one. |
| `camera` | position (m), look direction, vertical and horizontal field of view (degrees), focal length (mm, full-frame equivalent), and the vertical lens shift (`verticalShiftNdc` in normalised device units; `verticalShiftFrame` as a share of the frame height). The camera is level and looks straight at the wall. |
| `render` | samples per pass and the size actually rendered |

The top level also has `markViewBox` and `sitePhotoPlacement`, the rule the
previews use to place the photo.

## Previews

For each view the runner writes these images:

- `*-composite.jpg` (and a half-size copy): the render over the original
  photo, placed the way the site does it
- `*-crop-concrete-left.png`, `*-crop-concrete-right.png`,
  `*-crop-frame-wave.png`, `*-crop-floor.png`: 1:1 crops
- `*-matte.png`: the see-through matte
- `*-silhouette.jpg`, `*-silhouette-crop.png`: the exact `mark.svg` outline,
  placed by the JSON, drawn in thin red at the outer edge and at the front
  inner edge, with the tunnel exit in dashed blue

## Files

- `index.html`: the render page, with an import map pointing at `/nm/`
- `scene.js`: the scene, materials, lights, cameras, the path tracer set-up,
  and the API the runner calls
- `textures.cjs`: the procedural PBR textures
- `render.cjs`: the runner
- `mark.svg`, `scenery-source.jpg`: the client's inputs

# Studio exploded house

This folder turns the client's exploded-house drawing into layered vector artwork
for the home page's Studio section, beside the large word "built". As the visitor
scrolls, the roof and the upper floor come down onto the ground floor until the
house is whole.

The drawing is a generic house that was generated with an AI image tool (its PDF
carries content credentials saying so). It is not a ROUANG project. Never caption
it or present it as one. The PDF stays outside the repo, and nothing from it is
copied in except the converted line work.

```
node scripts/studio-house/build.mjs <path/to/drawing.pdf> [--out <dir>] [--tolerance 0.35]
```

The script uses Node built-ins only. It writes to `public/images/studio/` and
prints what it measured, plus each file's size raw and gzipped.

## What it makes

| File | What it is |
| --- | --- |
| `house-roof-lines.svg`, `house-upper-lines.svg`, `house-ground-lines.svg` | Each layer's line work, one even-odd path, filled `#f3f3f3`. |
| `house-roof-solid.svg`, `house-upper-solid.svg`, `house-ground-solid.svg` | The area each layer covers, with its holes filled, in `#404732`. Painted under a layer's lines, it hides whatever lies behind that layer, the way a solid house would. |
| `house-guides-upper.svg`, `house-guides-lower.svg` | The dashed guides. The upper set hangs between the roof and the upper floor, the lower set between the upper floor and the ground floor (plus one short run inside the ground floor). |
| `house.json` | The manifest: shared viewBox, file names, bounding boxes, paint order, assembled pose, guide runs and the measurements behind them. |

All the SVGs share one viewBox (`0 0 1810 2866`, in half pixels of the traced
drawing), so they stack exactly. They hold one `<path>` each and no metadata or
comments. Fills are fully opaque, so each file also works as a CSS `mask-image`
(alpha mask), with the colour coming from CSS. This was checked in Chrome.

## Putting it on the page

- Paint in `paintOrder` from the manifest: ground solid, ground lines, lower
  guides, upper solid, upper lines, upper guides, roof solid, roof lines.
- At progress `p` (0 = exploded as drawn, 1 = assembled), a layer's point
  `(x, y)` moves to `y + p * (assembled.y + tan(skewY) * (x - originX))`, and `x`
  never changes. The ground floor stays put. The upper floor only translates.
  In CSS, with the element sized to the viewBox at scale `s` (CSS px per unit):
  `transform-origin: <originX / 1810 * 100>% 0;`
  `transform: translateY(calc(var(--p) * <assembled.y * s>px)) skewY(calc(var(--p) * <skewY>deg));`
- The roof gets a small shear (3.6°) because the drawing's roof is turned a
  little against the floors. With the shear, both eaves sit on the walls. If
  only a translation is wanted, use `assembled.yWithoutSkew`. The roof then
  floats about 22 drawing pixels (44 units) above the right-hand wall and cuts
  the same amount into the left one.
- The upper guides travel with the upper floor and the lower ones stay with the
  ground floor. Fade both out as the gaps close, by about `p = 0.6`. No layering
  makes them vanish on their own.
- The solids are the studio green. If the ground behind the house is not that
  flat colour, paint them in whatever colour lies behind them, or use them to
  knock the lower layers out.

## How it works

1. **Read the PDF.** The script decodes the page content (ASCII85, then
   Flate). The page holds one background rectangle and one even-odd filled path:
   about 2,100 closed subpaths of straight lines, traced from a raster on a
   0.7543 pt grid.
2. **Snap to the grid.** The script fits the grid step and origin, then snaps
   every point to whole grid steps (the worst error before snapping is 0.0007
   of a step). It flips y so that it points down and crops to the drawing.
3. **Shapes.** It nests the rings (even depth is ink, odd depth is a hole). A
   shape is an outer ring with its holes. Every shape goes to exactly one layer:
   - dashes in the six guide columns go to the guides;
   - every other shape goes to the roof, the upper floor or the ground floor,
     depending on which side of the gaps between the three big outlines it lies.
4. **Simplify.** The trace climbs every slanted line in pixel steps. Each ring is
   cut wherever its steps use more than two neighbouring directions: at real
   corners, chamfers, pinches and hairs, which stay exactly where they are.
   Between the cuts, the line is fitted through the middles of the steps
   (Douglas-Peucker, tolerance 0.35 of a pixel). That keeps every stroke its own width.
   The result is then checked against the exact trace, both for crossing
   outlines and as a blurred picture. Wherever it would cross, fade, break or
   sprout a needle, the outline there stays exact, and the check repeats until
   both tests pass. Against the original at 2x, the picture changes by at most
   half a pixel along edges: only 0.003% of the ink lies further away than that.
5. **Assembled pose.** The drops are measured where the layers meet:
   All figures are in drawing pixels; the manifest doubles them.
   - The upper floor's slab corners drop onto the ground floor's wall-top
     corners: 295 on the left and 292 on the right, so 293.5.
   - The roof's underside drops onto the upper floor's wall tops: 253.5 at the
     left guide and 297 at the right corner. That gives the shear.

## Checking a run

There is no automatic visual test. After a change, stack the files in a browser
(they share the viewBox) and look at them. At `p = 0` the stack must match the
PDF. At `p = 1` it must read as one house, with the roof on the upper floor's
walls and the upper floor on the ground floor's walls.

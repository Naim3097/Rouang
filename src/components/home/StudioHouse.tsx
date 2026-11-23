import type { CSSProperties } from "react";

/* ——— 02 Studio: the house beside "built" ———
 * A generic exploded drawing of a two-storey house (roof, upper floor, ground floor, with dashed
 * guides between them), drawn in Milky White line on the green. Purely decorative: it shows no
 * ROUANG project and carries no caption. As the visitor scrolls, the upper floor settles onto the
 * ground floor, then the roof onto it, until the house stands whole (styles/home/studio.css).
 *
 * The artwork is the layered line work in public/images/studio/ (scripts/studio-house/), used as
 * CSS masks so the colour comes from the stylesheet. All the files share one viewBox, 1810 × 2866
 * units, and every layer here is a box the size of that viewBox.
 *
 * The house is solid: what a higher layer stands in front of is hidden. Rather than paint the
 * layers' silhouettes in a flat green, which would show as patches on the field's light and grain,
 * each silhouette cuts the lower layers' lines away, so the field itself shows through. A layer's
 * silhouette moves with that layer, so the lower layers sit inside a frame that moves with it
 * (masked by its silhouette) and a frame that undoes the move. The guides hang from the higher
 * layer and are fixed to the lower one: each is clipped at its top in the higher layer's frame, so
 * it shortens as the gap closes and is gone as the layers meet.
 *
 * The drawing is there twice. The first copy moves; the second stands whole and still, and takes
 * its place once it has come together. Kept apart as moving layers, the slant of the roof would
 * leave the lines under it a little soft; the still copy is one picture, drawn ahead of time, so
 * nothing has to be redrawn at the moment the two change places.
 */

// Guide runs from public/images/studio/house.json, in viewBox units: x, top, bottom.
const upperGuides: [number, number, number][] = [
  [223, 556, 1046],
  [535, 566, 886],
  [829, 770, 896],
  [1217, 552, 740],
  [1601, 360, 918],
];
const lowerGuides: [number, number, number][] = [
  [223, 1334, 1896],
  [535, 1480, 1730],
  [829, 1436, 1576],
  [1123, 1422, 1460],
  [1217, 1374, 1508],
  [1601, 1170, 1712],
];
// The one run that stays within the ground floor (the main block's corner down to the carport).
const groundGuide: [number, number, number] = [1601, 2032, 2114];

function Guide({ run, set }: { run: [number, number, number]; set: "upper" | "lower" | "ground" }) {
  const [x, top, bottom] = run;
  // A strip 16 units wide around the run, 2 units of margin top and bottom.
  const style = { "--gx": x - 8, "--gy": top - 2, "--gh": bottom - top + 4 } as CSSProperties;
  return (
    <div className={`studio-house-guide studio-house-guide-${set}`} style={style}>
      <div />
    </div>
  );
}

/** The three layers, each lower one cut away where a higher one stands; with the guides if asked. */
function Layers({ guides }: { guides: boolean }) {
  return (
    <>
      {/* Everything the roof stands in front of, cut away where the roof is. */}
      <div className="studio-house-frame studio-house-roof studio-house-under-roof">
        <div className="studio-house-frame studio-house-roof-undo">
          {/* Everything the upper floor stands in front of, cut away where it is. */}
          <div className="studio-house-frame studio-house-up studio-house-under-up">
            <div className="studio-house-frame studio-house-up-undo">
              <div className="studio-house-ink studio-house-ground" />
              {guides && <Guide run={groundGuide} set="ground" />}
            </div>
            {guides && lowerGuides.map((run) => <Guide key={run[0]} run={run} set="lower" />)}
          </div>
          <div className="studio-house-frame studio-house-up">
            <div className="studio-house-ink studio-house-upper" />
          </div>
        </div>
        {guides && upperGuides.map((run) => <Guide key={run[0]} run={run} set="upper" />)}
      </div>
      <div className="studio-house-frame studio-house-roof">
        <div className="studio-house-ink studio-house-roof-lines" />
      </div>
    </>
  );
}

export function StudioHouse() {
  return (
    <div className="studio-house" aria-hidden="true">
      <div className="studio-house-art">
        <div className="studio-house-stack studio-house-moving">
          <Layers guides />
        </div>
        <div className="studio-house-stack studio-house-still">
          <Layers guides={false} />
        </div>
      </div>
    </div>
  );
}

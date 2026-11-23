import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import type { Project } from "@/lib/content";
import { publicImage } from "@/lib/content";
import { RevealFocus } from "./RevealFocus";
import { ShowcasePointer } from "./ShowcasePointer";

/**
 * 01 Work, the second movement: the other projects, straight after the flagship, as a row of
 * photographs the full height of the screen, after the client's reference. At rest every card shows
 * its photograph in grey under a dark veil, with only its name (and "Design proposal" on a proposal)
 * set sideways in the middle of the card. Hovering or focusing a card opens it: it widens a little
 * while the others narrow, its photograph comes up to full colour, the sideways words fade and the
 * write-up (name, facts and, on a proposal, its label) rises into the middle of the card, the same
 * place on every card, with no shade behind it (SPOTS). The pointer leaving the row closes it again.
 * Touch screens have no hover: on a large one held on its side the row holds while the page scrolls
 * and the cards open one after another, left to right; on phones and upright tablets the cards are
 * stacked and the one at the middle of the screen opens as it passes. On large landscape screens the
 * cards rise into place one by one as the row comes up the screen. A pointer resting while the cards
 * move under it does not open them (ShowcasePointer). Layouts, motion and fallbacks are in
 * styles/home/showcase.css.
 */

/**
 * How much wider than the others the open card grows: its share of the row, against one for each of
 * the others (2: 40% of a row of four). Chosen by capture against 3 (the reference's) and 1.6, at
 * 1280–1920.
 */
const GROW = 2;

/**
 * How each photograph is framed so that the write-up, which stands in the middle of every card, falls
 * on a part of the open, full-colour picture where it reads by itself (no shade, panel or gradient
 * behind it). `x` and `y` are the point of the picture the crop keeps in view (0 its left or top edge,
 * 1 its right or bottom), as for object-position: a picture can only move as far as its edges allow,
 * so a tall picture in a tall card keeps its middle where it is. `ink` sets the words in ink on a
 * pale picture; otherwise they are Milky White, as on the resting cards. Each crop is the one that
 * measured best, every line against the brightest (white words) or darkest (ink words) pixel behind
 * it at every card size; AA is 4.5:1 for the facts and the label, 3:1 for the name (large text, 26px
 * and up). Kota Warisan, on the patterned panel above the bed, clears it everywhere by about two
 * times. Three do not, at the middle of any crop of these photographs (docs/VISUAL-DIRECTION.md has
 * the figures): Seri Wirani by a few dark pixels of the garden fence, Warung Soho's label on the
 * counter top, and Ampang, whose middle is the lit glass of its doors. `row` is the row of four on
 * large landscape screens, `pair` the two across of tablets (and the resting crop of a phone on its
 * side, where the cards stay at rest: styles/home/showcase.css), `phone` one across; each falls back
 * to `pair`, then `row`. A photograph not listed has ink words in the middle of a centred crop.
 */
type Spot = { x: number; y: number; ink?: true };
type Regime = "row" | "pair" | "phone";
const SPOTS: Record<string, { row: Spot } & Partial<Record<Regime, Spot>>> = {
  // The doors held in the middle; white words on their glass, ink reading no better.
  "ampang-arched-doors": {
    row: { x: 0.5, y: 0.5 },
  },
  // The pale wall under the garden fence, beside the window.
  "seri-wirani-dining": {
    row: { x: 0.025, y: 0.5, ink: true },
    pair: { x: 0.05, y: 0.5, ink: true },
  },
  // The pale patterned panel above the bed.
  "kota-warisan-guest-room": {
    row: { x: 0.35, y: 0.5, ink: true },
  },
  // The left of the room: the dark grey wall beside the mural, the shelves behind the counter.
  "warung-soho-dining": {
    row: { x: 0, y: 0.5 },
  },
};

/** The spot as custom properties on the card, read by styles/home/showcase.css. */
function spotStyle(name: string | null, aspect: number | null) {
  const style: Record<string, number> = {};
  // A card whose photograph is still to come keeps white words on its dark ground.
  if (!name || !aspect) return { "--w": 1 };
  style["--ar"] = +aspect.toFixed(4);
  const spots = SPOTS[name];
  if (!spots) return style;
  for (const regime of ["row", "pair", "phone"] as const) {
    const suffix = regime === "row" ? "" : `-${regime}`;
    const s = spots[regime];
    if (!s) continue;
    style[`--x${suffix}`] = s.x;
    style[`--y${suffix}`] = s.y;
    style[`--w${suffix}`] = s.ink ? 0 : 1;
  }
  return style;
}

export function Showcase({ projects }: { projects: Project[] }) {
  // Four cards at most on the home page, one row on large screens; the rest live on /projects.
  const shown = projects.slice(0, 4);
  return (
    <div data-tone="dark" className="showcase-scene relative">
      <div className="showcase-stage">
        <ol
          className="showcase-list"
          aria-label="More projects"
          style={{ "--n": shown.length, "--grow": GROW } as CSSProperties}
        >
          {shown.map((p, nth) => {
            const img = publicImage(p.card ?? p.hero);
            const photo = img && !("pending" in img) ? img : null;
            const name = photo?.src.split("/").pop()?.replace(/\.\w+$/, "") ?? null;
            const aspect = photo ? photo.width / photo.height : null;
            return (
              <li key={p.slug} className="showcase-tile" style={{ "--nth": nth } as CSSProperties}>
                {/* The window the card is seen through as it widens and narrows in the row. */}
                <div className="showcase-window">
                  {/* The whole card is the link: one tab stop, named by its write-up. */}
                  <Link
                    href={`/projects/${p.slug}`}
                    className="showcase-card"
                    style={spotStyle(name, aspect) as CSSProperties}
                  >
                    {photo && aspect ? (
                      <div className="showcase-photo" aria-hidden="true">
                        <Image
                          src={photo.src}
                          alt=""
                          width={photo.width}
                          height={photo.height}
                          sizes={coverSizes(aspect, shown.length)}
                          quality={78}
                        />
                      </div>
                    ) : null}
                    <SideWords project={p} />
                    <CardWords project={p} />
                  </Link>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
      {/* 85% through the pinned run: every card has landed by a third of the way in. */}
      <RevealFocus scene=".showcase-scene" settle={0.85} />
      <ShowcasePointer />
    </div>
  );
}

/**
 * The resting card's words, set sideways up its left side, reading from the bottom: the name in
 * Light and, on a proposal, its label beside it, since the picture is in view in every state. A copy
 * for the eye only; the write-up below is the card's own.
 */
function SideWords({ project: p }: { project: Project }) {
  return (
    <div className="showcase-side" aria-hidden="true">
      <span className="showcase-side-name">{p.title}</span>
      {p.visualisation ? <span className="t-label">Design proposal</span> : null}
    </div>
  );
}

/**
 * The open card's write-up, in the middle of the card: the name, the facts and, on a proposal, its
 * label. No "View project": the whole card is the link, and a fourth line would stand on more of the
 * picture, where the words are already short of clear ground on three of the four (measured). The
 * link reads "Seri Wirani, House · Bangi, Design proposal".
 */
function CardWords({ project: p }: { project: Project }) {
  // "House: refurbishment and extension" reads as "House" here; the case study has the rest.
  const facts = [p.type.split(":")[0].trim(), p.location?.split(",")[0].trim()].filter(Boolean).join(" · ");
  return (
    <div className="showcase-words">
      <h3 className="showcase-name t-headline">{p.title}</h3>
      {facts ? <p className="showcase-facts t-meta">{facts}</p> : null}
      {p.visualisation ? <p className="showcase-label t-label">Design proposal</p> : null}
    </div>
  );
}

/**
 * `sizes` for a photograph covering a card, as wide as it is drawn in the card's widest state, so it
 * is never asked for again at a new size while the cards widen and narrow. In the row a photograph
 * is drawn at a fixed width, the open card's (GROW parts of GROW + the other cards' one each) or as
 * wide as the full-height picture, whichever is wider, and the card only shows more or less of it.
 * The row is the full height of the screen: at most 100vw on a landscape screen squarer than 4:3,
 * 75vw from 4:3 and 66.7vw from 3:2. A tablet card is half the width and 58svh of an upright screen
 * (about 83vw); a phone card the full width and 76svh (about 164vw).
 */
function coverSizes(aspect: number, cards: number) {
  const open = (100 * GROW) / (GROW + cards - 1);
  const vw = (card: number, height: number) => `${Math.ceil(Math.max(card, height * aspect))}vw`;
  return [
    `(min-width: 64rem) and (orientation: landscape) and (max-aspect-ratio: 133/100) ${vw(open, 100)}`,
    `(min-width: 64rem) and (orientation: landscape) and (max-aspect-ratio: 3/2) ${vw(open, 75)}`,
    `(min-width: 64rem) and (orientation: landscape) ${vw(open, 66.7)}`,
    `(min-width: 40rem) ${vw(50, 83)}`,
    vw(100, 164),
  ].join(", ");
}

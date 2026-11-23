import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { RevealFocus } from "@/components/home/RevealFocus";
import { ButtonLink } from "@/components/ui/Button";
import { Crosses, Pending, Section } from "@/components/ui/Section";
import { Label, TitlePair } from "@/components/ui/Typography";
import type { Project } from "@/lib/content";
import { publicImage } from "@/lib/content";
import { SHOW_DRAFTS } from "@/lib/env";

/* ——— 04 Inside a project: a walk into the flagship, one room opening in the middle of the last ——— */

const ROLE_LABEL = { space: "Space", material: "Material", whole: "Whole" } as const;

/**
 * The walk, in the order it is taken: from the dining room in to the grain of the timber, so each
 * step forward is also a step closer. Real photographs of the finished interior only, and not the
 * ones 01 Work and What we do already show. Each caption says only what its photograph shows.
 * `focus` places the photograph when the screen crops it (object-position): on a landscape screen
 * these upright photographs show only a band about a third of their height.
 * The walk opens on the dining room under the glazed gable, whose band holds the timber screens,
 * the pendants, the chairs and the glass wall, the clearest room of the set; it is held longest.
 */
const WALK = [
  {
    file: "rembayung-gable-dining",
    caption: "Dining beneath the glazed gable: rattan-backed chairs, slatted timber screens and rattan pendants.",
    focus: "50% 48%",
  },
  {
    file: "rembayung-brick-wall",
    caption: "Batik set into timber screens against the brick wall, beside stained glass in green and blue.",
    focus: "50% 34%",
  },
  {
    file: "rembayung-service-counter",
    caption: "The service counter: a slatted timber front, set with panels of patterned glass.",
    focus: "50% 38%",
  },
  {
    file: "rembayung-batik-shelves",
    caption: "Batik, folded on open timber shelves.",
    focus: "50% 56%",
  },
  {
    file: "rembayung-counter-edge",
    caption: "A timber counter, detailed with a routed edge.",
    focus: "50% 50%",
  },
] as const;

/**
 * Each room is a stack of discs, like terraces seen from above: the photograph's own disc on top and
 * four rings stepping down and out beneath it. Every disc is a print of the room's photograph at its
 * own size, so the picture steps at each edge, and each ring sits a shade darker than the one it
 * carries (inside.css draws them from --j, the disc's place counted out from the photograph, 0 to
 * TIERS - 1). Round 5 also tried rings alternating between the room being left and the room opening:
 * the screen flicked back to the last room at every other step, so every ring carries its own room.
 */
const TIERS = 5;

/**
 * Scroll given to each move of the walk, in svh. Every move is a single disc stepping out with a firm
 * ease and then holding, so the walk goes in steps. A room opens over the last in three beats: its
 * stack is built from the middle out, the photograph's disc first and each ring stepping out from
 * under it (BUILD each), and held a moment (BREATH); then its discs sweep out past the edges of the
 * screen one at a time, the outer ring first and the photograph last (MOVE each, REST between), until
 * the room fills the screen; then a pause in that room (HOLD). The first room is already stacked on
 * the plate, so it only sweeps open, after a short LEAD while the title steps out; the last room is
 * held longest before the page moves on.
 */
const LEAD = 6;
const BUILD = 2.5;
const BREATH = 5;
const MOVE = 6;
const REST = 3.5;
const HOLD = 16;
const HOLD_LAST = 26;

/**
 * One room's stack of discs, the outer ring first in the document so each disc lies over the one
 * outside it. The photograph printed on all five is one download: every print of it has the same src
 * and sizes. `times` places each disc's moves on the pinned run; the photograph's own disc carries
 * `children` (the shade for the caption and the dimming). Each disc sits in a step of its own
 * (inside-step), which carries the move that builds the stack, so that the disc and its step each
 * have one move of their scale and both can run on the compositor.
 */
function Tiers({
  frame,
  sizes,
  times,
  children,
}: {
  frame: Frame;
  sizes: string;
  times?: (j: number) => CSSProperties;
  children?: ReactNode;
}) {
  return Array.from({ length: TIERS }, (_, k) => {
    const j = TIERS - 1 - k;
    return (
      <div key={j} className="inside-step" style={{ ["--j" as string]: j, ...times?.(j) }}>
        <div className="inside-tier">
          <Image src={frame.src} alt="" fill sizes={sizes} className="object-cover" style={{ objectPosition: frame.focus }} />
          {j > 0 ? <div className="inside-tone" /> : children}
        </div>
      </div>
    );
  });
}

type Frame = {
  src: string;
  alt: string;
  role: string;
  caption: string;
  focus: string;
};

/**
 * Where each room's moves sit on the pinned run, as custom properties for styles/home/inside.css.
 * Per disc (`tier`): it steps out from under the disc inside it over b0..b1 and sweeps out past the
 * edges of the screen over p0..p1. Per room (`frame`): it fills the screen at o-b (its rings dropped
 * by o-c; the shade for its caption coming up over vi..ci, the caption itself over ci..o-b), and it
 * gives way to the next room from n-a (darkening while the next stack is built, to n-d, as its caption
 * leaves, by co; the room itself dropped once the next room's outer ring covers it, g-a..g-b).
 */
function walkTimes(n: number) {
  const sweep = TIERS * MOVE + (TIERS - 1) * REST;
  const lead = (i: number) => (i === 0 ? LEAD : TIERS * BUILD + BREATH);
  const hold = (i: number) => (i === n - 1 ? HOLD_LAST : HOLD);
  const starts: number[] = [];
  const run = Array.from({ length: n }, (_, i) => i).reduce((at, i) => (starts.push(at), at + lead(i) + sweep + hold(i)), 0);
  const pct = (v: number) => `${((v / run) * 100).toFixed(3)}%`;
  const peel = (i: number) => starts[i] + lead(i);
  const open = (i: number) => peel(i) + sweep;

  const frame = starts.map((a, i): CSSProperties => {
    const next = i + 1 < n ? starts[i + 1] : null;
    const at = (v: (b: number) => number) => (next === null ? "100%" : pct(v(next)));
    return {
      ["--o-b" as string]: pct(open(i)),
      ["--o-c" as string]: pct(open(i) + 0.5),
      ["--vi" as string]: pct(open(i) - MOVE),
      ["--ci" as string]: pct(open(i) - MOVE * 0.4),
      ["--n-a" as string]: at((b) => b),
      ["--n-d" as string]: at((b) => b + TIERS * BUILD),
      ["--co" as string]: at((b) => b + TIERS * BUILD * 0.6),
      ["--g-a" as string]: at(() => peel(i + 1) + MOVE),
      ["--g-b" as string]: at(() => peel(i + 1) + MOVE + 0.5),
    };
  });
  // Disc j of room i: built inside out, swept outside in.
  const tier = (i: number) => (j: number): CSSProperties => {
    const b0 = starts[i] + j * BUILD;
    const p0 = peel(i) + (TIERS - 1 - j) * (MOVE + REST);
    return {
      ["--b0" as string]: pct(b0),
      ["--b1" as string]: pct(b0 + BUILD),
      ["--p0" as string]: pct(p0),
      ["--p1" as string]: pct(p0 + MOVE),
    };
  };
  const scene: CSSProperties = {
    ["--run" as string]: `${run}svh`,
    ["--intro-out" as string]: pct(LEAD + MOVE * 0.6),
  };
  // Where keyboard focus entering the scene moves the page to: the first room open, its caption in.
  const settle = (open(0) + hold(0) / 2) / run;
  return { frame, tier, scene, settle };
}

const STEPS: Record<number, string> = { 3: "Three", 4: "Four", 5: "Five" };

const count = (i: number, n: number) => `${String(i + 1).padStart(2, "0")} / ${String(n).padStart(2, "0")}`;

/**
 * How wide every disc of the walk is drawn at its widest: a square whose inscribed circle reaches the
 * farthest corner of the screen from the stack's centre (twice hypot(50vw, 50vh) when the stack is
 * centred, a little more for the plate's), so the photograph inside it covers the screen. One sizes
 * for every disc, so a photograph printed on several is fetched once.
 */
const TIER_SIZES = "max(125vw, 132vh)";

/** The rooms held still: the two spaces side by side, then the three materials (inside-discs). */
const discSizes = (i: number) =>
  i < 2 ? "(min-width: 64rem) 34rem, (min-width: 40rem) 44vw, 84vw" : "(min-width: 64rem) 24rem, (min-width: 40rem) 29vw, 84vw";

/** The walk's photographs that the project shows. */
function walkFrames(project: Project): Frame[] {
  return WALK.flatMap((w) => {
    const item = project.gallery.find((g) => !("pending" in g) && g.src.endsWith(`/${w.file}.jpg`));
    const img = item ? publicImage(item) : null;
    if (!img || "pending" in img) return [];
    return [
      {
        src: img.src,
        alt: img.alt,
        role: ROLE_LABEL[img.role ?? "space"],
        caption: w.caption,
        focus: w.focus,
      },
    ];
  });
}

/** Whether the section shows for this project: the walk needs three rooms at least. */
export const hasInsideWalk = (project: Project | null) => !!project && walkFrames(project).length >= 3;

export function InsideProject({ project, index }: { project: Project | null; index: string }) {
  if (!project || !hasInsideWalk(project)) return null;
  const frames = walkFrames(project);

  const n = frames.length;
  const times = walkTimes(n);
  const href = `/projects/${project.slug}`;
  const scope = [project.scope.join(", "), project.location].filter(Boolean).join(" · ");

  return (
    <section data-tone="dark" aria-labelledby="inside-title" className="relative border-t border-kapur/10">
      <Crosses className="z-10" />
      <div className="inside-scene" style={times.scene}>
        <div className="inside-stage">
          {/* The rooms, each a stack of discs printed with its photograph, stacked one over the last.
              Decoration for sighted visitors: the list below gives screen readers every photograph
              and caption in order. */}
          <div className="inside-rooms" aria-hidden="true">
            {frames.map((f, i) => (
              <div key={f.src} className="inside-room" style={times.frame[i]}>
                <Tiers frame={f} sizes={TIER_SIZES} times={times.tier(i)}>
                  <div className="inside-veil" />
                  <div className="inside-dim" />
                </Tiers>
              </div>
            ))}
          </div>

          <div className="inside-intro page-x">
            <Label index={index} pill className="mx-auto text-mouse">
              Inside a project
            </Label>
            <TitlePair
              id="inside-title"
              lead={`A walk through ${project.title}`}
              follow="from the room to the grain"
              className="mt-6 text-center"
            />
          </div>

          <ol className="visually-hidden">
            {frames.map((f, i) => (
              <li key={f.src}>
                <figure>
                  {/* The photograph itself is shown in its circle; here it only needs its description. */}
                  <span role="img" aria-label={f.alt} />
                  <figcaption>
                    {count(i, n)} · {f.role}: {f.caption}
                  </figcaption>
                </figure>
              </li>
            ))}
          </ol>

          {/* The foot of the plate, like the title block of a drawing: what you are looking at on the
              left, the project and the way to its case study on the right. */}
          <div className="inside-foot page-x">
            <div className="inside-words">
              <p className="inside-lead t-sub text-kapur/80">
                {STEPS[n] ?? n} steps in, each one closer: first its spaces, then its materials, down to the grain
                of the timber.<span className="inside-hint"> Scroll to step inside.</span>
              </p>
              <div className="inside-caps" aria-hidden="true">
                {frames.map((f, i) => (
                  <div key={f.src} className="inside-cap" style={times.frame[i]}>
                    {/* Its way in and its way out are on two elements, one move each. */}
                    <div className="inside-cap-in">
                      <p className="t-label tabular-nums text-kapur/80">
                        {count(i, n)} · {f.role}
                      </p>
                      <p className="t-sub mt-2 text-kapur">{f.caption}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="inside-project hidden lg:flex">
              <p className="t-title">{project.title}</p>
              <p className="t-meta mt-1 text-kapur/75">{scope}</p>
              <ButtonLink href={href} variant="outline" className="mt-6">
                Read the case study
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>
      {/* Tabbing to the case-study link mid-way through the first room's sweep would leave the page on a half-open
          step; it moves on to the first room, open, instead. */}
      <RevealFocus scene=".inside-scene" settle={times.settle} />

      {/* With reduced motion, or where scroll-driven animation is missing: after the plate, the same
          rooms held still, each its own stack of discs, and its caption beneath: the two spaces side
          by side, then the three materials. */}
      <div className="inside-discs page-x" aria-hidden="true">
        {frames.map((f, i) => (
          <figure key={f.src} className="inside-disc">
            <div className="inside-disc-stack">
              <Tiers frame={f} sizes={discSizes(i)} />
            </div>
            <figcaption className="mx-auto mt-7 max-w-[22rem] text-center">
              <p className="t-label tabular-nums text-kapur/80">
                {count(i, n)} · {f.role}
              </p>
              <p className="t-meta mt-2 text-kapur">{f.caption}</p>
            </figcaption>
          </figure>
        ))}
      </div>

      {/* Phones and tablets: the way on to the case study comes after the walk, clear of the contact bar. */}
      <div className="page-x pb-16 pt-12 lg:hidden">
        <p className="t-title">{project.title}</p>
        <p className="t-meta mt-1 text-kapur/75">{scope}</p>
        <ButtonLink href={href} variant="outline" className="mt-6">
          Read the case study
        </ButtonLink>
      </div>
    </section>
  );
}

/* ——— A project, told through its constraints (used once the studio supplies them) ——— */

/** Only told when the studio has supplied real constraints; the walk carries the section until then. */
export const hasProjectStory = (project: Project | null) => !!project && project.challenges.length > 0;

export function ProjectStory({ project, index }: { project: Project | null; index: string }) {
  if (!project || !hasProjectStory(project)) return null;
  const quote = project.quote && (project.quote.approved || SHOW_DRAFTS) ? project.quote : null;

  return (
    <Section tone="dark" labelledBy="story-title" className="section-y">
      <div className="page-x">
        {/* The same section as the walk above it, so the same label. */}
        <Label index={index} pill className="text-mouse">
          Inside a project
        </Label>
        <TitlePair id="story-title" lead={`How ${project.title} came together`} follow="constraint, then response" className="mt-6" />

        <div className="page-grid mt-16 gap-y-12">
          <div className="col-span-12 lg:col-span-4 lg:col-start-4">
            {project.concept ? (
              <p className="t-quote text-kapur">{project.concept}</p>
            ) : (
              <Pending title="Design concept" tone="dark">
                Two or three sentences in ROUANG&rsquo;s words: the idea that organised the interior.
              </Pending>
            )}
            {quote ? (
              <blockquote className="mt-10 border-l border-rikyu pl-5">
                <p className="t-quote text-kapur">&ldquo;{quote.text}&rdquo;</p>
                <footer className="t-caption mt-3 text-mouse">{quote.attribution}</footer>
              </blockquote>
            ) : null}
          </div>

          <div className="col-span-12 lg:col-span-5">
            {project.challenges.length > 0 ? (
              <ol className="border-t border-kapur/15">
                {project.challenges.slice(0, 3).map((c, i) => (
                  <li key={i} className="grid gap-4 border-b border-kapur/15 py-7 sm:grid-cols-2 sm:gap-8">
                    <div>
                      <p className="t-label text-mouse">Constraint</p>
                      <p className="mt-2">{c.constraint}</p>
                    </div>
                    <div>
                      <p className="t-label text-rikyu">Response</p>
                      <p className="mt-2 text-kapur/85">{c.response}</p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <Pending title="Constraints and responses" tone="dark">
                Two or three real design problems on this project (site, kitchen, seating, budget, programme) and what the
                studio decided in response.
              </Pending>
            )}
            <ButtonLink href={`/projects/${project.slug}`} variant="outline" className="mt-10">
              Read the full case study
            </ButtonLink>
          </div>
        </div>
      </div>
    </Section>
  );
}

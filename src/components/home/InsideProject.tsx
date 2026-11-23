import Image from "next/image";
import type { CSSProperties } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { Crosses, Pending, Section } from "@/components/ui/Section";
import { Label, TitlePair } from "@/components/ui/Typography";
import type { Project } from "@/lib/content";
import { publicImage } from "@/lib/content";
import { SHOW_DRAFTS } from "@/lib/env";

/* ——— 04 Inside a project: a walk into the flagship, each room laid over the last as a stack of rings ——— */

const ROLE_LABEL = { space: "Space", material: "Material", whole: "Whole" } as const;

/**
 * The walk, in the order it is taken: from the dining room in to the grain of the timber, so each
 * step forward is also a step closer. Real photographs of the finished interior only, and not the
 * ones 01 Work and What we do already show. Each caption says only what its photograph shows.
 * `focus` places the photograph in its round frame (object-position).
 * Five rooms at most: styles/home/inside.css lists a stage for each.
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
 * carries. `--j` counts a disc out from the photograph (0 to TIERS - 1), `--k` in from the outer ring.
 */
const TIERS = 5;

/**
 * Scroll given to each stage of the walk, in svh. The stages are the plate (title and lead), then one
 * per room. Scrolling only decides which stage shows; the change itself is a short timed transition
 * (inside.css), so the walk moves the same whether the page is scrolled slowly, quickly or stopped.
 */
const STAGE = 65;

type Frame = {
  src: string;
  alt: string;
  role: string;
  caption: string;
  focus: string;
};

/**
 * One room's stack of discs, the outer ring first in the document so each disc lies over the one
 * outside it. The photograph printed on all five is one download: every print has the same src and
 * sizes.
 */
function Tiers({ frame, sizes }: { frame: Frame; sizes: string }) {
  return Array.from({ length: TIERS }, (_, k) => {
    const j = TIERS - 1 - k;
    return (
      <div key={j} className="inside-ring" style={{ ["--j" as string]: j, ["--k" as string]: k }}>
        <Image
          src={frame.src}
          alt=""
          fill
          sizes={sizes}
          className="rounded-full object-cover"
          style={{ objectPosition: frame.focus }}
        />
      </div>
    );
  });
}

const STEPS: Record<number, string> = { 3: "Three", 4: "Four", 5: "Five" };

const count = (i: number, n: number) => `${String(i + 1).padStart(2, "0")} / ${String(n).padStart(2, "0")}`;

/**
 * How wide a stack is drawn on the plate, at most: the room between the title and the words at the
 * foot (a little over half the screen's height on laptops and desktops, inside.css), and on phones
 * and tablets most of the screen's width.
 */
const PLATE_SIZES = "(min-width: 64rem) min(62vh, 80vw), (min-width: 40rem) 72vw, 88vw";

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
  const stages = n + 1;
  const scene: CSSProperties = {
    ["--run" as string]: `${stages * STAGE}svh`,
    ["--inside-stages" as string]: stages,
    ["--inside-last" as string]: stages - 1,
  };
  const href = `/projects/${project.slug}`;
  const scope = [project.scope.join(", "), project.location].filter(Boolean).join(" · ");

  return (
    <section data-tone="dark" aria-labelledby="inside-title" className="inside relative border-t border-kapur/10">
      <Crosses className="z-10" />
      <div className="inside-scene" style={scene}>
        <div className="inside-stage">
          {/* The rooms, each a stack of discs printed with its photograph, each laid over the last.
              Decoration for sighted visitors: the list below gives screen readers every photograph
              and caption in order. */}
          <div className="inside-rooms" aria-hidden="true">
            {frames.map((f) => (
              <div key={f.src} className="inside-room">
                <Tiers frame={f} sizes={PLATE_SIZES} />
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
                  <div key={f.src} className="inside-cap">
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

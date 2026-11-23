import Image from "next/image";
import type { CSSProperties } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { Crosses, Pending, Section } from "@/components/ui/Section";
import { Label, TitlePair } from "@/components/ui/Typography";
import type { Project } from "@/lib/content";
import { publicImage } from "@/lib/content";
import { SHOW_DRAFTS } from "@/lib/env";

/* ——— 04 Inside a project: a walk into the flagship, each room filling the section and crossfading into the next ——— */

const ROLE_LABEL = { space: "Space", material: "Material", whole: "Whole" } as const;

/**
 * The walk, in the order it is taken: from the dining room in to the grain of the timber, so each
 * step forward is also a step closer. Real photographs of the finished interior only, and not the
 * ones 01 Work and What we do already show. Each caption says only what its photograph shows.
 * Five rooms at most: styles/home/inside.css lists a stage for each.
 *
 * Every photograph is a portrait (the two spaces 9:16, the three materials 3:4) and fills the
 * whole section, so `focus` (object-position) carries both crops at once. On a landscape screen
 * the photograph runs the full width and its height is cut: the second number picks the band kept
 * (about the middle third of a space at 16:10, half of a material). On a phone the photograph runs
 * the full height and its width is cut: the first number picks the strip kept (four fifths of a
 * space, three fifths of a material). Each keeps its subject in the middle of the screen, clear of
 * the title above it and the words at its foot.
 */
const WALK = [
  {
    file: "rembayung-gable-dining",
    caption: "Dining beneath the glazed gable: rattan-backed chairs, slatted timber screens and rattan pendants.",
    focus: "46% 51%",
  },
  {
    file: "rembayung-brick-wall",
    caption: "Batik set into timber screens against the brick wall, beside stained glass in green and blue.",
    focus: "42% 28%",
  },
  {
    file: "rembayung-service-counter",
    caption: "The service counter: a slatted timber front, set with panels of patterned glass.",
    focus: "62% 36%",
  },
  {
    file: "rembayung-batik-shelves",
    caption: "Batik, folded on open timber shelves.",
    focus: "76% 54%",
  },
  {
    file: "rembayung-counter-edge",
    caption: "A timber counter, detailed with a routed edge.",
    focus: "62% 56%",
  },
] as const;

/**
 * Scroll given to each stage of the walk, in svh. The stages are the plate (title and lead), then one
 * per room. Scrolling only decides which stage shows; the change itself is a timed crossfade
 * (inside.css), so the walk moves the same whether the page is scrolled slowly, quickly or stopped.
 * Under half a screen each (about four notches of a mouse wheel), so the plate holds still only long
 * enough to look at each room: six stages pin it for under three screens.
 */
const STAGE = 45;

type Frame = {
  src: string;
  alt: string;
  role: string;
  caption: string;
  focus: string;
  /** How wide the photograph is drawn when it fills the stage (cover). */
  sizes: string;
};

/**
 * A photograph filling the stage is drawn the screen's width, except on a screen narrower than the
 * photograph itself (a phone, upright), where it is drawn the screen's height and so wider than the
 * screen: a 3:4 photograph on a phone is 75vh across, half as wide again as the phone.
 */
const coverSizes = (w: number, h: number) => `(max-aspect-ratio: ${w}/${h}) ${Math.ceil((w / h) * 100)}vh, 100vw`;

const STEPS: Record<number, string> = { 3: "Three", 4: "Four", 5: "Five" };

const count = (i: number, n: number) => `${String(i + 1).padStart(2, "0")} / ${String(n).padStart(2, "0")}`;

/** The rooms held still (no scroll-driven animation): the two spaces side by side, then the three materials. */
const stillSizes = (i: number) => (i < 2 ? "(min-width: 40rem) min(30rem, 44vw), 88vw" : "(min-width: 40rem) min(22rem, 29vw), 88vw");

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
        sizes: coverSizes(img.width, img.height),
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
          {/* The rooms, each photograph filling the stage, each laid over the last. Decoration for
              sighted visitors: the list below gives screen readers every photograph and caption in
              order. */}
          <div className="inside-rooms" aria-hidden="true">
            {frames.map((f) => (
              <div key={f.src} className="inside-room">
                <Image
                  src={f.src}
                  alt=""
                  fill
                  sizes={f.sizes}
                  quality={78}
                  className="inside-photo"
                  style={{ objectPosition: f.focus }}
                />
              </div>
            ))}
          </div>
          {/* The shade the words sit on: deepest under the title and along the foot, clear between. */}
          <div className="inside-scrim" aria-hidden="true" />

          <div className="inside-intro page-x">
            <Label index={index} pill className="mx-auto text-kapur/80">
              Inside a project
            </Label>
            <TitlePair
              id="inside-title"
              lead={`A walk through ${project.title}`}
              follow="from the room to the grain"
              followClassName="text-kapur"
              className="mt-6 text-center"
            />
          </div>

          <ol className="visually-hidden">
            {frames.map((f, i) => (
              <li key={f.src}>
                <figure>
                  {/* The photograph itself fills the stage; here it only needs its description. */}
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
              <p className="inside-lead t-sub text-kapur">
                {STEPS[n] ?? n} steps in, each one closer: first its spaces, then its materials, down to the grain
                of the timber.<span className="inside-hint"> Scroll to step inside.</span>
              </p>
              <div className="inside-caps" aria-hidden="true">
                {frames.map((f, i) => (
                  <div key={f.src} className="inside-cap">
                    <div className="inside-cap-in">
                      <p className="t-label tabular-nums text-kapur/85">
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
              <p className="t-meta mt-1 text-kapur/85">{scope}</p>
              <ButtonLink href={href} variant="outline" className="mt-6">
                Read the case study
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>

      {/* Where scroll-driven animation is missing: after the plate, the same rooms held still, each
          captioned beneath: the two spaces side by side, then the three materials. */}
      <div className="inside-stills page-x" aria-hidden="true">
        {frames.map((f, i) => (
          <figure key={f.src} className="inside-still">
            <div className="inside-still-frame">
              <Image
                src={f.src}
                alt=""
                fill
                sizes={stillSizes(i)}
                quality={78}
                className="object-cover"
                style={{ objectPosition: f.focus }}
              />
            </div>
            <figcaption className="mt-5 max-w-[26rem]">
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

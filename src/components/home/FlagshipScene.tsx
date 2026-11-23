import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { TitleBlock } from "@/components/projects/TitleBlock";
import { ButtonLink } from "@/components/ui/Button";
import { HeroImage } from "@/components/ui/HeroImage";
import type { Project } from "@/lib/content";
import { projectImage, publicImage } from "@/lib/content";
import { FlagshipRun } from "./FlagshipRun";

/**
 * Four more photographs of the flagship, after its own, chosen for range and kept in this order: the
 * space (the hall's timber roof, looking up), a material (batik on its timber frames), colour and
 * identity (the stained glass and the restaurant's name), and light (a table by the window in the
 * afternoon sun), which ends the run quietly before the white of the other projects. Real
 * photographs only, borrowed from the project's own gallery through projectImage, so they show only
 * where the project and the photograph are cleared. `focus` holds each on its subject where a narrow
 * screen crops it to a slender column.
 */
const VIEWS = {
  project: "rembayung",
  frames: [
    { file: "rembayung-a-frame-ceiling", focus: "50% 50%" },
    { file: "rembayung-batik-frame", focus: "36% 50%" },
    { file: "rembayung-stained-glass-screen", focus: "42% 50%" },
    { file: "rembayung-table-in-sun", focus: "34% 50%" },
  ],
} as const;

/**
 * 01 Work, the first movement: the flagship scene, one pinned stage driven by scroll
 * (styles/home/work.css). It opens on "Selected work" (the section's title, passed in by
 * SelectedWork), centred on the dark ground. The flagship's photograph then comes in from the right
 * over the title, the picture travelling more slowly than its frame, and its facts gather at its
 * foot; it holds; then the whole strip moves on from right to left, and four tall photographs of the
 * same project come in after it, each the full height of the screen, until the last is in place and
 * the page hands over to the other projects. Each photograph is numbered and captioned.
 *
 * Without scroll-driven animation, or with reduced motion: the title, the photograph with its facts,
 * then the four photographs as a contact sheet, one after another.
 */
export function FlagshipScene({ project, title }: { project: Project; title: ReactNode }) {
  const img = publicImage(project.card ?? project.hero);
  const photo = img && !("pending" in img) ? img : null;
  const href = `/projects/${project.slug}`;
  const views =
    project.slug === VIEWS.project
      ? VIEWS.frames.flatMap(({ file, focus }) => {
          const image = projectImage(project, file);
          return image ? [{ image, focus }] : [];
        })
      : [];
  const count = (n: number) => `${pad(n)} / ${pad(views.length + 1)}`;

  return (
    <div data-tone="dark" className="work-scene relative" style={{ ["--views" as string]: views.length } as CSSProperties}>
      <div className="work-stage relative">
        <div className="work-intro page-x">{title}</div>

        <article className="work-feature" aria-labelledby="flagship-title">
          {/* The track brings the flagship in from the right; the strip inside it carries the run on. */}
          <div className="work-track">
            <div className="work-strip">
              <div className="work-lead">
                {photo ? (
                  <Link href={href} tabIndex={-1} aria-hidden="true" className="work-photo relative block aspect-[4/5] overflow-hidden sm:aspect-[3/2] lg:aspect-auto">
                    <span className="work-photo-inner absolute inset-0 block">
                      <span className="work-drift block">
                        <HeroImage image={photo} narrowSizes="max(112vw, 63vh)" defaultFocus="50% 55%" priority={false} />
                      </span>
                    </span>
                    <span className="work-shade absolute inset-0 hidden lg:block" />
                  </Link>
                ) : null}

                <div className="work-facts page-x pb-[var(--section-space)] pt-10 lg:pb-[max(2.5rem,6svh)] lg:pt-0">
                  <div className="page-grid items-end gap-y-8">
                    <div className="col-span-12 lg:col-span-6">
                      <p className="work-fact t-label text-mouse lg:text-kapur/75">
                        Flagship project · {project.sector === "commercial" ? "Commercial" : "Residential"}
                      </p>
                      <h3 id="flagship-title" className="t-headline mt-4 pb-[0.12em] [clip-path:inset(-8px_-8px_0_-8px)]">
                        <Link href={href} className="work-title-line link-fade inline-block" prefetch={true}>
                          {project.title}
                        </Link>
                      </h3>
                      <p className="work-fact t-sub mt-6 max-w-[34rem] text-kapur/85">{project.summary}</p>
                    </div>
                    <div className="work-facts-side col-span-12 lg:col-span-5 lg:col-start-8">
                      <TitleBlock project={project} tone="dark" className="work-fact" />
                      <ButtonLink href={href} variant="outline" className="work-fact mt-7">
                        Read the case study
                      </ButtonLink>
                    </div>
                  </div>
                </div>
              </div>

              {views.length > 0 ? (
                <ul className="work-views" aria-label={`${project.title} in detail`}>
                  {views.map(({ image, focus }, i) => (
                    <li key={image.src} className="work-view">
                      <figure className="work-view-figure">
                        <div className="work-view-frame">
                          <div className="work-drift">
                            <Image
                              src={image.src}
                              alt={image.alt}
                              fill
                              sizes={viewSizes(image.width / image.height)}
                              quality={78}
                              className="object-cover"
                              style={{ objectPosition: focus }}
                            />
                          </div>
                        </div>
                        <figcaption className="work-view-caption">
                          <span className="t-label tabular-nums" aria-hidden="true">
                            {count(i + 2)}
                          </span>
                          {image.caption ? <span className="t-meta">{image.caption}</span> : null}
                        </figcaption>
                      </figure>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </article>
      </div>
      {/* Where the flagship's panel holds still, its facts in place, for FlagshipRun. */}
      <span className="work-hold" aria-hidden="true" />
      <FlagshipRun />
    </div>
  );
}

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * How wide a photograph of the run is drawn. Moving, it fills a panel the full height of the screen
 * and a third of the width of a 16:9 screen, half of a 16:10 or 4:3 one, five-sixths of an upright
 * one (work.css, --k), with 12% to spare for its drift; a picture narrower than its panel's shape is
 * drawn to the panel's height instead. Still (reduced motion), it is a cell of the contact sheet:
 * four across on large screens, two on smaller ones.
 */
function viewSizes(aspect: number) {
  const tall = `${Math.ceil(aspect * 100)}vh`;
  return [
    "(prefers-reduced-motion: reduce) and (min-width: 64rem) 23vw",
    "(prefers-reduced-motion: reduce) 47vw",
    `(min-aspect-ratio: 17/10) max(38vw, ${tall})`,
    `(min-aspect-ratio: 1/1) max(56vw, ${tall})`,
    `max(94vw, ${tall})`,
  ].join(", ");
}

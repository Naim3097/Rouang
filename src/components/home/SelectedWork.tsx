import Image from "next/image";
import Link from "next/link";
import { TitleBlock } from "@/components/projects/TitleBlock";
import { Arrow, ArrowLink } from "@/components/ui/Button";
import { HeroImage } from "@/components/ui/HeroImage";
import { Label, TitlePair } from "@/components/ui/Typography";
import { FlagshipFocus } from "./FlagshipFocus";
import { sceneryProps } from "./heroMedia";
import type { Project } from "@/lib/content";
import { publicImage } from "@/lib/content";

/**
 * 01 Work, told in two movements.
 *
 * The flagship scene stays on the hero's dark ground: "Selected work" rises as the hero leaves,
 * holds, then the full-bleed photograph of the flagship rises over it and settles, and its facts
 * gather at the foot of the picture. One pinned stage, driven by scroll (globals.css, "01 Work").
 *
 * Then the other projects as a cascade of columns on kapur: each column arrives at its own pace
 * and they settle level. The write-up is always there at the foot of each column; on a pointer,
 * the photograph appears while the column is hovered or focused. Touch screens show it outright.
 *
 * Without scroll-driven animation, below the large breakpoint, or with reduced motion, both are
 * still compositions with the same content in the same order.
 */
export function SelectedWork({ flagship, others }: { flagship: Project | null; others: Project[] }) {
  if (!flagship && others.length === 0) return null;
  return (
    <section aria-labelledby="work-title" className="relative">
      {flagship ? <FlagshipScene project={flagship} /> : <WorkTitle className="page-x pt-[var(--section-space)]" />}
      {others.length > 0 ? <Cascade projects={others} startAt={flagship ? 2 : 1} /> : null}
    </section>
  );
}

function WorkTitle({ className = "", tone = "light" }: { className?: string; tone?: "light" | "dark" }) {
  return (
    <div className={`page-grid items-end gap-y-8 ${className}`}>
      <Label index="01" className={`col-span-12 lg:col-span-3 ${tone === "dark" ? "text-mouse" : "text-ink-muted"}`}>
        Work
      </Label>
      <TitlePair
        id="work-title"
        lead="Selected work"
        italic="from dining rooms to homes"
        className="col-span-12 lg:col-span-9"
        italicClassName="lg:text-[1.16em]"
      />
    </div>
  );
}

function FlagshipScene({ project }: { project: Project }) {
  const img = publicImage(project.card ?? project.hero);
  const photo = img && !("pending" in img) ? img : null;
  const href = `/projects/${project.slug}`;

  return (
    <div data-tone="dark" className="work-scene relative">
      <div className="work-stage relative">
        {/* The view the hero's camera has just passed through to, at the same size and place. */}
        <div className="work-lead" aria-hidden="true">
          <span className="work-view">
            {/* eslint-disable-next-line @next/next/no-img-element -- the same optimised srcset as the hero's view */}
            <img {...sceneryProps()} alt="" />
          </span>
          <span className="work-dusk" />
        </div>
        <div className="work-intro page-x">
          <WorkTitle tone="dark" className="work-intro-inner w-full" />
        </div>

        <article className="work-feature" aria-labelledby="flagship-title">
          {photo ? (
            <Link href={href} tabIndex={-1} aria-hidden="true" className="work-photo relative block aspect-[4/5] overflow-hidden sm:aspect-[3/2] lg:aspect-auto">
              <span className="work-photo-inner absolute inset-0 block">
                <HeroImage image={photo} narrowSizes="100vw" defaultFocus="50% 55%" priority={false} />
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
                <h3
                  id="flagship-title"
                  className="mt-4 pb-[0.08em] [clip-path:inset(-8px_-8px_0_-8px)] font-serif text-[clamp(3rem,2rem+4vw,6.5rem)] italic leading-[0.95] tracking-[-0.015em]"
                >
                  <Link href={href} className="work-title-line link-reveal inline-block" prefetch={true}>
                    {project.title}
                  </Link>
                </h3>
                <p className="work-fact t-sub mt-6 max-w-[34rem] text-kapur/85">{project.summary}</p>
              </div>
              <div className="col-span-12 lg:col-span-5 lg:col-start-8">
                <TitleBlock project={project} tone="dark" className="work-fact" />
                <ArrowLink href={href} className="work-fact mt-7">
                  Read the case study
                </ArrowLink>
              </div>
            </div>
          </div>
        </article>
      </div>
      <FlagshipFocus />
    </div>
  );
}

function Cascade({ projects, startAt }: { projects: Project[]; startAt: number }) {
  // Four columns at most on the home page, as in the brief; the rest live on /projects.
  const shown = projects.slice(0, 4);
  return (
    <div data-tone="light" className="relative bg-kapur text-ink">
      <ol className="cascade grid border-b border-ink/15 sm:grid-cols-2 lg:grid-cols-4" aria-label="More projects">
        {shown.map((p, i) => {
          const img = publicImage(p.card ?? p.hero);
          const photo = img && !("pending" in img) ? img : null;
          const facts = [p.type, p.location].filter(Boolean).join(" · ");
          const status = [p.sector === "residential" ? "Residential" : "Commercial", p.visualisation ? "Design proposal" : null]
            .filter(Boolean)
            .join(" · ");
          return (
            <li
              key={p.slug}
              className="cascade-col relative border-t border-ink/15 sm:[&:nth-child(even)]:border-l lg:border-l lg:first:border-l-0"
              style={{ ["--cascade-from" as string]: `${10 + i * 9}svh` }}
            >
              <div className="cascade-inner flex h-full flex-col">
                <p className="t-label flex items-baseline justify-between gap-4 px-[var(--page-gutter)] pb-4 pt-6 text-ink-muted lg:px-6">
                  <span className="tabular-nums">{String(i + startAt).padStart(2, "0")}</span>
                  <span className="text-right">
                    {status}
                    {p.isDraft ? ` · ${p.placeholder ? "Layout placeholder" : "Draft"}` : null}
                  </span>
                </p>
                <div className="flex flex-1 flex-col px-[var(--page-gutter)] pt-8 lg:px-6 lg:pt-[clamp(2.5rem,7svh,5rem)]">
                  <h3 className="font-serif text-[clamp(2.25rem,1.6rem+1.6vw,3.5rem)] italic leading-[1] tracking-[-0.012em]">
                    {/* The whole column is the link, so one tab stop opens the project. */}
                    <Link href={`/projects/${p.slug}`} className="after:absolute after:inset-0 after:content-['']">
                      {p.title}
                    </Link>
                  </h3>
                  <p className="t-caption mt-3 text-ink-muted">{facts}</p>
                  {photo ? (
                    <div className="cascade-media relative mt-8 aspect-[4/5] overflow-hidden bg-kapur-deep" aria-hidden="true">
                      <Image
                        src={photo.src}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 23vw, (min-width: 640px) 46vw, 92vw"
                        quality={78}
                        className="object-cover"
                        style={photo.focus ? { objectPosition: photo.focus } : undefined}
                      />
                    </div>
                  ) : null}
                </div>
                <div className="mt-8 px-[var(--page-gutter)] pb-10 lg:mt-10 lg:px-6">
                  <p className="text-[0.9375rem] leading-relaxed text-ink-soft">{p.summary}</p>
                  <span className="t-caption mt-6 inline-flex items-center gap-3" aria-hidden="true">
                    View the project
                    <Arrow className="cascade-arrow" />
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="page-x flex items-center justify-between gap-6 py-10">
        <ArrowLink href="/projects">All projects</ArrowLink>
        {projects.length > shown.length ? (
          <p className="t-caption text-ink-muted">{projects.length - shown.length} more on the projects page</p>
        ) : null}
      </div>
    </div>
  );
}

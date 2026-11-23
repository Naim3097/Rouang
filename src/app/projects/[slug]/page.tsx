import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { type CSSProperties, ViewTransition } from "react";
import { CurveRule } from "@/components/brand/Brand";
import { shownImage } from "@/components/projects/images";
import { TitleBlock } from "@/components/projects/TitleBlock";
import { DraftTag } from "@/components/projects/ProjectIndex";
import { ButtonLink } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Figure } from "@/components/ui/Figure";
import { Film, type FilmSource } from "@/components/ui/Film";
import { HeroImage } from "@/components/ui/HeroImage";
import { Pending } from "@/components/ui/Section";
import { Label } from "@/components/ui/Typography";
import { getProject, getProjects, getServices, publicImage, type Project, staticSlugs } from "@/lib/content";
import type { GalleryItem, Image as ImageData } from "@/lib/content/schema";
import { SHOW_DRAFTS, SHOW_NOTES } from "@/lib/env";
import { pageMetadata } from "@/lib/seo";

export const ensureStatic = "navigation";
// Every slug is prerendered and quick to fetch, so a navigation that waits for the static
// payload is acceptable. Content stays in the HTML instead of a hidden Suspense segment.
export const instant = false;

export async function generateStaticParams() {
  return staticSlugs(await getProjects());
}

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProject(slug);
  if (!p) return {};
  return pageMetadata({
    title: p.seo.title ?? `${p.title}: ${p.type} interior design${p.location ? `, ${p.location}` : ""}`,
    description: p.seo.description ?? p.summary,
    path: `/projects/${p.slug}`,
    noindex: p.placeholder,
  });
}

type Chapter = { key: string; label: string; title: string; body: string | null; hint: string };

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();

  const [projects, services] = await Promise.all([getProjects(), getServices()]);
  const index = projects.findIndex((p) => p.slug === project.slug);
  const next = projects.length > 1 ? projects[(index + 1) % projects.length] : null;
  const related = services.filter((s) => project.services.includes(s.slug));

  const hero = shownImage(project.hero);
  const gallery = project.gallery.map((g) => shownImage(g)).filter((g) => g !== null);
  const showStubs = SHOW_NOTES && !project.placeholder;

  const chapters: Chapter[] = [
    { key: "brief", label: "The brief", title: "What the space had to do", body: project.brief, hint: "The client's brief in a few sentences: who uses the space, what was wrong with it, what had to change." },
    { key: "concept", label: "The idea", title: "The thought that organised it", body: project.concept, hint: "The design concept in ROUANG's own words." },
    { key: "planning", label: "The plan", title: "How the space was arranged", body: project.planning, hint: "Spatial planning decisions: circulation, zoning, seating or storage, and why." },
    { key: "lighting", label: "Light", title: "Day and evening", body: project.lighting, hint: "How natural and artificial light were handled." },
  ];
  const visibleChapters = chapters.filter((c) => c.body || showStubs);

  // Photographs are threaded through the story rather than parked at the end, a row at a time: the
  // first row opens the case study, each chapter with its own words gets the next, and the rest close
  // it. A chapter still awaiting the studio's words (a stub, shown on the development server only)
  // takes none, so the rows fall the same way there as on every deployed site. Chapters are numbered
  // in the order they show, so a missing one leaves no gap in the numbering.
  const rows = planGallery(gallery);
  const lead = rows[0] ?? null;
  let cursor = 1;
  const threaded = visibleChapters.map((c) => (c.body ? (rows[cursor++] ?? null) : null));
  const remainder = rows.slice(cursor);

  // The ground the closing section follows: the last section rendered above it (the sections run
  // facts, chapters, In motion, materials, constraints, more photographs). On the same Milky White,
  // a curve rule divides the two and the section above gives the space; after a change of ground
  // (the grey materials band, or a dark one), the change itself divides them, as on /projects, so
  // the closing section takes a section's full space above its heading and draws no rule.
  const groundAbove = remainder.length
    ? "kapur"
    : project.challenges.length || showStubs
      ? "dark"
      : project.materials.length
        ? "deep"
        : project.loops.length
          ? "dark"
          : "kapur";

  const facts = [project.sector === "commercial" ? "Commercial" : "Residential", project.type, project.location, project.visualisation ? "Design proposal" : null]
    .filter(Boolean)
    .join(" · ");

  // Images too small to fill a large screen open inset, at a size they can hold.
  const insetHero = !!hero && !("pending" in hero) && hero.width < 1800 && !project.film;
  const single = project.loops.length === 1;

  return (
    <article>
      {insetHero && hero && !("pending" in hero) ? (
        <header data-tone="dark" className="relative">
          <div className="page-x pb-16 pt-[calc(var(--header-h)+1.5rem)] sm:pb-24">
            <Breadcrumbs tone="dark" items={[{ name: "Projects", href: "/projects" }, { name: project.title, href: `/projects/${project.slug}` }]} />
            <div className="page-grid mt-16 gap-y-8 sm:mt-24">
              <div className="col-span-12 lg:col-span-8">
                <h1 className="flex flex-col">
                  <span className="t-headline-hero mt-4 block">
                    {project.title}
                    {project.isDraft ? <DraftTag placeholder={project.placeholder} /> : null}
                  </span>
                  <span className="t-label order-first block text-kapur">{facts}</span>
                </h1>
              </div>
              <p className="t-sub col-span-12 max-w-[40rem] self-end text-kapur/85 lg:col-span-4">{project.standfirst ?? project.summary}</p>
            </div>
            {/* A render keeps its own proportions, uncropped. It is never wider than its file, nor
                taller than min(75svh, 760px), so a landscape phone still sees all of it. */}
            <ViewTransition name={`project-${project.slug}`} share="project-image" default="none">
              <div
                className="relative mx-auto mt-14 w-full sm:mt-20"
                style={{
                  maxWidth: `min(${hero.width}px, min(75svh, 760px) * ${(hero.width / hero.height).toFixed(4)})`,
                  aspectRatio: `${hero.width}/${hero.height}`,
                }}
              >
                <Image
                  src={hero.src}
                  alt={hero.alt}
                  fill
                  loading="eager"
                  fetchPriority="high"
                  sizes={`min(${hero.width}px, 92vw, ${Math.ceil((75 * hero.width) / hero.height)}vh, ${Math.ceil((760 * hero.width) / hero.height)}px)`}
                  quality={85}
                  className="object-cover"
                />
              </div>
            </ViewTransition>
          </div>
        </header>
      ) : (
      /* ——— Opening: the photograph with the title set on it. Four-fifths of the screen, not all of
         it, so the first line of the case study already shows beneath it. ——— */
      <header data-tone="dark" className="relative min-h-[80svh] overflow-hidden">
        <div className="absolute inset-0">
          {hero ? (
            <ViewTransition name={`project-${project.slug}`} share="project-image" default="none">
              <div className="absolute inset-0">
                {"pending" in hero ? (
                  <Figure image={hero} sizes="100vw" aspect="auto" tone="dark" reveal={false} className="h-full" />
                ) : (
                  // With a film, the still is the film's own first frame, so the loop takes over seamlessly.
                  <HeroImage image={openerStill(hero, project.film)} narrowSizes="100vw" />
                )}
              </div>
            </ViewTransition>
          ) : null}
          {project.film ? <Film sources={filmSources(project.film)} label={project.film.caption ?? `Film of ${project.title}`} /> : null}
          <div className="absolute inset-0 bg-linear-to-t from-ink via-ink/35 to-ink/10" aria-hidden="true" />
          {/* A second scrim under the header, so navigation stays legible over bright ceilings. */}
          <div className="absolute inset-x-0 top-0 h-64 bg-linear-to-b from-ink/85 via-ink/60 to-transparent" aria-hidden="true" />
        </div>

        <div className="page-x relative flex min-h-[80svh] flex-col justify-between pb-12 pt-[calc(var(--header-h)+1.5rem)] sm:pb-16">
          <Breadcrumbs tone="photo" items={[{ name: "Projects", href: "/projects" }, { name: project.title, href: `/projects/${project.slug}` }]} />
          <div>
            {/* The name comes first in the heading; the facts line is shown above it. */}
            <h1 className="flex flex-col">
              <span className="t-headline-hero mt-4 block">
              {project.title}
              {project.isDraft ? <DraftTag placeholder={project.placeholder} /> : null}
              </span>
              <span className="t-label order-first block text-kapur">{facts}</span>
            </h1>
            <p className="t-sub mt-7 max-w-[40rem] text-kapur/85">{project.standfirst ?? project.summary}</p>
          </div>
        </div>
      </header>
      )}

      {/* ——— Facts and scope ——— */}
      <section data-tone="light" className="bg-kapur text-ink">
        <div className="page-x section-y">
          <div className="page-grid gap-y-12">
            <div className="col-span-12 lg:col-span-4">
              {/* Every section label in the page's margin is a pill: the story's chapters are
                  numbered, the sections around them are not. */}
              <Label pill className="text-ink-muted">
                Project
              </Label>
              <TitleBlock project={project} className="mt-6" />
              {project.photography.credit ? (
                <p className="t-caption mt-4 text-ink-muted">Photography: {project.photography.credit}</p>
              ) : null}
              {project.visualisation ? (
                <p className="t-caption mt-4 border-l border-rikyu pl-3 text-ink-muted">
                  The images on this page are design visualisations prepared by ROUANG, not photographs of the
                  finished space.
                </p>
              ) : null}
            </div>
            <div className="col-span-12 lg:col-span-7 lg:col-start-6">
              <p className="t-sub max-w-[40rem]">{project.summary}</p>
              {project.html ? <div className="prose-rouang mt-8 text-ink-soft" dangerouslySetInnerHTML={{ __html: project.html }} /> : null}
              {showStubs && project.todo.length ? (
                <div className="mt-10">
                  <Pending title="Open items for this case study">
                    <ul className="list-disc space-y-1 pl-4">
                      {project.todo.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  </Pending>
                </div>
              ) : null}
            </div>
          </div>
          {lead ? <GalleryRow row={lead} className="mt-20 sm:mt-28" /> : null}
        </div>
      </section>

      {/* ——— The story, in chapters, with photographs between them ——— */}
      {visibleChapters.length ? (
        <section data-tone="light" className="bg-kapur pb-[var(--section-space)] text-ink" aria-label="Case study">
          <div className="page-x space-y-24 sm:space-y-36">
            {visibleChapters.map((c, i) => (
              <div key={c.key}>
                <div className="page-grid gap-y-6">
                  <div className="col-span-12 lg:col-span-3">
                    <div className="lg:sticky lg:top-[calc(var(--header-h)+2rem)]">
                      <Label pill index={String(i + 1).padStart(2, "0")} className="text-ink-muted">
                        {c.label}
                      </Label>
                    </div>
                  </div>
                  <div className="col-span-12 lg:col-span-7 lg:col-start-5">
                    <h2 className="t-headline">{c.title}</h2>
                    {c.body ? (
                      <div className="mt-6 space-y-5 text-ink-soft">
                        {c.body.split(/\n\s*\n/).map((para, k) => (
                          <p key={k}>{para}</p>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-6">
                        <Pending title={c.label}>{c.hint}</Pending>
                      </div>
                    )}
                  </div>
                </div>
                {threaded[i] ? <GalleryRow row={threaded[i]} className="mt-16 sm:mt-24" /> : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* ——— Short loops of real footage ——— */}
      {project.loops.length ? (
        <section data-tone="dark" aria-labelledby="motion-title">
          <div className="page-x section-y">
            <div className="page-grid gap-y-10">
              <div className="col-span-12 lg:col-span-3">
                <Label as="h2" pill className="text-mouse">
                  <span id="motion-title">In motion</span>
                </Label>
              </div>
              {/* One loop is shown at a readable size with its caption set beside it, so the band is
                  not left half empty; more sit in a row. Three on a phone: the first across the width
                  and two under it, rather than one left on its own. */}
              <ul
                className={`col-span-12 grid gap-[var(--grid-gap)] lg:col-span-9 ${
                  single
                    ? "grid-cols-1"
                    : project.loops.length === 2
                      ? "grid-cols-2"
                      : `grid-cols-2 sm:grid-cols-3 ${project.loops.length === 3 ? "[&>li:first-child]:col-span-2 sm:[&>li:first-child]:col-span-1" : ""}`
                }`}
              >
                {project.loops.map((l, i) => (
                  <li key={l.src}>
                    {/* A lone portrait loop: never wider than 26rem, nor taller than 75svh (a 4:5 frame
                        60svh wide), so it fits a landscape phone; its caption sits beside it from md. */}
                    <figure
                      className={
                        single
                          ? "md:grid md:grid-cols-[min(26rem,60svh)_minmax(0,24rem)] md:items-end md:gap-x-[var(--grid-gap)]"
                          : undefined
                      }
                    >
                      <div className={`relative aspect-[4/5] overflow-hidden bg-ink-raised ${single ? "max-w-[min(26rem,60svh)]" : ""}`}>
                        <Image src={l.poster} alt={l.alt} fill sizes={loopSizes(project.loops.length, i)} quality={78} className="object-cover" />
                        <Film sources={[{ src: l.src }]} label={l.alt} compact />
                      </div>
                      {single ? (
                        <figcaption className="mt-3 md:mt-0 md:pb-1">
                          <span className="t-label block text-mouse">Filmed at {project.title}</span>
                          {l.caption ? <span className="t-caption mt-2 block text-kapur/80 md:t-sub md:mt-4">{l.caption}</span> : null}
                        </figcaption>
                      ) : l.caption ? (
                        <figcaption className="t-caption mt-3 text-mouse">{l.caption}</figcaption>
                      ) : null}
                    </figure>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ) : null}

      {/* ——— Materials ——— */}
      {project.materials.length || showStubs ? (
        <section data-tone="light" className="bg-kapur-deep text-ink" aria-labelledby="materials-title">
          <div className="page-x section-y">
            <div className="page-grid gap-y-10">
              <div className="col-span-12 lg:col-span-3">
                {/* The section has no title of its own, so its label is its heading (as In motion). */}
                <Label as="h2" pill className="text-ink-muted">
                  <span id="materials-title">Materials and finishes</span>
                </Label>
              </div>
              <div className="col-span-12 lg:col-span-8 lg:col-start-5">
                {project.materials.length ? (
                  <dl className="grid border-t border-ink/15 sm:grid-cols-2 sm:gap-x-[var(--grid-gap)]">
                    {project.materials.map((m) => (
                      <div key={m.name} className="border-b border-ink/15 py-5">
                        <dt className="t-title">{m.name}</dt>
                        <dd className="t-meta mt-2 text-ink-soft">{m.note}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <Pending title="Material palette">The main materials and finishes, each with a line on why it was chosen.</Pending>
                )}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* ——— Constraints and responses ——— */}
      {project.challenges.length || showStubs ? (
        <section data-tone="dark" className="relative">
          <div className="page-x section-y">
            <div className="page-grid gap-y-10">
              <div className="col-span-12 lg:col-span-3">
                <Label pill className="text-mouse">
                  Problems worth solving
                </Label>
              </div>
              <div className="col-span-12 lg:col-span-8 lg:col-start-5">
                <h2 className="t-headline">
                  <span className="block">Constraint,</span>
                  <span className="t-follow block text-rikyu">then response.</span>
                </h2>
                {project.challenges.length ? (
                  <ol className="mt-12 border-t border-kapur/15">
                    {project.challenges.map((c, i) => (
                      <li key={i} className="grid gap-5 border-b border-kapur/15 py-8 sm:grid-cols-[3rem_1fr_1fr] sm:gap-8">
                        <span className="t-label tabular-nums text-mouse">{String(i + 1).padStart(2, "0")}</span>
                        <p>{c.constraint}</p>
                        <p className="text-kapur/80">
                          <span className="t-label mb-2 block text-rikyu">Response</span>
                          {c.response}
                        </p>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <div className="mt-10">
                    <Pending title="Constraints and responses" tone="dark">
                      Two to four real problems on this project and what was decided in response.
                    </Pending>
                  </div>
                )}
                {project.quote && (project.quote.approved || SHOW_DRAFTS) ? (
                  <blockquote className="mt-16 max-w-[38rem]">
                    <p className="t-quote">&ldquo;{project.quote.text}&rdquo;</p>
                    <footer className="t-caption mt-4 text-mouse">{project.quote.attribution}</footer>
                  </blockquote>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* ——— The rest of the photographs ——— */}
      {remainder.length ? (
        <section data-tone="light" className="bg-kapur text-ink" aria-label="More photographs">
          <div className="page-x section-y space-y-[var(--grid-gap)]">
            {remainder.map((row, i) => (
              <GalleryRow key={i} row={row} />
            ))}
          </div>
        </section>
      ) : null}

      {/* ——— Related services and the next step ——— */}
      <section data-tone="light" className="bg-kapur text-ink">
        <div className={`page-x ${groundAbove === "kapur" ? "pb-[var(--section-space)]" : "section-y"}`}>
          {groundAbove === "kapur" ? <CurveRule className="mb-16 text-ink/25" at="30%" /> : null}
          <div className="page-grid gap-y-10">
            <div className="col-span-12 lg:col-span-6">
              <h2 className="t-headline">
                <span className="block">Planning something similar?</span>
                <span className="t-follow block text-rikyu">Start with a conversation.</span>
              </h2>
              <div className="mt-10 flex flex-wrap gap-3">
                {/* An ink focus ring: in the button's own Milky White it would vanish into the page. */}
                <ButtonLink href={`/contact?project=${project.sector}`} variant="dark" className="focus-visible:outline-ink">
                  Discuss your project
                </ButtonLink>
              </div>
            </div>
            {related.length ? (
              <div className="col-span-12 lg:col-span-4 lg:col-start-9">
                {/* "Related", not "on this project": ROUANG's part (below) can be narrower than the service. */}
                <p className="t-label text-ink-muted">Related service</p>
                <ul className="mt-5 border-t border-ink/15">
                  {related.map((s) => (
                    <li key={s.slug} className="border-b border-ink/15">
                      <Link href={`/services/${s.slug}`} className="link-fade flex min-h-14 items-center py-4 font-medium">
                        {s.navLabel}
                      </Link>
                    </li>
                  ))}
                </ul>
                <p className="t-caption mt-4 text-ink-muted">
                  ROUANG&rsquo;s role on this project: {project.scope.join(", ").toLowerCase()}.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {next ? <NextProject project={next} /> : null}
    </article>
  );
}

/**
 * The poster's `sizes`, matching the In motion band: one loop at most 416px wide and 60vh (its cap);
 * two side by side; three or more in threes from 640px (in the band's nine columns from 1024px), and
 * in twos on a phone, where the first of exactly three runs the full width.
 */
function loopSizes(count: number, i: number) {
  if (count === 1) return "min(92vw, 416px, 60vh)";
  if (count === 2) return "(min-width: 1024px) 35vw, 46vw";
  return `(min-width: 1024px) 24vw, (min-width: 640px) 31vw, ${count === 3 && i === 0 ? "92vw" : "46vw"}`;
}

/** Phones get the narrow clip and larger screens the wide one; a missing one leaves those screens the still. */
function filmSources(film: NonNullable<Project["film"]>): FilmSource[] {
  // The first source whose media query matches is the one played, so the wide clip is the fallback.
  return [
    ...(film.narrow ? [{ src: film.narrow.src, media: "(max-width: 1023px)" }] : []),
    ...(film.wide ? [{ src: film.wide.src, media: film.narrow ? undefined : "(min-width: 1024px)" }] : []),
  ];
}

/**
 * The opening still. With a film it is the film's own first frame on the screens the film plays on,
 * and the case study's photograph everywhere else.
 */
function openerStill(hero: ImageData, film: Project["film"]): ImageData {
  if (!film) return hero;
  const heroWide = hero.wide ?? { src: hero.src, width: hero.width, height: hero.height };
  const narrow = film.narrow
    ? { src: film.narrow.poster, width: film.narrow.width, height: film.narrow.height, focus: "50% 50%" }
    : { src: hero.src, width: hero.width, height: hero.height, focus: hero.focus };
  const wide = film.wide ? { src: film.wide.poster, width: film.wide.width, height: film.wide.height } : heroWide;
  // When the film covers every screen, the still is always its first frame, so it takes the film's description.
  const alt = film.wide && film.narrow && film.caption ? film.caption : hero.alt;
  return { ...hero, ...narrow, wide, alt };
}

/*
 * The gallery, in rows. A row is one wide view, or two or three photographs side by side; which one
 * is set in the project's Markdown by each photograph's `span` and its order:
 *   full / wide   a landscape on its own, as a 16:9 view
 *   half          two side by side (consecutive halves pair up)
 *   narrow        three side by side (consecutive narrows group in threes)
 * Every frame is one of three shapes whatever the file's own proportions: portraits 4:5, landscapes
 * 3:2, and anything wider 16:9 (`focus` sets what a crop keeps). In a row the photographs share one
 * height, so tops and feet line up, even where a portrait sits beside a landscape. The row's height
 * is capped by the sizing standard (styles/pages/case-study.css), so a row of portraits is drawn
 * narrower rather than taller. A portrait is never left on its own: it joins the row beside it.
 */
type GalleryRowData = { wide: boolean; cells: GalleryItem[] };

const PORTRAIT = 4 / 5;
const LANDSCAPE = 3 / 2;
const WIDE = 16 / 9;

function frameRatio(item: GalleryItem) {
  const own = "pending" in item ? ratioOf(item.aspect) : item.width / item.height;
  return own < 1 ? PORTRAIT : own < 1.65 ? LANDSCAPE : WIDE;
}

function ratioOf(aspect: string) {
  const [w, h] = aspect.split("/").map(Number);
  return w / h;
}

function planGallery(items: GalleryItem[]): GalleryRowData[] {
  const rows: GalleryRowData[] = [];
  for (let i = 0; i < items.length; ) {
    const first = items[i];
    if ((first.span === "full" || first.span === "wide") && frameRatio(first) > 1) {
      rows.push({ wide: true, cells: [first] });
      i += 1;
      continue;
    }
    const size = first.span === "narrow" ? 3 : 2;
    let n = 1;
    while (n < size && i + n < items.length && items[i + n].span === first.span) n += 1;
    rows.push({ wide: false, cells: items.slice(i, i + n) });
    i += n;
  }
  // A photograph left on its own: a landscape stands as a wide view; a portrait joins the row
  // before it (or after it) where that row has room, so it is never alone at full width.
  for (let r = 0; r < rows.length; r += 1) {
    const row = rows[r];
    if (row.wide || row.cells.length > 1) continue;
    if (frameRatio(row.cells[0]) > 1) {
      row.wide = true;
      continue;
    }
    const host = [rows[r - 1], rows[r + 1]].find((h) => h && !h.wide && h.cells.length < 3);
    if (!host) continue;
    if (host === rows[r - 1]) host.cells.push(row.cells[0]);
    else host.cells.unshift(row.cells[0]);
    rows.splice(r, 1);
    r -= 1;
  }
  return rows;
}

function GalleryRow({ row, className = "" }: { row: GalleryRowData; className?: string }) {
  const ratios = row.cells.map((c) => (row.wide ? WIDE : frameRatio(c)));
  const sum = ratios.reduce((s, r) => s + r, 0);
  const first = row.cells[0];
  // A wide view is never drawn wider than its file, so a small render is not blown up.
  const max = row.wide && !("pending" in first) ? `${first.width}px` : undefined;
  // The row's 720px height cap, lowered for a wide view whose file is narrower than 720px × 16:9.
  const capPx = row.wide && !("pending" in first) ? Math.min(720, first.width / WIDE) : 720;
  return (
    <div
      className={`cs-row ${className}`}
      style={{ "--cs-sum": sum.toFixed(4), "--cs-gaps": row.cells.length - 1, "--cs-max": max } as CSSProperties}
    >
      {row.cells.map((img, k) => (
        <Figure
          key={"pending" in img ? img.pending : img.src}
          image={img}
          aspect="var(--cs-a)"
          // Phones: the width of the page. Larger screens: the frame's share of the row, but never
          // more than the row's height cap, min(72svh, 720px), allows its shape (nor, for a wide
          // view, its file's own width), as case-study.css draws it. The space after "min(" is
          // deliberate: next/image only reads a vw share preceded by whitespace when it picks the
          // widths for the srcset, and without it the smaller files would be left out.
          sizes={`(min-width: 640px) min( ${Math.ceil((ratios[k] / sum) * 92)}vw, ${Math.ceil(72 * ratios[k])}vh, ${Math.ceil(capPx * ratios[k])}px), 92vw`}
          className={`cs-cell ${ratios[k] > 1 ? "cs-cell-land" : ""}`}
          style={{ "--cs-r": ratios[k].toFixed(4) } as CSSProperties}
          showCaption
        />
      ))}
    </div>
  );
}

function NextProject({ project }: { project: Project }) {
  const img = publicImage(project.card ?? project.hero);
  const photo = img && !("pending" in img) ? img : null;
  return (
    <section data-tone="dark" aria-label="Next project">
      <Link href={`/projects/${project.slug}`} className="next-link group relative block overflow-hidden">
        {/* At least 28rem, so the title has room, but never more than 75svh on a landscape phone. */}
        <div className="relative h-[70svh] min-h-[min(28rem,75svh)]">
          {photo ? (
            <ViewTransition name={`project-${project.slug}`} share="project-image" default="none">
              <div className="absolute inset-0 transition-[clip-path] duration-[1.2s] ease-[var(--ease-settle)] [clip-path:circle(38%_at_72%_50%)] group-hover:[clip-path:circle(120%_at_72%_50%)] group-focus-visible:[clip-path:circle(120%_at_72%_50%)]">
                <Image src={photo.src} alt="" fill sizes="100vw" className="object-cover" />
              </div>
            </ViewTransition>
          ) : null}
          {photo ? <div className="next-shade absolute inset-0" aria-hidden="true" /> : null}
          <div className="page-x absolute inset-0 flex flex-col justify-end pb-12">
            <p className="t-label text-mouse">Next project</p>
            <p className="t-headline mt-3">{project.title}</p>
            <p className="t-caption mt-4 text-mouse">
              {project.type}
              {project.location ? ` · ${project.location}` : ""}
              {project.visualisation ? " · Design proposal" : ""}
            </p>
          </div>
        </div>
      </Link>
    </section>
  );
}

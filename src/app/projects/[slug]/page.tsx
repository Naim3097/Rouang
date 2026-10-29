import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ViewTransition } from "react";
import { CurveRule, Mark } from "@/components/brand/Brand";
import { TitleBlock } from "@/components/projects/TitleBlock";
import { DraftTag } from "@/components/projects/ProjectIndex";
import { ArrowLink, ButtonLink } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Figure } from "@/components/ui/Figure";
import { Film } from "@/components/ui/Film";
import { Pending } from "@/components/ui/Section";
import { Label } from "@/components/ui/Typography";
import { getProject, getProjects, getServices, publicImage, type Project } from "@/lib/content";
import type { GalleryItem } from "@/lib/content/schema";
import { SHOW_DRAFTS } from "@/lib/env";
import { pageMetadata } from "@/lib/seo";

export const ensureStatic = "navigation";

export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.map((p) => ({ slug: p.slug }));
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

/*
 * The params-dependent content sits inside Suspense so a default <Link> can show the page frame
 * instantly. Every slug is prerendered, so in practice the fallback is never seen.
 */
export default function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  return (
    <Suspense fallback={<div data-tone="dark" className="min-h-[100svh]" aria-busy="true" />}>
      <ProjectPageContent params={params} />
    </Suspense>
  );
}

async function ProjectPageContent({ params }: { params: PageProps<"/projects/[slug]">["params"] }) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();

  const [projects, services] = await Promise.all([getProjects(), getServices()]);
  const index = projects.findIndex((p) => p.slug === project.slug);
  const next = projects.length > 1 ? projects[(index + 1) % projects.length] : null;
  const related = services.filter((s) => project.services.includes(s.slug));

  const hero = publicImage(project.hero);
  const gallery = project.gallery.map((g) => publicImage(g)).filter(Boolean) as GalleryItem[];
  const showStubs = SHOW_DRAFTS && !project.placeholder;

  const chapters: Chapter[] = [
    { key: "brief", label: "The brief", title: "What the space had to do", body: project.brief, hint: "The client's brief in a few sentences: who uses the space, what was wrong with it, what had to change." },
    { key: "concept", label: "The idea", title: "The thought that organised it", body: project.concept, hint: "The design concept in the studio's own words." },
    { key: "planning", label: "The plan", title: "How the space was arranged", body: project.planning, hint: "Spatial planning decisions: circulation, zoning, seating or storage, and why." },
    { key: "lighting", label: "Light", title: "Day and evening", body: project.lighting, hint: "How natural and artificial light were handled." },
  ];
  const visibleChapters = chapters.filter((c) => c.body || showStubs);

  // Photographs are threaded through the story rather than parked at the end.
  const lead = gallery[0] ?? null;
  const threaded = visibleChapters.map((_, i) => gallery.slice(1 + i * 2, 3 + i * 2));
  const remainder = gallery.slice(1 + visibleChapters.length * 2);

  const facts = [project.sector === "commercial" ? "Commercial" : "Residential", project.type, project.location].filter(Boolean).join(" · ");

  return (
    <article>
      {/* ——— Opening: the photograph, full screen, with the title set on it ——— */}
      <header data-tone="dark" className="relative min-h-[100svh] overflow-hidden">
        <div className="absolute inset-0">
          {project.film ? (
            <Film
              src={project.film.src}
              poster={project.film.poster}
              width={project.film.width}
              height={project.film.height}
              label={project.film.caption ?? `Film of ${project.title}`}
              fill
            />
          ) : hero ? (
            <ViewTransition name={`project-${project.slug}`} share="project-image" default="none">
              <div className="absolute inset-0">
                {"pending" in hero ? (
                  <Figure image={hero} sizes="100vw" aspect="auto" tone="dark" reveal={false} className="h-full" />
                ) : (
                  <Image src={hero.src} alt={hero.alt} fill priority fetchPriority="high" sizes="100vw" quality={80} className="object-cover" />
                )}
              </div>
            </ViewTransition>
          ) : null}
          <div className="absolute inset-0 bg-linear-to-t from-ink via-ink/35 to-ink/10" aria-hidden="true" />
        </div>

        <div className="page-x relative flex min-h-[100svh] flex-col justify-between pb-12 pt-[calc(var(--header-h)+1.5rem)] sm:pb-16">
          <Breadcrumbs tone="dark" items={[{ name: "Projects", href: "/projects" }, { name: project.title, href: `/projects/${project.slug}` }]} />
          <div>
            <p className="t-label text-kapur/75">{facts}</p>
            <h1 className="mt-5 font-serif text-[clamp(3.5rem,1.5rem+9vw,11rem)] italic leading-[0.86] tracking-[-0.02em]">
              {project.title}
              {project.isDraft ? <DraftTag placeholder={project.placeholder} /> : null}
            </h1>
            <p className="t-sub mt-7 max-w-[40rem] text-kapur/85">{project.standfirst ?? project.summary}</p>
          </div>
        </div>
      </header>

      {/* ——— Facts and scope ——— */}
      <section data-tone="light" className="bg-kapur text-ink">
        <div className="page-x section-y">
          <div className="page-grid gap-y-12">
            <div className="col-span-12 lg:col-span-4">
              <Label className="text-ink-muted">Project</Label>
              <TitleBlock project={project} className="mt-6" />
              {project.photography.credit ? (
                <p className="t-caption mt-4 text-ink-muted">Photography: {project.photography.credit}</p>
              ) : null}
              {project.visualisation ? (
                <p className="t-caption mt-4 border-l border-rikyu pl-3 text-ink-muted">
                  The images on this page are design visualisations prepared by the studio, not photographs of the
                  finished space.
                </p>
              ) : null}
            </div>
            <div className="col-span-12 lg:col-span-7 lg:col-start-6">
              <p className="t-sub">{project.summary}</p>
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
          {lead ? (
            <Figure image={lead} sizes="100vw" className="mt-20 sm:mt-28" showCaption />
          ) : null}
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
                      <Label index={String(i + 1).padStart(2, "0")} className="text-ink-muted">
                        {c.label}
                      </Label>
                    </div>
                  </div>
                  <div className="col-span-12 lg:col-span-7 lg:col-start-5">
                    <h2 className="t-headline text-[clamp(1.875rem,1.3rem+2vw,3rem)]">{c.title}</h2>
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
                {threaded[i]?.length ? <GalleryRow items={threaded[i]} flip={i % 2 === 1} /> : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* ——— Materials ——— */}
      {project.materials.length || showStubs ? (
        <section data-tone="light" className="bg-kapur-deep text-ink">
          <div className="page-x section-y">
            <div className="page-grid gap-y-10">
              <div className="col-span-12 lg:col-span-3">
                <Label className="text-ink-muted">Materials and finishes</Label>
              </div>
              <div className="col-span-12 lg:col-span-8 lg:col-start-5">
                {project.materials.length ? (
                  <dl className="grid border-t border-ink/15 sm:grid-cols-2 sm:gap-x-[var(--grid-gap)]">
                    {project.materials.map((m) => (
                      <div key={m.name} className="border-b border-ink/15 py-5">
                        <dt className="t-sub">{m.name}</dt>
                        <dd className="mt-2 text-[0.9375rem] text-ink-soft">{m.note}</dd>
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
                <Label className="text-mouse">Problems worth solving</Label>
              </div>
              <div className="col-span-12 lg:col-span-8 lg:col-start-5">
                <h2 className="t-headline">
                  <span className="block">Constraint,</span>
                  <span className="t-italic-display block text-[1.08em] text-rikyu">then response.</span>
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
                    <p className="font-serif text-[clamp(1.75rem,1.3rem+1.6vw,2.75rem)] italic leading-[1.2]">&ldquo;{project.quote.text}&rdquo;</p>
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
            {chunk(remainder, 2).map((row, i) => (
              <GalleryRow key={i} items={row} flip={i % 2 === 0} tight />
            ))}
          </div>
        </section>
      ) : null}

      {/* ——— Related services and the next step ——— */}
      <section data-tone="light" className="bg-kapur text-ink">
        <div className="page-x pb-[var(--section-space)]">
          <CurveRule className="mb-16 text-ink/25" at="30%" />
          <div className="page-grid gap-y-10">
            <div className="col-span-12 lg:col-span-6">
              <h2 className="t-headline">
                <span className="block">Planning something similar?</span>
                <span className="t-italic-display block text-[1.08em] text-rikyu">Start with a conversation.</span>
              </h2>
              <div className="mt-10 flex flex-wrap gap-3">
                <ButtonLink href={`/contact?project=${project.sector}`} variant="dark">
                  Discuss your project
                </ButtonLink>
              </div>
            </div>
            {related.length ? (
              <div className="col-span-12 lg:col-span-4 lg:col-start-9">
                <p className="t-label text-ink-muted">Services on this project</p>
                <ul className="mt-5 border-t border-ink/15">
                  {related.map((s) => (
                    <li key={s.slug} className="border-b border-ink/15">
                      <ArrowLink href={`/services/${s.slug}`} className="w-full justify-between py-4">
                        {s.navLabel}
                      </ArrowLink>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {next ? <NextProject project={next} /> : null}
    </article>
  );
}

function GalleryRow({ items, flip = false, tight = false }: { items: GalleryItem[]; flip?: boolean; tight?: boolean }) {
  const spanClass: Record<GalleryItem["span"], string> = {
    full: "col-span-12",
    wide: "col-span-12 lg:col-span-9",
    half: "col-span-12 sm:col-span-6",
    narrow: "col-span-12 sm:col-span-5 lg:col-span-4",
  };
  return (
    <div className={`page-grid items-end gap-y-[var(--grid-gap)] ${tight ? "" : "mt-16 sm:mt-24"}`}>
      {items.map((img, k) => {
        const start = items.length === 1 && img.span !== "full" ? (flip ? "lg:col-start-4" : "") : "";
        return (
          <Figure
            key={k}
            image={img}
            sizes={img.span === "full" ? "100vw" : img.span === "narrow" ? "(min-width: 1024px) 33vw, 100vw" : "(min-width: 640px) 50vw, 100vw"}
            className={`${spanClass[img.span]} ${start} ${flip && k === 0 && items.length > 1 ? "sm:order-2" : ""}`}
            revealDelay={k * 120}
            showCaption
          />
        );
      })}
    </div>
  );
}

function NextProject({ project }: { project: Project }) {
  const img = publicImage(project.card ?? project.hero);
  const photo = img && !("pending" in img) ? img : null;
  return (
    <section data-tone="dark" aria-label="Next project">
      <Link href={`/projects/${project.slug}`} className="group relative block overflow-hidden" prefetch={true}>
        <div className="relative h-[70svh] min-h-[28rem]">
          {photo ? (
            <ViewTransition name={`project-${project.slug}`} share="project-image" default="none">
              <div className="absolute inset-0 transition-[clip-path] duration-[1.2s] ease-[var(--ease-settle)] [clip-path:circle(38%_at_72%_50%)] group-hover:[clip-path:circle(120%_at_72%_50%)] group-focus-visible:[clip-path:circle(120%_at_72%_50%)]">
                <Image src={photo.src} alt="" fill sizes="100vw" className="object-cover" />
              </div>
            </ViewTransition>
          ) : null}
          <div className="page-x absolute inset-0 flex flex-col justify-end pb-12">
            <p className="t-label text-mouse">Next project</p>
            <p className="mt-4 flex items-end gap-6 font-serif text-[clamp(3rem,1.5rem+6vw,8rem)] italic leading-[0.9]">
              {project.title}
              <Mark className="mb-3 h-8 w-8 shrink-0 not-italic transition-transform duration-500 group-hover:translate-x-2" />
            </p>
            <p className="t-caption mt-4 text-mouse">
              {project.type}
              {project.location ? ` · ${project.location}` : ""}
            </p>
          </div>
        </div>
      </Link>
    </section>
  );
}

function chunk<T>(arr: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

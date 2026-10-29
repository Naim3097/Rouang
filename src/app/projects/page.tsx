import { Fragment } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { DraftTag } from "@/components/projects/ProjectIndex";
import { SectorFilter } from "@/components/projects/SectorFilter";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Figure } from "@/components/ui/Figure";
import { Label, TitlePair } from "@/components/ui/Typography";
import { getProjects, publicImage } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const ensureStatic = "navigation";

export const metadata: Metadata = pageMetadata({
  title: "Interior design projects: homes and restaurants",
  description:
    "Interior design projects by ROUANG across the Klang Valley, from the Rembayung restaurant in Kampung Baru to family homes in Selangor.",
  path: "/projects",
});

/*
 * Plates are laid out to a rhythm rather than a uniform grid: a wide landscape, then a tall
 * plate set lower, then the reverse. Each entry is [column classes, aspect ratio, vertical offset].
 */
const rhythm: [string, string, string][] = [
  ["lg:col-span-7", "4/3", ""],
  ["lg:col-span-4 lg:col-start-9", "4/5", "lg:mt-40"],
  ["lg:col-span-5 lg:col-start-2", "4/5", ""],
  ["lg:col-span-6 lg:col-start-7", "3/2", "lg:mt-24"],
  ["lg:col-span-8 lg:col-start-3", "16/9", ""],
];

export default async function ProjectsPage() {
  const projects = await getProjects();
  const counts = {
    all: projects.length,
    residential: projects.filter((p) => p.sector === "residential").length,
    commercial: projects.filter((p) => p.sector === "commercial").length,
  };
  // Finished work first; design proposals follow under their own heading.
  const ordered = [...projects].sort((a, b) => Number(a.visualisation) - Number(b.visualisation) || a.order - b.order);

  return (
    <>
      <section data-tone="light" className="bg-kapur text-ink">
        <div className="page-x pb-16 pt-[calc(var(--header-h)+3rem)] sm:pb-24">
          <Breadcrumbs items={[{ name: "Projects", href: "/projects" }]} />
          <div className="page-grid mt-16 gap-y-10 sm:mt-24">
            <Label className="col-span-12 text-ink-muted lg:col-span-3">Projects</Label>
            <div className="col-span-12 lg:col-span-9">
              <TitlePair as="h1" size="hero" lead="Rooms we have designed" italic="for homes and for business" />
              <p className="mt-8 max-w-[38rem] text-ink-soft">
                Every project starts from a different place, a different budget and a different way of using a room.
                These are the ones we can show you, each with the thinking behind it.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section data-tone="light" className="bg-kapur text-ink" aria-label="Projects">
        <div className="page-x pb-[var(--section-space)]">
          <div className="mb-14 flex flex-wrap items-center justify-between gap-6 border-t border-ink/15 pt-6">
            <SectorFilter targetId="project-plates" counts={counts} />
            <p className="t-caption text-ink-muted">
              {projects.length} {projects.length === 1 ? "project" : "projects"}
            </p>
          </div>

          <ul id="project-plates" data-filter="all" className="page-grid gap-y-20 sm:gap-y-28 [&[data-filter=commercial]_[data-sector=residential]]:hidden [&[data-filter=residential]_[data-sector=commercial]]:hidden">
            {ordered.map((p, i) => {
              const [cols, aspect, offset] = rhythm[i % rhythm.length];
              const img = publicImage(p.card ?? p.hero);
              const firstProposal = p.visualisation && !ordered[i - 1]?.visualisation;
              return (
                <Fragment key={p.slug}>
                {firstProposal ? (
                  <li className="col-span-12 border-t border-ink/15 pt-6">
                    <h2 className="t-sub">Design proposals</h2>
                    <p className="t-caption mt-2 max-w-[40rem] text-ink-muted">
                      Projects at design stage, shown in the studio&rsquo;s own visualisations rather than photographs of
                      finished rooms.
                    </p>
                  </li>
                ) : null}
                <li data-sector={p.sector} className={`col-span-12 ${cols} ${offset}`}>
                  <Link href={`/projects/${p.slug}`} className="group block" prefetch={true}>
                    {img ? (
                      <Figure
                        image={img}
                        aspect={aspect}
                        sizes="(min-width: 1024px) 60vw, 100vw"
                        transitionName={`project-${p.slug}`}
                        imgClassName="transition-transform duration-[1.6s] ease-[var(--ease-brand)] group-hover:scale-[1.03]"
                      />
                    ) : null}
                    <div className="mt-5 flex items-start justify-between gap-6">
                      <div>
                        <h2 className="font-serif text-[clamp(1.875rem,1.4rem+1.6vw,2.875rem)] italic leading-none">
                          <span className="link-reveal">{p.title}</span>
                          {p.isDraft ? <DraftTag placeholder={p.placeholder} /> : null}
                        </h2>
                        <p className="t-caption mt-3 text-ink-muted">
                          {[p.type, p.location, p.visualisation ? "Design visualisation" : null].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <span className="t-label tabular-nums text-ink-muted">{String(i + 1).padStart(2, "0")}</span>
                    </div>
                  </Link>
                </li>
                </Fragment>
              );
            })}
          </ul>
        </div>
      </section>
    </>
  );
}

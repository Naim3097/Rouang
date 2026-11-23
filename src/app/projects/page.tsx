import type { Metadata } from "next";
import Link from "next/link";
import { DraftTag } from "@/components/projects/ProjectIndex";
import { SectorFilter } from "@/components/projects/SectorFilter";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Figure } from "@/components/ui/Figure";
import { Label, TitlePair } from "@/components/ui/Typography";
import { getProjects, publicImage, type Project } from "@/lib/content";
import type { Image as ImageData, PendingImage } from "@/lib/content/schema";
import { pageMetadata } from "@/lib/seo";

export const ensureStatic = "navigation";

export async function generateMetadata(): Promise<Metadata> {
  const empty = (await getProjects()).length === 0;
  return pageMetadata({
  title: "Interior design projects: homes and restaurants",
  description:
    "Interior design projects by ROUANG in the Klang Valley: restaurants and homes, from finished rooms to design proposals.",
  path: "/projects",
    // An empty listing is a thin page: keep it out of the index until something is published.
    noindex: empty,
  });
}

/*
 * Plates sit in a plain grid: two columns from tablets up (each one half of the page grid), one on
 * phones. Every plate is the same size and the same shape, 4:3, with its caption beneath it at the
 * same distance, so the columns, the pictures and the captions all line up. Two across rather than
 * three: the photographs stay large enough to read a room, and the smaller source files (some
 * visualisations are only about 1,100 px wide) still hold at that size. The one exception is a group
 * of exactly three or six on large screens (Plates), which sits three across rather than leave a
 * plate alone beside an empty half.
 */
const PLATE_ASPECT = "4/3";

/** A plate is landscape, so a photograph with its own landscape crop shows that crop instead. */
function plateImage(img: ImageData | PendingImage): ImageData | PendingImage {
  if ("pending" in img || !img.wide) return img;
  // The wide crop is already centred on the focus line, so it sits centred.
  return { ...img, src: img.wide.src, width: img.wide.width, height: img.wide.height, focus: undefined, wide: undefined };
}

export default async function ProjectsPage() {
  const projects = await getProjects();
  const counts = {
    all: projects.length,
    residential: projects.filter((p) => p.sector === "residential").length,
    commercial: projects.filter((p) => p.sector === "commercial").length,
  };
  // Finished work first; design proposals follow under their own heading.
  const built = projects.filter((p) => !p.visualisation);
  const proposals = projects.filter((p) => p.visualisation);

  return (
    <>
      <section data-tone="light" className="bg-kapur text-ink">
        <div className="page-x pb-16 pt-[calc(var(--header-h)+3rem)] sm:pb-24">
          <Breadcrumbs items={[{ name: "Projects", href: "/projects" }]} />
          <div className="page-grid mt-16 gap-y-10 sm:mt-24">
            <Label className="col-span-12 text-ink-muted lg:col-span-3">Projects</Label>
            <div className="col-span-12 lg:col-span-9">
              <TitlePair as="h1" size="hero" eyebrow="Interior design projects" lead="Rooms we have designed" follow="for homes and for business" />
              <p className="mt-8 max-w-[38rem] text-ink-soft">
                Every project starts from a different place, a different budget and a different way of using a room.
                These are the ones we can show you: finished rooms first, then designs still on the drawing board.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section data-tone="light" className="bg-kapur text-ink" aria-label="Projects">
        <div className="page-x pb-[var(--section-space)]">
          <div className="mb-12 flex flex-wrap items-center justify-between gap-6 border-t border-ink/15 pt-6 sm:mb-16">
            <SectorFilter targetId="project-plates" counts={counts} />
          </div>

          {/* The filter sets data-filter here; globals.css ("Projects page") does the hiding. */}
          <div id="project-plates" data-filter="all" className="project-plates">
            {built.length > 0 ? (
              <div className="plate-group">
                <Plates projects={built} startAt={1} heading="h2" />
              </div>
            ) : null}
            {proposals.length > 0 ? (
              <div className="plate-group">
                <div className="mb-10 border-t border-ink/15 pt-6 sm:mb-12">
                  <h2 className="t-headline">Design proposals</h2>
                  <p className="t-caption mt-2 max-w-[40rem] text-ink-muted">
                    Shown in ROUANG&rsquo;s own design visualisations rather than photographs of finished rooms.
                  </p>
                </div>
                <Plates projects={proposals} startAt={built.length + 1} heading="h3" />
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}

/**
 * One group of plates. Built work is numbered first and the proposals carry on from it.
 * A group of three (or six) sits three across on large screens, so its last row is never one plate
 * beside an empty half; it also sets the proposals a step smaller than the finished work above them.
 */
function Plates({ projects, startAt, heading: Heading }: { projects: Project[]; startAt: number; heading: "h2" | "h3" }) {
  const threes = projects.length % 3 === 0;
  return (
    <ul className={`grid gap-x-[var(--grid-gap)] gap-y-[clamp(3rem,6vw,5rem)] sm:grid-cols-2 ${threes ? "lg:grid-cols-3" : ""}`}>
      {projects.map((p, i) => {
        const img = publicImage(p.card ?? p.hero);
        const n = startAt + i;
        return (
          <li key={p.slug} data-sector={p.sector}>
            <Link href={`/projects/${p.slug}`} className="group block">
              {img ? (
                <Figure
                  image={plateImage(img)}
                  aspect={PLATE_ASPECT}
                  sizes={threes ? "(min-width: 1024px) 31vw, (min-width: 640px) 46vw, 92vw" : "(min-width: 640px) 46vw, 92vw"}
                  // The first plate is the largest paint on this page.
                  priority={n === 1}
                  transitionName={`project-${p.slug}`}
                  imgClassName="transition-transform duration-[1.6s] ease-[var(--ease-brand)] group-hover:scale-[1.03]"
                />
              ) : null}
              <div className="mt-5 flex items-baseline justify-between gap-6">
                <Heading className="link-name t-title">
                  {p.title}
                  {p.isDraft ? <DraftTag placeholder={p.placeholder} /> : null}
                </Heading>
                <span className="t-label tabular-nums text-ink-muted">{String(n).padStart(2, "0")}</span>
              </div>
              <p className="t-caption mt-2 text-ink-muted">
                {[p.type, p.location].filter(Boolean).join(" · ")}
                {/* The proposal label is never split across two lines. */}
                {p.visualisation ? (
                  <>
                    {" · "}
                    <span className="whitespace-nowrap">Design visualisation</span>
                  </>
                ) : null}
              </p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { shownImage } from "@/components/projects/images";
import { DraftTag } from "@/components/projects/ProjectIndex";
import { SectorFilter } from "@/components/projects/SectorFilter";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ButtonLink } from "@/components/ui/Button";
import { Figure } from "@/components/ui/Figure";
import { RikyuField } from "@/components/ui/RikyuField";
import { TitlePair } from "@/components/ui/Typography";
import { getProjects, type Project } from "@/lib/content";
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
      {/* The opening: the Rikyū green field of the home page's "Start a conversation" (RikyuField, full
          bleed), with the words in Milky White and centred, as the Services and About openings set
          theirs, in the same measure and spacing as Services. The header turns light over it
          (data-tone="rikyu"). Every line is solid Milky White, the small capitals too, as the home
          panel's labels are: at 80% the eyebrow fell just below 4.5:1 where the green is lightest. */}
      <RikyuField>
        <div className="page-x pb-[var(--section-space)] pt-[calc(var(--header-h)+3rem)]">
          <Breadcrumbs tone="photo" items={[{ name: "Projects", href: "/projects" }]} />
          <div className="mx-auto mt-10 flex max-w-[62rem] flex-col items-center text-center sm:mt-12">
            <TitlePair
              as="h1"
              size="hero"
              eyebrow="Interior design projects"
              eyebrowClassName="text-kapur"
              lead="Rooms we have designed"
              follow="for homes and for business"
              followClassName="text-kapur"
            />
            <p className="t-sub mt-8 max-w-[38rem] text-kapur">
              Every project starts from a different place, a different budget and a different way of using a room.
              {/* Only promised when there is work below to show. */}
              {projects.length ? " These are the ones we can show you: finished rooms first, then designs still on the drawing board." : null}
            </p>
          </div>
        </div>
      </RikyuField>

      {/* The plates start on the page's own grey after the green, with a section's full space above the
          filter: the change of ground is the divide, so the filter row needs no rule of its own. */}
      <section data-tone="light" className="bg-kapur text-ink" aria-label="Projects">
        <div className="page-x section-y">
          {projects.length ? (
            <>
              {/* A filter only where there is a choice: with every project in one sector it would offer a 0. */}
              {counts.residential && counts.commercial ? (
                <div className="mb-12 flex flex-wrap items-center justify-between gap-6 sm:mb-16">
                  <SectorFilter targetId="project-plates" counts={counts} />
                </div>
              ) : null}

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
            </>
          ) : (
            // Nothing published yet (the live site before launch): one line and a way forward, centred
            // under the centred opening, instead of a filter of zeros over an empty grid. The focus
            // ring is ink, as on the filter pills: in the button's own Milky White it would vanish
            // into the page around it.
            <div className="mx-auto flex max-w-[38rem] flex-col items-center text-center">
              <p className="t-sub text-ink-soft">The first projects are being prepared for this page.</p>
              <ButtonLink href="/contact" variant="dark" className="mt-10 focus-visible:outline-ink">
                Discuss your project
              </ButtonLink>
            </div>
          )}
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
        const img = shownImage(p.card ?? p.hero);
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
                    <span className="whitespace-nowrap">Design proposal</span>
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

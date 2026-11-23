import type { Metadata } from "next";
import Link from "next/link";
import { Mark, Wordmark } from "@/components/brand/Brand";
import { ProcessSteps } from "@/components/home/Process";
import { ProjectIndex } from "@/components/projects/ProjectIndex";
import { ButtonLink } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Figure } from "@/components/ui/Figure";
import { Pending } from "@/components/ui/Section";
import { Label, TitlePair } from "@/components/ui/Typography";
import { brandImagery, placeholderImagery } from "@/config/media";
import { founders, team } from "@/config/people";
import { processSteps, processSummary } from "@/config/process";
import { studio } from "@/config/studio";
import { getProjects, getServices, projectImage, publicImage } from "@/lib/content";
import type { Image } from "@/lib/content/schema";
import { pageMetadata } from "@/lib/seo";

export const ensureStatic = "navigation";

export const metadata: Metadata = pageMetadata({
  title: "About ROUANG, a design-led construction company",
  description:
    "ROUANG is a design-led construction company bringing design, planning, project management and construction together. Its vision, mission, process and people.",
  path: "/about",
});

/** Vision and mission, as the company profile states them (p.3). */
const purpose = [
  {
    title: "Vision",
    body: "To become a benchmark design-led construction company recognised for design excellence, quality execution and disciplined project management, building a trusted, high-capability organisation that helps shape new standards for the construction industry in Malaysia and the region.",
  },
  {
    title: "Mission",
    body: "We translate our clients’ aspirations into high-quality, functional and distinctive spaces through thoughtful planning, comprehensive project management and high standards of execution. We uphold transparency, integrity and accountability while continuously developing our people, systems and culture of excellence.",
  },
];

/**
 * One small picture per capability, the same three the Services page shows, keyed by service slug.
 * Temporary Unsplash stand-ins: publicImage() drops them from production, and the columns then read
 * as text alone, as they did before.
 */
const capabilityImagery: Record<string, Image> = {
  "design-and-build": placeholderImagery.capabilityDesignBuild,
  "renovation-and-interior": placeholderImagery.capabilityRenovation,
  "new-build-and-construction": placeholderImagery.capabilityNewBuild,
};

export default async function AboutPage() {
  const [projects, services] = await Promise.all([getProjects(), getServices()]);
  // A real material photograph behind the wordmark; brand-kit atmosphere only as a preview fallback.
  const horizon = projectImage(projects.find((p) => p.slug === "ampang"), "ampang-black-joinery") ?? publicImage(brandImagery.horizonWall);
  // Approach: a drawing being made by hand, beside the words about how the work is planned.
  const drawing = publicImage(placeholderImagery.drawingByHand);

  const approach = [
    <p key="framework">
      Our approach brings design and construction together under a clear project framework, supported by thoughtful
      planning, transparent communication and responsible project management. From initial concept through construction
      and handover, every decision is guided by the project&rsquo;s purpose, our clients&rsquo; needs and a commitment to
      quality.
    </p>,
    <p key="growth">
      As ROUANG continues to grow, we are building more than a portfolio of completed spaces. We are building stronger
      systems, developing capable teams and continuously refining the standards by which we design, manage and deliver our
      work.
    </p>,
  ];

  return (
    <>
      <section data-tone="light" className="bg-kapur text-ink">
        <div className="page-x pb-20 pt-[calc(var(--header-h)+3rem)] sm:pb-28">
          <Breadcrumbs items={[{ name: "About", href: "/about" }]} />
          <div className="page-grid mt-16 gap-y-10 sm:mt-24">
            <Label className="col-span-12 text-ink-muted lg:col-span-3">About</Label>
            <div className="col-span-12 lg:col-span-9">
              <TitlePair
                as="h1"
                size="hero"
                // "design-led" kept whole: a narrow column would otherwise break it at its hyphen.
                eyebrow={
                  <>
                    About ROUANG, <span className="whitespace-nowrap">design-led</span> construction company
                  </>
                }
                lead={studio.line.lead}
                follow={studio.line.follow}
              />
              <p className="t-sub mt-8 max-w-[38rem] text-ink-soft">
                ROUANG is a design-led construction company that integrates design thinking, functionality, planning,
                project management and construction delivery. From renovation and interior enhancement to new-build
                projects, we approach each project as a coordinated process, translating ideas into well-considered
                spaces that are distinctive, functional and built to last.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Approach, in the profile's words (p.2). */}
      <section data-tone="light" className="bg-kapur-deep text-ink" aria-labelledby="approach-title">
        <div className="page-x section-y">
          <div className="page-grid gap-y-10">
            <Label pill index="01" className="col-span-12 text-ink-muted lg:col-span-3">
              Approach
            </Label>
            <div className="col-span-12 lg:col-span-9">
              <h2 id="approach-title" className="t-headline max-w-[22ch]">
                Great spaces are shaped by purposeful design and delivered through disciplined execution.
              </h2>
              {/* With the picture: the picture and the two paragraphs side by side under the statement, the
                  paragraphs one column so the two halves stand about the same height. Without it (production,
                  until the studio supplies its own), the two paragraphs are the two columns. */}
              <div className="mt-12 grid items-start gap-x-[var(--grid-gap)] gap-y-8 text-ink-soft md:grid-cols-2">
                {drawing ? (
                  <>
                    <Figure
                      image={drawing}
                      aspect="3/2"
                      // The frame is drawn in on the hands and the drawing (about-drawing), so the picture
                      // is asked for at half as wide again as its frame.
                      sizes="(min-width: 1024px) 50vw, (min-width: 768px) 70vw, 150vw"
                      imgClassName="about-drawing"
                    />
                    <div className="space-y-6">{approach}</div>
                  </>
                ) : (
                  approach
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision and mission */}
      <section data-tone="light" className="bg-kapur text-ink" aria-labelledby="purpose-title">
        <div className="page-x section-y">
          <div className="page-grid gap-y-10">
            <div className="col-span-12 lg:col-span-3">
              <Label pill index="02" className="text-ink-muted">
                Purpose
              </Label>
              <h2 id="purpose-title" className="visually-hidden">
                Vision and mission
              </h2>
            </div>
            <div className="col-span-12 grid gap-x-[var(--grid-gap)] gap-y-12 lg:col-span-9 lg:grid-cols-2">
              {purpose.map((p) => (
                <div key={p.title} className="border-t border-ink/15 pt-6">
                  <h3 className="t-title">{p.title}</h3>
                  <p className="t-sub mt-5 text-ink-soft">{p.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities, each leading to its service page */}
      {services.length ? (
        <section data-tone="dark" aria-labelledby="capabilities-title">
          <div className="page-x section-y">
            <div className="page-grid gap-y-10">
              <div className="col-span-12 lg:col-span-3">
                <Label pill index="03" className="text-mouse">
                  Capabilities
                </Label>
              </div>
              <div className="col-span-12 lg:col-span-9">
                <h2 id="capabilities-title" className="t-headline max-w-[20ch]">
                  Design, renovation and construction, under one coordinated process.
                </h2>
                <ol className="mt-14 grid gap-x-[var(--grid-gap)] border-t border-kapur/15 md:grid-cols-3">
                  {services.map((s, i) => {
                    const pictured = capabilityImagery[s.slug];
                    const img = pictured ? publicImage(pictured) : null;
                    return (
                      <li key={s.slug} className="border-b border-kapur/15">
                        <Link href={`/services/${s.slug}`} className={`block py-8 ${img ? "about-capability" : ""}`}>
                          {img ? (
                            <Figure
                              // A stand-in picture inside a link already named by its words: decorative.
                              image={{ ...img, alt: "" }}
                              aspect="3/2"
                              sizes="(min-width: 1024px) 22vw, (min-width: 768px) 30vw, (min-width: 640px) 38vw, 92vw"
                              tone="dark"
                              className="about-capability-figure"
                              imgClassName="about-capability-img"
                            />
                          ) : null}
                          <div>
                            <span className="t-label tabular-nums text-mouse">{String(i + 1).padStart(2, "0")}</span>
                            <h3 className="link-name t-title mt-4">{s.title}</h3>
                            <p className="t-meta mt-3 text-kapur/75">{s.summary}</p>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* Process, set as the home page sets it (home/Process.tsx): the label, the title pair and the summary
          on the centre line, and the steps centred under them, each one's text on the same short measure. */}
      {processSteps.length ? (
        <section data-tone="light" className="bg-kapur text-ink" aria-labelledby="process-title">
          <div className="page-x section-y">
            <div className="flex flex-col items-center text-center">
              <Label pill index="04" className="text-ink-muted">
                Process
              </Label>
              <TitlePair
                id="process-title"
                lead="How a project runs"
                follow="from the first discussion to handover"
                className="mt-6"
              />
              <p className="mt-8 max-w-[38rem] text-balance text-ink-soft">{processSummary}</p>
            </div>
            <ProcessSteps centred />
          </div>
        </section>
      ) : null}

      {/* Who we are: the founders, condensed from the profile (pp.6–7). */}
      <section data-tone="light" className="bg-kapur-deep text-ink" aria-labelledby="founders-title">
        <div className="page-x section-y">
          <div className="page-grid gap-y-10">
            <Label pill index="05" className="col-span-12 text-ink-muted lg:col-span-3">
              Who we are
            </Label>
            <div className="col-span-12 lg:col-span-9">
              <h2 id="founders-title" className="t-headline">
                The founders
              </h2>
              <div className="mt-14 grid gap-x-[var(--grid-gap)] gap-y-16 lg:grid-cols-2">
                {founders.map((f) => (
                  <article key={f.name} className="border-t border-ink/15 pt-6">
                    <h3 className="t-title">{f.name}</h3>
                    <p className="mt-2">{f.role}</p>
                    <p className="t-caption mt-2 text-ink-muted">{f.credentials}</p>
                    <div className="mt-6 space-y-4 text-ink-soft">
                      {f.bio.map((para) => (
                        <p key={para}>{para}</p>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The team (p.8): names and roles only, as no portraits have been supplied. */}
      <section data-tone="light" className="bg-kapur text-ink" aria-labelledby="team-title">
        <div className="page-x section-y">
          <div className="page-grid gap-y-10">
            <Label pill index="06" className="col-span-12 text-ink-muted lg:col-span-3">
              Team
            </Label>
            <div className="col-span-12 lg:col-span-9">
              <h2 id="team-title" className="t-headline">
                Our team
              </h2>
              <ul className="mt-14 grid gap-x-[var(--grid-gap)] border-t border-ink/15 sm:grid-cols-2 lg:grid-cols-3">
                {team.map((m) => (
                  <li key={m.name} className="border-b border-ink/15 py-6">
                    <p className="t-title">{m.name}</p>
                    <p className="t-meta mt-1 text-ink-soft">{m.role}</p>
                  </li>
                ))}
              </ul>
              <div className="mt-10">
                <Pending title="Portraits and founding year">
                  The team is listed as text because no portraits have been supplied. Portraits shot in the same light as
                  the project photography could be added with each person&rsquo;s consent.
                  {studio.foundingYear ? "" : " The year ROUANG was founded is also still needed."}
                </Pending>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The name, as the brand book tells it. */}
      <section data-tone="dark" aria-labelledby="name-title" className="relative overflow-hidden">
        <div className="grid lg:grid-cols-2">
          <div className="page-x section-y order-2 lg:order-1">
            <Label pill index="07" className="text-mouse">
              The name
            </Label>
            <h2 id="name-title" className="t-headline mt-8">
              <span className="block">
                <span lang="ms">Ruang</span> means space.
              </span>
              <span className="t-follow block text-rikyu">We added an O.</span>
            </h2>
            <div className="mt-8 max-w-[34rem] space-y-5 text-kapur/80">
              <p>
                ROUANG comes from the Malay word <em lang="ms">ruang</em>, space. The added O
                brings with it the idea that space has no fixed limit.
              </p>
              <p>
                The name carries three ideas that begin with the same letter: openness, originality and opportunity. They
                are what ROUANG offers long before any wall goes up.
              </p>
            </div>
          </div>
          {/* Phones and tablets: a band of a set shape above the words (4:3, then 3:2), never most of the
              screen. Side by side: exactly as tall as the words beside it. */}
          <div className="relative order-1 aspect-[4/3] sm:aspect-[3/2] lg:order-2 lg:aspect-auto lg:min-h-full">
            {horizon ? <Figure image={horizon} sizes="(min-width: 1024px) 50vw, 100vw" aspect="auto" className="absolute inset-0 h-full" tone="dark" /> : null}
            <div className="absolute inset-0 flex items-center justify-center p-10">
              <Wordmark className="h-auto w-[min(80%,26rem)] text-kapur" title="ROUANG" />
            </div>
          </div>
        </div>
      </section>

      {/* The mark. Its dashed guides run past the circle, so the section clips them at the screen's edge. */}
      <section data-tone="light" className="overflow-x-clip bg-kapur text-ink" aria-labelledby="mark-title">
        <div className="page-x section-y">
          {/* The mark is sized to the words beside it (about-mark), so it is never the larger of the two.
              From tablets the two stand side by side. */}
          <div className="page-grid items-center gap-y-12">
            <div className="col-span-12 flex justify-center md:col-span-5">
              <div className="about-mark relative aspect-square">
                <span className="absolute -inset-[9%] rounded-full border border-dashed border-ink/25" aria-hidden="true" />
                <span className="absolute inset-x-[-30%] top-0 h-px bg-[repeating-linear-gradient(90deg,currentColor_0_6px,transparent_6px_12px)] opacity-25" aria-hidden="true" />
                <span className="absolute inset-x-[-30%] bottom-0 h-px bg-[repeating-linear-gradient(90deg,currentColor_0_6px,transparent_6px_12px)] opacity-25" aria-hidden="true" />
                <Mark className="h-full w-full" title="The ROUANG mark" />
              </div>
            </div>
            <div className="col-span-12 md:col-span-7 lg:col-span-6 lg:col-start-7">
              <Label pill index="08" className="text-ink-muted">
                The mark
              </Label>
              <h2 id="mark-title" className="t-headline mt-8">
                <span className="block">The letters say build.</span>
                <span className="t-follow block text-rikyu">The circle says space.</span>
              </h2>
              <p className="mt-8 max-w-[34rem] text-ink-soft">
                Inside the circle is a curve that enters high on the left and settles to the right. Read it as a horizon,
                as ground meeting light, as water finding its level: the moment an empty space becomes one that is lived
                in. It is the moment every project works towards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {projects.length ? (
        <section data-tone="light" className="bg-kapur-deep text-ink" aria-labelledby="work-title">
          <div className="page-x section-y">
            <Label pill index="09" className="mb-4 text-ink-muted">
              Work
            </Label>
            <h2 id="work-title" className="t-headline mb-10">Projects</h2>
            <ProjectIndex projects={projects} />
          </div>
        </section>
      ) : null}

      <section data-tone="dark">
        <div className="page-x section-y flex flex-col items-start gap-10">
          <TitlePair lead="Have a space in mind?" follow="Tell us how you want to use it." />
          <ButtonLink href="/contact" variant="light">
            Discuss your project
          </ButtonLink>
        </div>
      </section>
    </>
  );
}

import type { Metadata } from "next";
import { Icon, Mark, Wordmark } from "@/components/brand/Brand";
import { ProjectIndex } from "@/components/projects/ProjectIndex";
import { ButtonLink } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Figure } from "@/components/ui/Figure";
import { Pending } from "@/components/ui/Section";
import { Label, TitlePair } from "@/components/ui/Typography";
import { brandImagery } from "@/config/media";
import { processSteps } from "@/config/process";
import { studio } from "@/config/studio";
import { getProjects, publicImage } from "@/lib/content";
import { SHOW_DRAFTS } from "@/lib/env";
import { pageMetadata } from "@/lib/seo";

export const ensureStatic = "navigation";

export const metadata: Metadata = pageMetadata({
  title: "About the studio",
  description:
    "ROUANG is a design-led interior studio for homes and businesses. The name comes from the Malay word ruang, space, with an added O for openness, originality and opportunity.",
  path: "/about",
});

const principles = [
  {
    title: "Start from use",
    body: "Before anything is drawn we want to know who uses the space, at what time of day, and what gets in their way. A good-looking room that does not work is not finished.",
  },
  {
    title: "Design to the real constraints",
    body: "Budget, site, structure, timeline. We would rather know them on day one and design something that can be built than draw something that has to be cut back later.",
  },
  {
    title: "Detail what you touch",
    body: "Handles, edges, switches, the joint between timber and stone. The parts of a space you use every day are where quality is felt, so that is where we spend the time.",
  },
];

export default async function AboutPage() {
  const projects = await getProjects();
  const horizon = publicImage(brandImagery.horizonWall);

  return (
    <>
      <section data-tone="light" className="bg-kapur text-ink">
        <div className="page-x pb-20 pt-[calc(var(--header-h)+3rem)] sm:pb-28">
          <Breadcrumbs items={[{ name: "Studio", href: "/about" }]} />
          <div className="page-grid mt-16 gap-y-10 sm:mt-24">
            <Label className="col-span-12 text-ink-muted lg:col-span-3">Studio</Label>
            <div className="col-span-12 lg:col-span-9">
              <TitlePair as="h1" size="hero" lead="Considered design." italic="Spaces that feel distinctly yours." />
              <p className="t-sub mt-10 max-w-[44rem] text-ink-soft">
                ROUANG is a design-led interior studio for homes and businesses. We balance how a space looks with how it
                works, and with the realities of each project: the budget, the site and the time there is.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The name, as the brand book tells it. */}
      <section data-tone="dark" aria-labelledby="name-title" className="relative overflow-hidden">
        <div className="grid lg:grid-cols-2">
          <div className="page-x section-y order-2 lg:order-1">
            <Label index="01" className="text-mouse">
              The name
            </Label>
            <h2 id="name-title" className="t-headline mt-8">
              <span className="block">Ruang means space.</span>
              <span className="t-italic-display block text-[1.08em] text-rikyu">We added an O.</span>
            </h2>
            <div className="mt-8 max-w-[34rem] space-y-5 text-kapur/80">
              <p>
                ROUANG comes from the Malay word <em lang="ms" className="font-serif">ruang</em>, space. The added O
                brings with it the idea that space has no fixed limit.
              </p>
              <p>
                The name carries three ideas that begin with the same letter: openness, originality and opportunity. They
                are what the studio offers long before any wall goes up.
              </p>
            </div>
          </div>
          <div className="relative order-1 min-h-[60svh] lg:order-2 lg:min-h-full">
            {horizon ? <Figure image={horizon} sizes="(min-width: 1024px) 50vw, 100vw" aspect="auto" className="absolute inset-0 h-full" tone="dark" /> : null}
            <div className="absolute inset-0 flex items-center justify-center p-10">
              <Wordmark className="h-auto w-[min(80%,26rem)] text-kapur" title="ROUANG" />
            </div>
          </div>
        </div>
      </section>

      {/* The mark */}
      <section data-tone="light" className="bg-kapur text-ink" aria-labelledby="mark-title">
        <div className="page-x section-y">
          <div className="page-grid items-center gap-y-14">
            <div className="col-span-12 flex justify-center lg:col-span-5">
              <div className="relative aspect-square w-[min(70vw,24rem)]">
                <span className="absolute -inset-8 rounded-full border border-dashed border-ink/25" aria-hidden="true" />
                <span className="absolute inset-x-[-30%] top-0 h-px bg-[repeating-linear-gradient(90deg,currentColor_0_6px,transparent_6px_12px)] opacity-25" aria-hidden="true" />
                <span className="absolute inset-x-[-30%] bottom-0 h-px bg-[repeating-linear-gradient(90deg,currentColor_0_6px,transparent_6px_12px)] opacity-25" aria-hidden="true" />
                <Mark className="h-full w-full" title="The ROUANG mark" />
              </div>
            </div>
            <div className="col-span-12 lg:col-span-6 lg:col-start-7">
              <Label index="02" className="text-ink-muted">
                The mark
              </Label>
              <h2 id="mark-title" className="t-headline mt-8">
                <span className="block">The letters say build.</span>
                <span className="t-italic-display block text-[1.08em] text-rikyu">The circle says space.</span>
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

      {/* How we work */}
      <section data-tone="light" className="bg-kapur-deep text-ink" aria-labelledby="principles-title">
        <div className="page-x section-y">
          <div className="page-grid gap-y-10">
            <Label index="03" className="col-span-12 text-ink-muted lg:col-span-3">
              How we think
            </Label>
            <div className="col-span-12 lg:col-span-9">
              <TitlePair id="principles-title" lead="Three things we hold to" italic="on every project, at every budget" />
              <ol className="mt-14 border-t border-ink/15">
                {principles.map((p, i) => (
                  <li key={p.title} className="grid gap-3 border-b border-ink/15 py-8 sm:grid-cols-[3rem_minmax(0,16rem)_1fr] sm:gap-8">
                    <span className="t-label tabular-nums text-ink-muted">{String(i + 1).padStart(2, "0")}</span>
                    <h3 className="t-sub">{p.title}</h3>
                    <p className="text-ink-soft">{p.body}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Process */}
      <section data-tone="light" className="bg-kapur text-ink" aria-labelledby="process-title">
        <div className="page-x section-y">
          <div className="page-grid gap-y-10">
            <Label index="04" className="col-span-12 text-ink-muted lg:col-span-3">
              Process
            </Label>
            <div className="col-span-12 lg:col-span-9">
              <TitlePair id="process-title" lead="How a project runs" italic="understand first, finish last" />
              <ol className="mt-14 grid gap-x-[var(--grid-gap)] gap-y-12 sm:grid-cols-2">
                {processSteps.map((s, i) => (
                  <li key={s.title} className="border-t border-ink/15 pt-6">
                    <div className="flex items-center justify-between">
                      <Icon name={s.icon} className="-ml-2 h-14 w-14" />
                      <span className="t-label tabular-nums text-ink-muted">{String(i + 1).padStart(2, "0")}</span>
                    </div>
                    <h3 className="t-sub mt-5">{s.title}</h3>
                    <p className="mt-2 text-ink-soft">{s.body}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {SHOW_DRAFTS ? (
        <section data-tone="light" className="bg-kapur text-ink">
          <div className="page-x pb-[var(--section-space)]">
            <div className="page-grid">
              <div className="col-span-12 lg:col-span-9 lg:col-start-4">
                <Pending title="The people">
                  Names, roles and a line about each person in the studio, with portraits shot in the same light as the
                  project photography. The studio&rsquo;s founding year{studio.foundingYear ? "" : " is also still needed"}.
                </Pending>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {projects.length ? (
        <section data-tone="light" className="bg-kapur text-ink" aria-labelledby="work-title">
          <div className="page-x pb-[var(--section-space)]">
            <Label index="05" className="mb-4 text-ink-muted">
              Work
            </Label>
            <h2 id="work-title" className="t-sub mb-10">Projects</h2>
            <ProjectIndex projects={projects} />
          </div>
        </section>
      ) : null}

      <section data-tone="dark">
        <div className="page-x section-y flex flex-col items-start gap-10">
          <TitlePair lead="Have a space in mind?" italic="Tell us how you want to use it." />
          <ButtonLink href="/contact" variant="light">
            Discuss your project
          </ButtonLink>
        </div>
      </section>
    </>
  );
}

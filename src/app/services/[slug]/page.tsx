import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Icon, Mark } from "@/components/brand/Brand";
import { ProjectIndex } from "@/components/projects/ProjectIndex";
import { ButtonLink } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Figure } from "@/components/ui/Figure";
import { JsonLd } from "@/components/ui/JsonLd";
import { Pending } from "@/components/ui/Section";
import { Label, TitlePair } from "@/components/ui/Typography";
import { processSteps } from "@/config/process";
import { getProject, getProjects, getService, getServices, projectImage, staticSlugs } from "@/lib/content";
import { SHOW_DRAFTS } from "@/lib/env";
import { serviceSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo";

export const ensureStatic = "navigation";
// Every slug is prerendered and quick to fetch, so a navigation that waits for the static
// payload is acceptable. Content stays in the HTML instead of a hidden Suspense segment.
export const instant = false;

export async function generateStaticParams() {
  return staticSlugs(await getServices());
}

export async function generateMetadata({ params }: PageProps<"/services/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const s = await getService(slug);
  if (!s) return {};
  return pageMetadata({ title: s.seo.title ?? s.title, description: s.seo.description ?? s.summary, path: `/services/${s.slug}` });
}

export default async function ServicePage({ params }: PageProps<"/services/[slug]">) {
  const { slug } = await params;
  const service = await getService(slug);
  if (!service) notFound();
  const projects = (await getProjects()).filter((p) => service.relatedProjects.includes(p.slug));
  // In production only what the company has confirmed is shown as an offer, an answer or a step.
  const offers = service.offers.filter((o) => o.confirmed || SHOW_DRAFTS);
  const faqs = service.faqs.filter((f) => f.confirmed || SHOW_DRAFTS);
  const featureProject = service.feature ? await getProject(service.feature.project) : null;
  const feature = service.feature ? projectImage(featureProject, service.feature.image) : null;
  // A service for one kind of client preselects it on the enquiry form.
  const enquiryHref = service.sectors.length === 1 ? `/contact?project=${service.sectors[0]}` : "/contact";
  // Sections are numbered in the order they appear, since Work and Questions are not on every page.
  const shown = [
    "who",
    offers.length || service.projectTypes.length ? "what" : null,
    projects.length ? "work" : null,
    processSteps.length ? "process" : null,
    faqs.length || SHOW_DRAFTS ? "questions" : null,
  ].filter(Boolean);
  const index = (key: string) => String(shown.indexOf(key) + 1).padStart(2, "0");

  return (
    <>
      <JsonLd data={serviceSchema(service)} />

      <section data-tone="light" className="bg-kapur text-ink">
        <div className="page-x pb-20 pt-[calc(var(--header-h)+3rem)] sm:pb-28">
          <Breadcrumbs items={[{ name: "Services", href: "/services" }, { name: service.navLabel, href: `/services/${service.slug}` }]} />
          <div className="page-grid mt-16 gap-y-10 sm:mt-24">
            <Label className="col-span-12 text-ink-muted lg:col-span-3">{service.kicker}</Label>
            <div className="col-span-12 lg:col-span-9">
              <TitlePair as="h1" size="hero" lead={service.headline} follow={service.headlineFollow} />
              <p className="t-sub mt-8 max-w-[38rem] text-ink-soft">{service.summary}</p>
              <div className="mt-10 flex flex-wrap gap-3">
                <ButtonLink href={enquiryHref} variant="dark">
                  Discuss your project
                </ButtonLink>
                {projects.length ? (
                  <ButtonLink href="#work" variant="outline">
                    See the work
                  </ButtonLink>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      {feature && featureProject ? (
        <section data-tone="light" className="bg-kapur text-ink" aria-label={`Photograph: ${featureProject.title}`}>
          <div className="page-x pb-[var(--section-space)]">
            <Figure image={feature} aspect="21/9" sizes="100vw" />
            <p className="t-caption mt-4 text-ink-muted">
              <span className="font-medium text-ink">{featureProject.title}</span>
              {/* The place, unless the project is named after it (Ampang). */}
              {featureProject.location && !featureProject.title.includes(featureProject.location) ? ` · ${featureProject.location}` : ""} ·{" "}
              {featureProject.visualisation ? "Design proposal by ROUANG" : `${featureProject.scope.join(", ")} by ROUANG`}
            </p>
          </div>
        </section>
      ) : null}

      {/* Who it is for */}
      <section data-tone="light" className="bg-kapur-deep text-ink">
        <div className="page-x section-y">
          <div className="page-grid gap-y-10">
            <Label as="h2" pill index={index("who")} className="col-span-12 text-ink-muted lg:col-span-3">
              Who it is for
            </Label>
            <ul className="col-span-12 grid gap-x-[var(--grid-gap)] border-t border-ink/15 sm:grid-cols-2 lg:col-span-8 lg:col-start-5">
              {service.audience.map((a) => (
                <li key={a} className="flex gap-4 border-b border-ink/15 py-5">
                  <Mark className="mt-1.5 h-4 w-4 shrink-0" />
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* What we do */}
      {offers.length || service.projectTypes.length ? (
      <section data-tone="light" className="bg-kapur text-ink">
        <div className="page-x section-y">
          <div className="page-grid gap-y-10">
            <Label as="h2" pill index={index("what")} className="col-span-12 text-ink-muted lg:col-span-3">
              What we do
            </Label>
            <div className="col-span-12 lg:col-span-8 lg:col-start-5">
              {offers.length ? (
              <ol className="border-t border-ink/15">
                {offers.map((o, i) => (
                  <li key={o.title} className="grid gap-3 border-b border-ink/15 py-7 sm:grid-cols-[3rem_minmax(0,14rem)_1fr] sm:gap-8">
                    <span className="t-label tabular-nums text-ink-muted">{String(i + 1).padStart(2, "0")}</span>
                    <h3 className="t-title">{o.title}</h3>
                    <p className="text-ink-soft">{o.body}</p>
                  </li>
                ))}
              </ol>
              ) : null}
              {service.projectTypes.length ? (
                <div className={offers.length ? "mt-12" : ""}>
                  <p className="t-label text-ink-muted">Projects we take on</p>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {service.projectTypes.map((t) => (
                      <li key={t} className="t-meta rounded-full border border-ink/20 px-4 py-2">
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
      ) : null}

      {/* The service's own text runs on from What we do, on the same ground and in the same column, so
          its headings sit one level under that section's: h3 and down, never h2s of their own. */}
      {service.html ? (
        <section data-tone="light" className="bg-kapur text-ink">
          <div className="page-x pb-[var(--section-space)]">
            <div className="page-grid">
              <div
                className="prose-rouang col-span-12 lg:col-span-7 lg:col-start-5"
                dangerouslySetInnerHTML={{ __html: underSection(service.html) }}
              />
            </div>
          </div>
        </section>
      ) : null}

      {/* Work */}
      {projects.length ? (
        <section id="work" data-tone="light" className="bg-kapur text-ink">
          <div className="page-x pb-[var(--section-space)]">
            <Label as="h2" pill index={index("work")} className="text-ink-muted">
              Work
            </Label>
            <p className="t-caption mb-10 mt-3 text-ink-muted">Each case study sets out ROUANG&rsquo;s role on that project.</p>
            {/* Each row says what ROUANG did there: this page also describes work, such as construction, that was not part of every project. */}
            <ProjectIndex projects={projects} showRole />
          </div>
        </section>
      ) : null}

      {/* Process, briefly */}
      {processSteps.length ? (
      <section data-tone="dark">
        <div className="page-x section-y">
          <div className="page-grid gap-y-10">
            <Label as="h2" pill index={index("process")} className="col-span-12 text-mouse lg:col-span-3">
              How it runs
            </Label>
            <ol className="col-span-12 grid gap-x-[var(--grid-gap)] gap-y-10 sm:grid-cols-2 lg:col-span-9 lg:grid-cols-3">
              {processSteps.map((s, i) => (
                <li key={s.title}>
                  <Icon name={s.icon} className="-ml-2 h-12 w-12 text-kapur" />
                  <p className="t-label mt-5 text-mouse">{String(i + 1).padStart(2, "0")}</p>
                  <h3 className="t-title mt-2">{s.title}</h3>
                  <p className="t-meta mt-2 text-kapur/75">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
      ) : null}

      {/* Questions */}
      {faqs.length || SHOW_DRAFTS ? (
        <section data-tone="light" className="bg-kapur text-ink">
          <div className="page-x section-y">
            <div className="page-grid gap-y-10">
              <Label as="h2" pill index={index("questions")} className="col-span-12 text-ink-muted lg:col-span-3">
                Questions
              </Label>
              <div className="col-span-12 lg:col-span-8 lg:col-start-5">
                {faqs.length ? (
                  <div className="border-t border-ink/15">
                    {faqs.map((f) => (
                      <details key={f.q} className="group border-b border-ink/15">
                        <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-6 py-5 [&::-webkit-details-marker]:hidden">
                          <span className="t-title">{f.q}</span>
                          <span className="relative block h-3.5 w-3.5 shrink-0" aria-hidden="true">
                            <span className="absolute left-0 top-1/2 h-px w-full bg-current" />
                            <span className="absolute left-1/2 top-0 h-full w-px bg-current transition-transform duration-300 group-open:scale-y-0" />
                          </span>
                        </summary>
                        <div className="pb-7 text-ink-soft">
                          {f.a}
                          {!f.confirmed ? <span className="t-label ml-2 text-ink-muted">(answer awaiting confirmation from ROUANG)</span> : null}
                        </div>
                      </details>
                    ))}
                  </div>
                ) : (
                  <Pending title="Frequently asked questions">
                    Questions clients really ask (fees, timing, what happens on site) with ROUANG&rsquo;s own answers.
                  </Pending>
                )}
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}

/** Moves every heading in rendered Markdown one level down (h2 to h3 and so on, h6 stays h6). */
function underSection(html: string) {
  return html.replace(/<(\/?)h([1-6])(?=[\s>])/g, (_, close: string, level: string) => `<${close}h${Math.min(Number(level) + 1, 6)}`);
}

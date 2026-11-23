import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Mark } from "@/components/brand/Brand";
import { ProcessSteps } from "@/components/home/Process";
import { ProjectIndex } from "@/components/projects/ProjectIndex";
import { ButtonLink } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/ui/JsonLd";
import { Pending } from "@/components/ui/Section";
import { Label, TitlePair } from "@/components/ui/Typography";
import { placeholderImagery } from "@/config/media";
import { processSteps, processSummary } from "@/config/process";
import { getProject, getProjects, getService, getServices, projectImage, publicImage, staticSlugs } from "@/lib/content";
import type { Image as ImageData } from "@/lib/content/schema";
import { SHOW_DRAFTS, SHOW_NOTES } from "@/lib/env";
import { serviceSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo";

export const ensureStatic = "navigation";
// Every slug is prerendered and quick to fetch, so a navigation that waits for the static
// payload is acceptable. Content stays in the HTML instead of a hidden Suspense segment.
export const instant = false;

/*
 * One temporary photograph per service (src/config/media.ts), set beside the page's own text, the
 * longest run of words on it. publicImage() drops it from production, where the text simply keeps
 * its column. None shows a ROUANG project, so none is captioned. A page that shows one of the
 * studio's own photographs (its feature, under the opening words) keeps that one as well.
 */
const servicePhotos: Record<string, ImageData | null> = {
  "design-and-build": publicImage(placeholderImagery.serviceDesignBuild),
  "renovation-and-interior": publicImage(placeholderImagery.serviceRenovation),
  "new-build-and-construction": publicImage(placeholderImagery.serviceNewBuild),
};

/*
 * Until a service has a project photograph of its own (its feature), a temporary one stands in the
 * same band under the opening words, so all three pages open the same way. Uncaptioned for the same
 * reason; in production publicImage() drops it and the page opens straight into its sections.
 */
const serviceBands: Record<string, { image: ImageData | null; focus?: string }> = {
  "design-and-build": { image: publicImage(placeholderImagery.diningByWindow), focus: "50% 62%" },
  // An upright photograph in a wide band: keep the run of trusses against the sky.
  "new-build-and-construction": { image: publicImage(placeholderImagery.roofTrusses), focus: "50% 42%" },
};

/** `sizes` for the photograph beside the text, widened where it has to cover its frame (services.css, svc-*). */
function asideSizes(image: ImageData) {
  const ratio = image.width / image.height;
  const at = (frame: number, w: string) => {
    const cover = Math.max(1, ratio / frame);
    return cover === 1 ? w : `calc(${w} * ${cover.toFixed(2)})`;
  };
  // Three of the twelve columns on wide screens; under that, the text's width (at most 40rem).
  return [`(min-width: 64rem) ${at(4 / 5, "22vw")}`, `(min-width: 40rem) ${at(16 / 9, "min(92vw, 40rem)")}`, at(3 / 2, "92vw")].join(", ");
}

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
  const shownFeature = feature && featureProject ? { image: feature, project: featureProject } : null;
  // The band under the opening words: the service's own project photograph (captioned), or else its temporary one.
  const band = shownFeature ? null : (serviceBands[service.slug] ?? null);
  const opening = shownFeature
    ? { image: shownFeature.image, focus: shownFeature.image.focus }
    : band?.image
      ? { image: band.image, focus: band.focus ?? band.image.focus }
      : null;
  const photo = servicePhotos[service.slug] ?? null;
  // A service for one kind of client preselects it on the enquiry form.
  const enquiryHref = service.sectors.length === 1 ? `/contact?project=${service.sectors[0]}` : "/contact";
  // Sections are numbered in the order they appear, since Work and Questions are not on every page.
  const shown = [
    "who",
    offers.length || service.projectTypes.length ? "what" : null,
    projects.length ? "work" : null,
    processSteps.length ? "process" : null,
    faqs.length || SHOW_NOTES ? "questions" : null,
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

      {opening ? (
        <section
          data-tone="light"
          className="bg-kapur text-ink"
          aria-label={shownFeature ? `Photograph: ${shownFeature.project.title}` : undefined}
        >
          <div className="page-x pb-[var(--section-space)]">
            {/* A band at 21:9 on wide screens; 16:9 on tablets and 3:2 on phones, so it never thins to a strip (services.css).
                It starts on or just under the first screen, so it loads at once and without the scroll settle, as
                Figure does for a photograph near the top of a page. */}
            <div className="svc-feature">
              <Image
                src={opening.image.src}
                alt={opening.image.alt}
                fill
                // The page's width inside its margins: a photograph narrower than the band covers it by its width.
                sizes="92vw"
                quality={78}
                loading="eager"
                fetchPriority="high"
                className="object-cover"
                style={opening.focus ? { objectPosition: opening.focus } : undefined}
              />
            </div>
            {shownFeature ? (
              <p className="t-caption mt-4 text-ink-muted">
                <span className="font-medium text-ink">{shownFeature.project.title}</span>
                {/* The place, unless the project is named after it (Ampang). */}
                {shownFeature.project.location && !shownFeature.project.title.includes(shownFeature.project.location)
                  ? ` · ${shownFeature.project.location}`
                  : ""}{" "}
                ·{" "}
                {shownFeature.project.visualisation ? "Design proposal by ROUANG" : `${shownFeature.project.scope.join(", ")} by ROUANG`}
              </p>
            ) : null}
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
            {/* The text's first heading keeps its own space above it (prose-rouang), so the photograph needs little more. */}
            <div className="page-grid gap-y-2">
              {/* Beside the text, in the margin column the section labels use; above it on smaller screens. */}
              {photo ? (
                <div className="svc-aside col-span-12 lg:col-span-3 lg:row-start-1">
                  <div className="svc-photo" data-reveal="image">
                    <Image
                      src={photo.src}
                      alt={photo.alt}
                      fill
                      sizes={asideSizes(photo)}
                      quality={78}
                      className="object-cover"
                      style={photo.focus ? { objectPosition: photo.focus } : undefined}
                    />
                  </div>
                </div>
              ) : null}
              <div
                className="prose-rouang col-span-12 lg:col-span-7 lg:col-start-5 lg:row-start-1"
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

      {/* Process, drawn as the home page and About draw it (home/Process.tsx): the label and the title pair on the
          centre line, the steps on their line under them. On Milky White, the ground the rings are painted on. */}
      {processSteps.length ? (
        <section data-tone="light" className="bg-kapur text-ink" aria-labelledby="process-title">
          <div className="page-x section-y">
            <div className="flex flex-col items-center text-center">
              <Label pill index={index("process")} className="text-ink-muted">
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

      {/* Questions */}
      {faqs.length || SHOW_NOTES ? (
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
                          {!f.confirmed && SHOW_NOTES ? <span className="t-label ml-2 text-ink-muted">(answer awaiting confirmation from ROUANG)</span> : null}
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

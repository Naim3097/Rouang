import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Icon, Mark } from "@/components/brand/Brand";
import { ProjectIndex } from "@/components/projects/ProjectIndex";
import { ButtonLink } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/ui/JsonLd";
import { Pending } from "@/components/ui/Section";
import { Label, TitlePair } from "@/components/ui/Typography";
import { processSteps } from "@/config/process";
import { getProjects, getService, getServices } from "@/lib/content";
import { SHOW_DRAFTS } from "@/lib/env";
import { serviceSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo";

export const ensureStatic = "navigation";

export async function generateStaticParams() {
  return (await getServices()).map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/services/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const s = await getService(slug);
  if (!s) return {};
  return pageMetadata({ title: s.seo.title ?? s.title, description: s.seo.description ?? s.summary, path: `/services/${s.slug}` });
}

/*
 * The params-dependent content sits inside Suspense so a default <Link> can show the page frame
 * instantly. Every slug is prerendered, so in practice the fallback is never seen.
 */
export default function ServicePage({ params }: PageProps<"/services/[slug]">) {
  return (
    <Suspense fallback={<div data-tone="light" className="min-h-[100svh] bg-kapur" aria-busy="true" />}>
      <ServicePageContent params={params} />
    </Suspense>
  );
}

async function ServicePageContent({ params }: { params: PageProps<"/services/[slug]">["params"] }) {
  const { slug } = await params;
  const service = await getService(slug);
  if (!service) notFound();
  const projects = (await getProjects()).filter((p) => service.relatedProjects.includes(p.slug));
  const faqs = service.faqs.filter((f) => f.confirmed || SHOW_DRAFTS);

  return (
    <>
      <JsonLd data={serviceSchema(service)} />

      <section data-tone="light" className="bg-kapur text-ink">
        <div className="page-x pb-20 pt-[calc(var(--header-h)+3rem)] sm:pb-28">
          <Breadcrumbs items={[{ name: "Services", href: "/services" }, { name: service.navLabel, href: `/services/${service.slug}` }]} />
          <div className="page-grid mt-16 gap-y-10 sm:mt-24">
            <Label className="col-span-12 text-ink-muted lg:col-span-3">{service.kicker}</Label>
            <div className="col-span-12 lg:col-span-9">
              <TitlePair as="h1" size="hero" lead={service.headline} italic={service.headlineItalic} />
              <p className="t-sub mt-10 max-w-[44rem] text-ink-soft">{service.summary}</p>
              <div className="mt-10 flex flex-wrap gap-3">
                <ButtonLink href={`/contact?project=${service.sector}`} variant="dark">
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

      {/* Who it is for */}
      <section data-tone="light" className="bg-kapur-deep text-ink">
        <div className="page-x section-y">
          <div className="page-grid gap-y-10">
            <Label index="01" className="col-span-12 text-ink-muted lg:col-span-3">
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
      <section data-tone="light" className="bg-kapur text-ink">
        <div className="page-x section-y">
          <div className="page-grid gap-y-10">
            <Label index="02" className="col-span-12 text-ink-muted lg:col-span-3">
              What we do
            </Label>
            <div className="col-span-12 lg:col-span-8 lg:col-start-5">
              <ol className="border-t border-ink/15">
                {service.offers.map((o, i) => (
                  <li key={o.title} className="grid gap-3 border-b border-ink/15 py-7 sm:grid-cols-[3rem_minmax(0,14rem)_1fr] sm:gap-8">
                    <span className="t-label tabular-nums text-ink-muted">{String(i + 1).padStart(2, "0")}</span>
                    <h2 className="t-sub">{o.title}</h2>
                    <p className="text-ink-soft">{o.body}</p>
                  </li>
                ))}
              </ol>
              {service.projectTypes.length ? (
                <div className="mt-12">
                  <p className="t-label text-ink-muted">Typical projects</p>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {service.projectTypes.map((t) => (
                      <li key={t} className="rounded-full border border-ink/20 px-4 py-2 text-[0.9375rem]">
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

      {service.html ? (
        <section data-tone="light" className="bg-kapur text-ink">
          <div className="page-x pb-[var(--section-space)]">
            <div className="page-grid">
              <div className="prose-rouang col-span-12 lg:col-span-7 lg:col-start-5" dangerouslySetInnerHTML={{ __html: service.html }} />
            </div>
          </div>
        </section>
      ) : null}

      {/* Work */}
      {projects.length ? (
        <section id="work" data-tone="light" className="bg-kapur text-ink">
          <div className="page-x pb-[var(--section-space)]">
            <Label index="03" className="mb-10 text-ink-muted">
              Work
            </Label>
            <ProjectIndex projects={projects} />
          </div>
        </section>
      ) : null}

      {/* Process, briefly */}
      <section data-tone="dark">
        <div className="page-x section-y">
          <div className="page-grid gap-y-10">
            <Label index="04" className="col-span-12 text-mouse lg:col-span-3">
              How it runs
            </Label>
            <ol className="col-span-12 grid gap-x-[var(--grid-gap)] gap-y-10 sm:grid-cols-2 lg:col-span-9 lg:grid-cols-4">
              {processSteps.slice(0, 4).map((s, i) => (
                <li key={s.title}>
                  <Icon name={s.icon} className="-ml-2 h-12 w-12 text-kapur" />
                  <p className="t-label mt-5 text-mouse">{String(i + 1).padStart(2, "0")}</p>
                  <h3 className="t-sub mt-2">{s.title}</h3>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed text-kapur/75">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Questions */}
      {faqs.length || SHOW_DRAFTS ? (
        <section data-tone="light" className="bg-kapur text-ink">
          <div className="page-x section-y">
            <div className="page-grid gap-y-10">
              <Label index="05" className="col-span-12 text-ink-muted lg:col-span-3">
                Questions
              </Label>
              <div className="col-span-12 lg:col-span-8 lg:col-start-5">
                {faqs.length ? (
                  <div className="border-t border-ink/15">
                    {faqs.map((f) => (
                      <details key={f.q} className="group border-b border-ink/15">
                        <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-6 py-5 [&::-webkit-details-marker]:hidden">
                          <span className="t-sub">{f.q}</span>
                          <span className="relative block h-3.5 w-3.5 shrink-0" aria-hidden="true">
                            <span className="absolute left-0 top-1/2 h-px w-full bg-current" />
                            <span className="absolute left-1/2 top-0 h-full w-px bg-current transition-transform duration-300 group-open:scale-y-0" />
                          </span>
                        </summary>
                        <div className="pb-7 text-ink-soft">
                          {f.a}
                          {!f.confirmed ? <span className="t-label ml-2 text-ink-muted">(answer awaiting studio confirmation)</span> : null}
                        </div>
                      </details>
                    ))}
                  </div>
                ) : (
                  <Pending title="Frequently asked questions">
                    Questions clients really ask (fees, timing, what happens on site) with the studio&rsquo;s own answers.
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

import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Label, TitlePair } from "@/components/ui/Typography";
import { areaLabel } from "@/config/studio";
import { getServices } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const ensureStatic = "navigation";

export const metadata: Metadata = pageMetadata({
  title: "Design, renovation and construction services",
  description:
    "Design & Build, Renovation & Interior, and New Build & Construction by ROUANG, for homes and businesses in Kuala Lumpur and Selangor.",
  path: "/services",
});

/** Who the capabilities serve, in the profile's own terms: existing and new, residential and commercial. */
const sectors = [
  {
    key: "residential",
    label: "For homes",
    body: "Existing homes that no longer fit the way a household lives, and new homes built from the ground up.",
  },
  {
    key: "commercial",
    label: "For businesses",
    body: "Restaurants and other commercial spaces, transformed through renovation and interior work, and selected new commercial projects.",
  },
] as const;

export default async function ServicesPage() {
  const services = await getServices();

  return (
    <>
      <section data-tone="light" className="bg-kapur text-ink">
        <div className="page-x pb-20 pt-[calc(var(--header-h)+3rem)]">
          <Breadcrumbs items={[{ name: "Services", href: "/services" }]} />
          <div className="page-grid mt-16 gap-y-10 sm:mt-24">
            <Label className="col-span-12 text-ink-muted lg:col-span-3">Services</Label>
            <div className="col-span-12 lg:col-span-9">
              <TitlePair
                as="h1"
                size="hero"
                eyebrow={`Design and construction services in ${areaLabel()}`}
                lead="Design, planning and construction."
                follow="Brought together as one coordinated process."
              />
              <p className="t-sub mt-8 max-w-[38rem] text-ink-soft">
                From renovation and interior enhancement to new-build projects, we approach each project as a
                coordinated process, translating ideas into well-considered spaces that are distinctive, functional and
                built to last.
              </p>
            </div>
          </div>
        </div>
      </section>

      {services.length ? (
        <section data-tone="light" className="bg-kapur-deep text-ink" aria-labelledby="capabilities-title">
          <div className="page-x section-y">
            <div className="page-grid gap-y-10">
              <div className="col-span-12 lg:col-span-4">
                <Label pill index="01" className="text-ink-muted">
                  Capabilities
                </Label>
                <h2 id="capabilities-title" className="t-sub mt-6 max-w-[24rem] text-ink-soft">
                  Three ways to work with us, for residential and commercial projects.
                </h2>
              </div>
              <ol className="col-span-12 border-t border-ink/15 lg:col-span-7 lg:col-start-6">
                {services.map((s, i) => (
                  <li key={s.slug} className="border-b border-ink/15">
                    <Link href={`/services/${s.slug}`} className="grid gap-3 py-8 sm:grid-cols-[3rem_1fr] sm:gap-8">
                      <span className="t-label pt-1.5 tabular-nums text-ink-muted">{String(i + 1).padStart(2, "0")}</span>
                      <div>
                        <h3 className="link-name t-title">
                          {s.title}
                          {s.isDraft ? <span className="t-label ml-3 align-middle opacity-60">Draft</span> : null}
                        </h3>
                        <p className="mt-3 max-w-[36rem] text-ink-soft">{s.summary}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>
      ) : null}

      <section data-tone="dark" aria-labelledby="sectors-title">
        <div className="page-x section-y">
          <div className="page-grid gap-y-10">
            <div className="col-span-12 lg:col-span-4">
              <Label pill index="02" className="text-mouse">
                Who we work with
              </Label>
              <h2 id="sectors-title" className="t-sub mt-6 max-w-[24rem] text-kapur/85">
                Homes and businesses, existing and new.
              </h2>
            </div>
            <ul className="col-span-12 grid gap-x-[var(--grid-gap)] border-t border-kapur/15 sm:grid-cols-2 lg:col-span-7 lg:col-start-6">
              {sectors.map((s) => (
                <li key={s.key} className="border-b border-kapur/15 py-8">
                  <h3 className="t-title">{s.label}</h3>
                  <p className="mt-3 max-w-[30rem] text-kapur/75">{s.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section data-tone="light" className="bg-kapur text-ink">
        <div className="page-x section-y flex flex-col items-start gap-8">
          <TitlePair lead="Not sure which applies?" follow="Describe the space and we'll tell you." />
          <ButtonLink href="/contact" variant="dark">
            Discuss your project
          </ButtonLink>
        </div>
      </section>
    </>
  );
}

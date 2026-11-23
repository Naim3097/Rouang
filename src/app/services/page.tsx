import type { Metadata } from "next";
import { BeforeAfter } from "@/components/services/BeforeAfter";
import { Capabilities } from "@/components/services/Capabilities";
import { ButtonLink } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Figure } from "@/components/ui/Figure";
import { Label, TitlePair } from "@/components/ui/Typography";
import { placeholderImagery } from "@/config/media";
import { areaLabel } from "@/config/studio";
import { getServices, publicImage } from "@/lib/content";
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
    image: publicImage(placeholderImagery.forHomes),
  },
  {
    key: "commercial",
    label: "For businesses",
    body: "Restaurants and other commercial spaces, transformed through renovation and interior work, and selected new commercial projects.",
    image: publicImage(placeholderImagery.forBusinesses),
  },
] as const;

/*
 * Temporary photographs (src/config/media.ts), dropped from production by publicImage(): the page
 * then keeps its words and its layout without them. None shows a ROUANG project, so none is
 * captioned. The before-and-after pair are two different kitchens, stand-ins until the studio
 * supplies a real pair taken from the same spot; BeforeAfter takes that pair as it is.
 */
const comparison = {
  before: publicImage(placeholderImagery.beforeKitchen),
  after: publicImage(placeholderImagery.afterKitchen),
};
const capabilityImagery = {
  lead: publicImage(placeholderImagery.capabilitiesLead),
  thumbs: {
    "design-and-build": publicImage(placeholderImagery.capabilityDesignBuild),
    "renovation-and-interior": publicImage(placeholderImagery.capabilityRenovation),
    "new-build-and-construction": publicImage(placeholderImagery.capabilityNewBuild),
  },
};

export default async function ServicesPage() {
  const services = await getServices();
  const { before, after } = comparison;

  return (
    <>
      {/* The opening words, centred, and under them the before-and-after comparison, the page's
          picture and its way in to the sections that follow. */}
      <section data-tone="light" className="bg-kapur text-ink">
        <div className="page-x pb-[var(--section-space)] pt-[calc(var(--header-h)+3rem)]">
          <Breadcrumbs items={[{ name: "Services", href: "/services" }]} />
          <div className="mx-auto mt-12 flex max-w-[62rem] flex-col items-center text-center sm:mt-16">
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
          {before && after ? (
            <BeforeAfter
              before={before}
              after={after}
              priority
              // The frame: the page's width inside its margins, at most 68rem and 70% of the screen's height in 16:9.
              sizes="(min-width: 80rem) 68rem, 92vw"
              className="mt-12 sm:mt-16"
            />
          ) : null}
        </div>
      </section>

      {services.length ? (
        <Capabilities index="01" services={services} lead={capabilityImagery.lead} thumbs={capabilityImagery.thumbs} />
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
                  {s.image ? (
                    // Each photograph over its words, the two at one ratio side by side from 40rem.
                    <Figure
                      image={s.image}
                      aspect="4/3"
                      tone="dark"
                      sizes="(min-width: 64rem) 30vw, (min-width: 40rem) 52vw, 100vw"
                      className="mb-6"
                    />
                  ) : null}
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

import type { Metadata } from "next";
import { BeforeAfter } from "@/components/services/BeforeAfter";
import { Capabilities } from "@/components/services/Capabilities";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Figure } from "@/components/ui/Figure";
import { CtaPanel } from "@/components/ui/RikyuField";
import { Label, TitlePair } from "@/components/ui/Typography";
import { placeholderImagery } from "@/config/media";
import { areaLabel } from "@/config/studio";
import { getServices, publicImage } from "@/lib/content";
import type { Image as ImageData } from "@/lib/content/schema";
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

/** The sector pictures are drawn 4:3. */
const SECTOR_FRAME = 4 / 3;

/**
 * `sizes` for a sector picture: half the pair's width (services.css, svc-sectors), at most 33rem
 * from 80rem, about 40% of the screen at 64rem, 45% on tablets and the full width inside the margins
 * on phones; widened when a wider photograph has to cover the 4:3 frame.
 */
function sectorSizes(image: ImageData) {
  const cover = Math.max(1, image.width / image.height / SECTOR_FRAME);
  const at = (w: string) => (cover === 1 ? w : `calc(${w} * ${cover.toFixed(2)})`);
  return [`(min-width: 80rem) ${at("33rem")}`, `(min-width: 64rem) ${at("40vw")}`, `(min-width: 40rem) ${at("45vw")}`, at("92vw")].join(", ");
}

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
          <div className="mx-auto mt-10 flex max-w-[62rem] flex-col items-center text-center sm:mt-12">
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
              // The frame: the page's width inside its margins, at most 68rem, and in 16:9 no taller than
              // 60% of the screen's height, so its handle is on the first screen of a laptop.
              sizes="(min-width: 80rem) 68rem, 92vw"
              className="mt-10 sm:mt-12"
            />
          ) : null}
        </div>
      </section>

      {services.length ? (
        <Capabilities index="01" services={services} lead={capabilityImagery.lead} thumbs={capabilityImagery.thumbs} />
      ) : null}

      {/* 02 Who we work with, set as the site sets a centred section (home Process, About Process): the
          label and the title pair on the centre line, and under them the two kinds of client side by side,
          on the hero comparison's measure (services.css, svc-sectors). */}
      <section data-tone="light" className="bg-kapur text-ink" aria-labelledby="sectors-title">
        <div className="page-x section-y">
          <div className="flex flex-col items-center text-center">
            <Label pill index="02" className="text-ink-muted">
              Who we work with
            </Label>
            <TitlePair id="sectors-title" lead="Homes and businesses," follow="existing and new." className="mt-6" />
          </div>
          <ul className="svc-sectors border-t border-ink/15">
            {sectors.map((s) => (
              <li key={s.key} className="border-b border-ink/15 py-8">
                {s.image ? (
                  // Each photograph over its words, the two at one ratio side by side from 40rem.
                  <Figure image={s.image} aspect="4/3" sizes={sectorSizes(s.image)} className="mb-6" />
                ) : null}
                <h3 className="t-title">{s.label}</h3>
                <p className="mt-3 max-w-[30rem] text-ink-soft">{s.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* The close: the green panel on the same Milky White, after 02's own bottom padding. */}
      <CtaPanel
        id="services-cta-title"
        lead="Not sure which applies?"
        follow="Describe the space and we’ll tell you."
        href="/contact"
        surface="kapur"
      />
    </>
  );
}

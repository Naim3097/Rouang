import type { Metadata } from "next";
import Link from "next/link";
import { Arrow, ButtonLink } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Label, TitlePair } from "@/components/ui/Typography";
import { areaLabel } from "@/config/studio";
import { getServices } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const ensureStatic = "navigation";

export const metadata: Metadata = pageMetadata({
  title: "Interior design services in Kuala Lumpur",
  description:
    "Interior design for homes, restaurants and cafés in Kuala Lumpur and Selangor: space planning, materials, lighting and joinery, scoped to your budget.",
  path: "/services",
});

export default async function ServicesPage() {
  const services = await getServices();
  const groups = [
    { key: "residential", label: "For homes", intro: "Condominiums and landed houses, designed around the way your household lives." },
    { key: "commercial", label: "For businesses", intro: "Restaurants, cafés and food businesses that have to work for guests, staff and the bottom line." },
  ] as const;

  return (
    <>
      <section data-tone="light" className="bg-kapur text-ink">
        <div className="page-x pb-20 pt-[calc(var(--header-h)+3rem)]">
          <Breadcrumbs items={[{ name: "Services", href: "/services" }]} />
          <div className="page-grid mt-16 gap-y-10 sm:mt-24">
            <Label className="col-span-12 text-ink-muted lg:col-span-3">Services</Label>
            <div className="col-span-12 lg:col-span-9">
              <TitlePair as="h1" size="hero" eyebrow={`Interior design services in ${areaLabel()}`} lead="Good design isn't one-size-fits-all." italic="So the scope is yours to shape." />
              <p className="t-sub mt-10 max-w-[44rem] text-ink-soft">
                Some projects start from an empty shell, others from a home or restaurant that has stopped working. The
                scope is agreed at the start, so the design matches what your project needs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {groups.map((g, gi) => {
        const list = services.filter((s) => s.sector === g.key);
        if (!list.length) return null;
        return (
          <section key={g.key} data-tone={gi === 1 ? "dark" : "light"} className={gi === 1 ? "" : "bg-kapur-deep text-ink"}>
            <div className="page-x section-y">
              <div className="page-grid gap-y-10">
                <div className="col-span-12 lg:col-span-4">
                  <Label index={`0${gi + 1}`} className={gi === 1 ? "text-mouse" : "text-ink-muted"}>
                    {g.label}
                  </Label>
                  <p className={`t-sub mt-6 max-w-[24rem] ${gi === 1 ? "text-kapur/85" : "text-ink-soft"}`}>{g.intro}</p>
                </div>
                <ul className={`col-span-12 border-t lg:col-span-7 lg:col-start-6 ${gi === 1 ? "border-kapur/15" : "border-ink/15"}`}>
                  {list.map((s) => (
                    <li key={s.slug} className={`border-b ${gi === 1 ? "border-kapur/15" : "border-ink/15"}`}>
                      <Link href={`/services/${s.slug}`} className="group grid gap-3 py-8 sm:grid-cols-[1fr_auto] sm:items-end">
                        <div>
                          <h2 className="t-headline text-[clamp(1.75rem,1.3rem+1.6vw,2.75rem)]">
                            <span className="link-reveal">{s.title}</span>
                            {s.isDraft ? <span className="t-label ml-3 align-middle opacity-60">Draft</span> : null}
                          </h2>
                          <p className={`mt-3 max-w-[36rem] ${gi === 1 ? "text-kapur/75" : "text-ink-soft"}`}>{s.summary}</p>
                        </div>
                        <Arrow className="transition-transform duration-500 group-hover:translate-x-1" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        );
      })}

      <section data-tone="light" className="bg-kapur text-ink">
        <div className="page-x section-y flex flex-col items-start gap-8">
          <TitlePair lead="Not sure which applies?" italic="Describe the space and we'll tell you." />
          <ButtonLink href="/contact" variant="dark">
            Discuss your project
          </ButtonLink>
        </div>
      </section>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Label, TitlePair } from "@/components/ui/Typography";
import { getInsights } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const ensureStatic = "navigation";

export const metadata: Metadata = pageMetadata({
  title: "Insights: planning an interior in Malaysia",
  description:
    "Practical notes from ROUANG for homeowners and restaurant operators: choosing a designer, planning a layout, materials, lighting and what shapes cost.",
  path: "/insights",
});

export default async function InsightsPage() {
  const insights = await getInsights();
  return (
    <>
      <section data-tone="light" className="bg-kapur text-ink">
        <div className="page-x pb-16 pt-[calc(var(--header-h)+3rem)]">
          <Breadcrumbs items={[{ name: "Insights", href: "/insights" }]} />
          <div className="page-grid mt-16 gap-y-10 sm:mt-24">
            <Label className="col-span-12 text-ink-muted lg:col-span-3">Insights</Label>
            <div className="col-span-12 lg:col-span-9">
              <TitlePair as="h1" size="hero" lead="Notes for people planning a space" italic="written from the drawing board" />
              <p className="mt-8 max-w-[38rem] text-ink-soft">
                The questions we are asked most, answered properly: before you hire anyone, before you sign off a layout,
                and before the first wall comes down.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section data-tone="light" className="bg-kapur text-ink" aria-label="Articles">
        <div className="page-x pb-[var(--section-space)]">
          {insights.length ? (
            <ol className="border-t border-ink/15">
              {insights.map((a) => (
                <li key={a.slug} className="border-b border-ink/15">
                  <Link href={`/insights/${a.slug}`} className="page-grid group gap-y-3 py-10">
                    <p className="t-label col-span-12 text-ink-muted lg:col-span-3">
                      {a.category}
                      {a.isDraft ? " · Draft" : ""}
                    </p>
                    <div className="col-span-12 lg:col-span-6">
                      <h2 className="t-headline text-[clamp(1.625rem,1.25rem+1.4vw,2.5rem)]">
                        <span className="link-reveal">{a.title}</span>
                      </h2>
                      <p className="mt-4 max-w-[36rem] text-ink-soft">{a.description}</p>
                    </div>
                    <p className="t-caption col-span-12 text-ink-muted lg:col-span-2 lg:col-start-11 lg:text-right">
                      {a.readingMinutes} min read
                    </p>
                  </Link>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-ink-soft">The first articles are being written.</p>
          )}
        </div>
      </section>
    </>
  );
}

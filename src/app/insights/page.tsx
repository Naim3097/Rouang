import type { Metadata } from "next";
import Link from "next/link";
import { insightImage, insightMeta } from "@/components/insights/imagery";
import { InsightPicture } from "@/components/insights/InsightPicture";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Label, TitlePair } from "@/components/ui/Typography";
import { getInsights } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const ensureStatic = "navigation";

export async function generateMetadata(): Promise<Metadata> {
  const empty = (await getInsights()).length === 0;
  return pageMetadata({
  title: "Insights: planning an interior in Malaysia",
  description:
    "Practical notes from ROUANG for homeowners and restaurant operators: choosing a designer, planning a layout, materials, lighting and what shapes cost.",
  path: "/insights",
    // An empty listing is a thin page: keep it out of the index until something is published.
    noindex: empty,
  });
}

export default async function InsightsPage() {
  const insights = await getInsights();
  const images = new Map(insights.map((a) => [a.slug, insightImage(a.slug)]));
  const withPictures = insights.some((a) => images.get(a.slug));
  return (
    <>
      <section data-tone="light" className="bg-kapur text-ink">
        <div className="page-x pb-16 pt-[calc(var(--header-h)+3rem)]">
          <Breadcrumbs items={[{ name: "Insights", href: "/insights" }]} />
          <div className="page-grid mt-16 gap-y-10 sm:mt-24">
            <Label className="col-span-12 text-ink-muted lg:col-span-3">Insights</Label>
            <div className="col-span-12 lg:col-span-9">
              <TitlePair as="h1" size="hero" eyebrow="Interior design insights" lead="Notes for people planning a space" follow="written from the drawing board" />
              <p className="mt-8 max-w-[38rem] text-ink-soft">
                Questions people commonly ask, answered properly: before you hire anyone, before you sign off a layout,
                and before any work starts on site.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section data-tone="light" className="bg-kapur text-ink" aria-label="Articles">
        <div className="page-x pb-[var(--section-space)]">
          {insights.length ? (
            // One row per article, each one link: its picture in the margin column under the page's
            // label, at the 2/1 of the home page's rows and "Read next" (3/2 over the words on phones),
            // the words under the page title. The first picture is in the first screen on a desktop,
            // so it loads at once. With no pictures to show (a live page, while they are temporary)
            // the rows are words alone, laid out as before: the category in the margin, the reading
            // time on the right.
            <ol className="border-t border-ink/15">
              {insights.map((a, i) => (
                <li key={a.slug} className="border-b border-ink/15">
                  {withPictures ? (
                    <Link href={`/insights/${a.slug}`} className="ins-link ins-index-card page-grid py-8 sm:py-10">
                      <div className="col-span-12 sm:col-span-7 lg:col-span-8 lg:col-start-4">
                        <p className="t-label text-ink-muted">{insightMeta(a)}</p>
                        <h2 className="t-title mt-3">
                          <span className="link-name">{a.title}</span>
                        </h2>
                        <p className="mt-3 max-w-[36rem] text-ink-soft">{a.description}</p>
                      </div>
                      <InsightPicture
                        image={images.get(a.slug) ?? null}
                        className="col-span-12 sm:col-span-5 lg:col-span-3"
                        sizes="(min-width: 1024px) 22vw, (min-width: 640px) 38vw, 100vw"
                        lead={i === 0}
                        decorative
                      />
                    </Link>
                  ) : (
                    <Link href={`/insights/${a.slug}`} className="page-grid gap-y-3 py-10">
                      <p className="t-label col-span-12 text-ink-muted lg:col-span-3">
                        {insightMeta(a, { readingTime: false })}
                      </p>
                      <div className="col-span-12 lg:col-span-6">
                        <h2 className="t-title">
                          <span className="link-name">{a.title}</span>
                        </h2>
                        <p className="mt-4 max-w-[36rem] text-ink-soft">{a.description}</p>
                      </div>
                      <p className="t-caption col-span-12 text-ink-muted lg:col-span-2 lg:col-start-11 lg:text-right">
                        {a.readingMinutes} min read
                      </p>
                    </Link>
                  )}
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

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CurveRule } from "@/components/brand/Brand";
import { insightImage, insightMeta } from "@/components/insights/imagery";
import { InsightPicture } from "@/components/insights/InsightPicture";
import { ButtonLink } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/ui/JsonLd";
import { Label } from "@/components/ui/Typography";
import { getInsight, getInsights, getProjects, getServices, staticSlugs } from "@/lib/content";
import { articleSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo";

export const ensureStatic = "navigation";
// Every slug is prerendered and quick to fetch, so a navigation that waits for the static
// payload is acceptable. Content stays in the HTML instead of a hidden Suspense segment.
export const instant = false;

export async function generateStaticParams() {
  return staticSlugs(await getInsights());
}

export async function generateMetadata({ params }: PageProps<"/insights/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const a = await getInsight(slug);
  if (!a) return {};
  return pageMetadata({
    title: a.seo.title ?? a.title,
    description: a.seo.description ?? a.description,
    path: `/insights/${a.slug}`,
    type: "article",
    publishedTime: a.publishedAt,
    modifiedTime: a.updatedAt,
  });
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-MY", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kuala_Lumpur" }).format(new Date(`${iso}T12:00:00+08:00`));
}

export default async function InsightPage({ params }: PageProps<"/insights/[slug]">) {
  const { slug } = await params;
  const article = await getInsight(slug);
  if (!article) notFound();
  const [services, projects, all] = await Promise.all([getServices(), getProjects(), getInsights()]);
  const relatedServices = services.filter((s) => article.relatedServices.includes(s.slug));
  const relatedProjects = projects.filter((p) => article.relatedProjects.includes(p.slug));
  const more = all.filter((a) => a.slug !== article.slug).slice(0, 2);
  const picture = insightImage(article.slug);
  const moreImages = new Map(more.map((a) => [a.slug, insightImage(a.slug)]));
  const morePictures = more.some((a) => moreImages.get(a.slug));

  return (
    <article>
      <JsonLd data={articleSchema(article)} />
      <header data-tone="light" className="bg-kapur text-ink">
        <div className="page-x pb-14 pt-[calc(var(--header-h)+3rem)]">
          <Breadcrumbs items={[{ name: "Insights", href: "/insights" }, { name: article.title, href: `/insights/${article.slug}` }]} />
          <div className="page-grid mt-16 gap-y-8 sm:mt-24">
            <div className="col-span-12 lg:col-span-3">
              <Label className="text-ink-muted">{article.category}</Label>
              {article.isDraft ? <p className="t-label mt-3 text-ink-muted">Draft · not yet reviewed by ROUANG</p> : null}
            </div>
            <div className="col-span-12 lg:col-span-8">
              <h1 className="t-headline-hero max-w-[24ch]">{article.title}</h1>
              <p className="t-sub mt-8 max-w-[40rem] text-ink-soft">{article.description}</p>
              <p className="t-caption mt-8 text-ink-muted">
                {article.author} · <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
                {article.updatedAt ? (
                  <>
                    {" "}
                    · Updated <time dateTime={article.updatedAt}>{formatDate(article.updatedAt)}</time>
                  </>
                ) : null}{" "}
                · {article.readingMinutes} min read
              </p>
            </div>
            {/* The article's picture, under the title block, from the title's edge to the page margin
                (insights.css, "Article"). It illustrates the subject only, so it has no caption: it is
                not the studio's work. */}
            {picture ? (
              <InsightPicture
                image={picture}
                lead
                className="ins-frame-lead col-span-12 mt-4 sm:mt-8 lg:col-span-9 lg:col-start-4"
                sizes="(min-width: 1024px) 68vw, 100vw"
              />
            ) : null}
          </div>
        </div>
      </header>

      <div data-tone="light" className="bg-kapur text-ink">
        <div className="page-x pb-[var(--section-space)]">
          <CurveRule className="mb-14 text-ink/25" at="24%" />
          <div className="page-grid gap-y-12">
            {article.headings.length > 2 ? (
              <nav aria-label="In this article" className="col-span-12 lg:col-span-3">
                <div className="lg:sticky lg:top-[calc(var(--header-h)+2rem)]">
                  <p className="t-label text-ink-muted">In this article</p>
                  <ol className="t-meta mt-4 space-y-2.5">
                    {article.headings.map((h) => (
                      <li key={h.id}>
                        <a href={`#${h.id}`} className="text-ink-soft transition-colors duration-300 hover:text-ink">
                          {h.text}
                        </a>
                      </li>
                    ))}
                  </ol>
                </div>
              </nav>
            ) : null}
            <div className="col-span-12 lg:col-span-7 lg:col-start-5">
              <div className="prose-rouang" dangerouslySetInnerHTML={{ __html: article.html }} />

              {article.sources.length ? (
                <div className="mt-16 border-t border-ink/15 pt-6">
                  <p className="t-label text-ink-muted">Sources</p>
                  <ul className="t-caption mt-4 space-y-2 text-ink-soft">
                    {article.sources.map((s) => (
                      <li key={s.url}>
                        <a href={s.url} rel="noopener noreferrer" className="underline underline-offset-2">
                          {s.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <aside className="mt-16 rounded-[2px] bg-ink p-8 text-kapur sm:p-10" data-tone="dark">
                <p className="t-sub">Talking through your own project is usually quicker than reading about one.</p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <ButtonLink href="/contact" variant="light">
                    Discuss your project
                  </ButtonLink>
                </div>
                {/* Related pages as rows of an index: the name, and what kind of page it is. */}
                {relatedServices.length || relatedProjects.length ? (
                  <ul className="mt-10 border-t border-kapur/15" aria-label="Related">
                    {[
                      ...relatedServices.map((s) => ({ href: `/services/${s.slug}`, name: s.title, kind: "Service" })),
                      ...relatedProjects.map((p) => ({ href: `/projects/${p.slug}`, name: p.title, kind: "Project" })),
                    ].map((r) => (
                      <li key={r.href} className="border-b border-kapur/15">
                        <Link href={r.href} className="flex min-h-14 items-baseline justify-between gap-6 py-4">
                          <span className="link-name font-medium">{r.name}</span>
                          <span className="t-label text-mouse">{r.kind}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </aside>
            </div>
          </div>
        </div>
      </div>

      {more.length ? (
        <section data-tone="light" className="bg-kapur-deep text-ink" aria-label="More insights">
          <div className="page-x section-y">
            <Label className="mb-8 text-ink-muted">Read next</Label>
            {/* The home page's rows: a thumbnail beside the category line and the title. */}
            <ul className="grid gap-x-[var(--grid-gap)] border-t border-ink/15 lg:grid-cols-2">
              {more.map((a) => (
                <li key={a.slug} className="border-b border-ink/15">
                  <Link href={`/insights/${a.slug}`} className="ins-link ins-card ins-card-row py-8">
                    <div className="ins-card-words">
                      <p className="t-label text-ink-muted">{insightMeta(a, { readingTime: false })}</p>
                      <p className="t-title mt-3">
                        <span className="link-name">{a.title}</span>
                      </p>
                    </div>
                    {morePictures ? (
                      <InsightPicture
                        image={moreImages.get(a.slug) ?? null}
                        className="ins-frame-thumb"
                        sizes="(min-width: 640px) 20vw, 40vw"
                      />
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </article>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CurveRule } from "@/components/brand/Brand";
import { ArrowLink, ButtonLink } from "@/components/ui/Button";
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

  return (
    <article>
      <JsonLd data={articleSchema(article)} />
      <header data-tone="light" className="bg-kapur text-ink">
        <div className="page-x pb-14 pt-[calc(var(--header-h)+3rem)]">
          <Breadcrumbs items={[{ name: "Insights", href: "/insights" }, { name: article.title, href: `/insights/${article.slug}` }]} />
          <div className="page-grid mt-16 gap-y-8 sm:mt-24">
            <div className="col-span-12 lg:col-span-3">
              <Label className="text-ink-muted">{article.category}</Label>
              {article.isDraft ? <p className="t-label mt-3 text-rikyu">Draft · not yet reviewed by the studio</p> : null}
            </div>
            <div className="col-span-12 lg:col-span-8">
              <h1 className="t-headline-hero max-w-[20ch] text-[clamp(2.375rem,1.5rem+3.4vw,4.75rem)]">{article.title}</h1>
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
                  <ol className="mt-4 space-y-2.5 text-[0.9375rem]">
                    {article.headings.map((h) => (
                      <li key={h.id}>
                        <a href={`#${h.id}`} className="link-reveal text-ink-soft hover:text-ink">
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
                {relatedServices.length || relatedProjects.length ? (
                  <ul className="mt-8 space-y-2">
                    {relatedServices.map((s) => (
                      <li key={s.slug}>
                        <ArrowLink href={`/services/${s.slug}`}>{s.title}</ArrowLink>
                      </li>
                    ))}
                    {relatedProjects.map((p) => (
                      <li key={p.slug}>
                        <ArrowLink href={`/projects/${p.slug}`}>
                          See the project: <span className="font-serif italic">{p.title}</span>
                        </ArrowLink>
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
            <ul className="grid gap-x-[var(--grid-gap)] border-t border-ink/15 sm:grid-cols-2">
              {more.map((a) => (
                <li key={a.slug} className="border-b border-ink/15">
                  <Link href={`/insights/${a.slug}`} className="block py-8">
                    <p className="t-label text-ink-muted">{a.category}</p>
                    <p className="t-sub mt-3">
                      <span className="link-reveal">{a.title}</span>
                    </p>
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

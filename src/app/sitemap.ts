import type { MetadataRoute } from "next";
import { getInsights, getProjects, getServices } from "@/lib/content";
import { IS_PRODUCTION } from "@/lib/env";
import { absoluteUrl } from "@/lib/seo";

/** Only published, indexable pages. Drafts, placeholders and the preview checklist never appear. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, services, insights] = await Promise.all([getProjects(), getServices(), getInsights()]);
  const live = <T extends { isDraft: boolean; placeholder?: boolean }>(items: T[]) =>
    items.filter((i) => !i.isDraft && !i.placeholder);

  const staticPages = ["/", "/projects", "/services", "/about", "/insights", "/contact", "/privacy"].map((path) => ({
    url: absoluteUrl(path),
    changeFrequency: "monthly" as const,
    priority: path === "/" ? 1 : 0.7,
  }));

  const pages: MetadataRoute.Sitemap = [
    ...staticPages,
    ...live(services).map((s) => ({ url: absoluteUrl(`/services/${s.slug}`), changeFrequency: "monthly" as const, priority: 0.9 })),
    ...live(projects).map((p) => ({ url: absoluteUrl(`/projects/${p.slug}`), changeFrequency: "yearly" as const, priority: 0.8 })),
    ...live(insights).map((a) => ({
      url: absoluteUrl(`/insights/${a.slug}`),
      lastModified: a.updatedAt ?? a.publishedAt,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
  ];

  // Outside production the sitemap is empty: robots.txt disallows everything there anyway.
  return IS_PRODUCTION ? pages : [];
}

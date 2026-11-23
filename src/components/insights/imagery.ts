import { insightImagery } from "@/config/media";
import { publicImage, type Insight } from "@/lib/content";
import type { Image } from "@/lib/content/schema";
import { SHOW_NOTES } from "@/lib/env";

/**
 * An article's picture, where this environment may show it. The pictures are temporary photographs
 * for now (insightImagery in src/config/media.ts), so publicImage() keeps them to previews and a live
 * page gets null. Every layout that uses one also works without it.
 */
export function insightImage(slug: string): Image | null {
  return publicImage(insightImagery[slug] ?? null);
}

/** The small-caps line over an article's title: its category, the reading time where asked, and Draft (local development only). */
export function insightMeta(a: Insight, { readingTime = true }: { readingTime?: boolean } = {}) {
  return [a.category, readingTime ? `${a.readingMinutes} min read` : null, a.isDraft && SHOW_NOTES ? "Draft" : null].filter(Boolean).join(" · ");
}

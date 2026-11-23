import type { Metadata } from "next";
import { IS_PRODUCTION, SITE_URL } from "./env";

export const SITE_NAME = "ROUANG";
const TITLE_SUFFIX = " · ROUANG";

export function absoluteUrl(path = "/") {
  return new URL(path, SITE_URL).toString();
}

type PageMeta = {
  /** Page title without the brand suffix. Keep the whole title under ~60 characters. */
  title: string;
  description: string;
  path: string;
  /**
   * Absolute or root-relative path to a 1200x630 image. Left out, a route with its own
   * opengraph-image file (ROUTES_WITH_OWN_CARD) uses that, and every other page the brand card.
   * null always leaves the choice to the route's own file.
   */
  image?: string | null;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  /** Force noindex even in production (e.g. thank-you or utility pages). */
  noindex?: boolean;
  /** Use the title exactly as given (the home page carries the brand first). */
  absoluteTitle?: boolean;
};

/**
 * Routes whose folder has its own opengraph-image file: an article and a case study each get a card
 * with their own title (src/app/insights/[slug] and src/app/projects/[slug]). Next applies such a
 * file only when the page's metadata has no `images` key at all, so these pages leave the key out.
 * Add a pattern here when another route gains its own card.
 */
const ROUTES_WITH_OWN_CARD = [/^\/insights\/[^/]+$/, /^\/projects\/[^/]+$/];

/**
 * One place that decides titles, canonicals, social cards and indexing for every page.
 * Outside production every page is noindex, whatever the page asks for.
 */
export function pageMetadata({
  title,
  description,
  path,
  image,
  type = "website",
  publishedTime,
  modifiedTime,
  noindex = false,
  absoluteTitle = false,
}: PageMeta): Metadata {
  const fullTitle = absoluteTitle ? title : `${title}${TITLE_SUFFIX}`;
  const canonical = absoluteUrl(path);
  const index = IS_PRODUCTION && !noindex;
  // Every page without a card of its own names the brand card, because a page-level openGraph
  // object replaces the root one (the root opengraph-image file would otherwise be lost). A route
  // with its own file gets no `images` key, so Next fills in that file and copies it to twitter.
  const card =
    image !== undefined ? image : ROUTES_WITH_OWN_CARD.some((r) => r.test(path)) ? null : absoluteUrl("/opengraph-image");
  return {
    title: { absolute: fullTitle },
    description,
    alternates: { canonical },
    robots: index
      ? { index: true, follow: true, "max-image-preview": "large" }
      : { index: false, follow: false, nocache: true },
    openGraph: {
      type,
      url: canonical,
      siteName: SITE_NAME,
      title: fullTitle,
      description,
      locale: "en_MY",
      ...(card ? { images: [{ url: card, width: 1200, height: 630, alt: title }] } : {}),
      ...(type === "article" && publishedTime ? { publishedTime, modifiedTime: modifiedTime ?? publishedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      ...(card ? { images: [card] } : {}),
    },
  };
}

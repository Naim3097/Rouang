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
  /** Absolute or root-relative path to a 1200x630 image. Defaults to the route's generated OG image. */
  image?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  /** Force noindex even in production (e.g. thank-you or utility pages). */
  noindex?: boolean;
  /** Use the title exactly as given (the home page carries the brand first). */
  absoluteTitle?: boolean;
};

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
  // Routes with their own opengraph-image file override this (file-based metadata wins); every
  // other page shares the brand card, because a page-level openGraph object replaces the root one.
  image ??= absoluteUrl("/opengraph-image");
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
      ...(image ? { images: [{ url: image, width: 1200, height: 630, alt: title }] } : {}),
      ...(type === "article" && publishedTime ? { publishedTime, modifiedTime: modifiedTime ?? publishedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

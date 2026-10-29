import { studio } from "@/config/studio";
import { absoluteUrl, SITE_NAME } from "./seo";

/**
 * schema.org builders. They only ever use confirmed studio facts: no ratings, reviews, awards or
 * service areas that the studio has not confirmed. LocalBusiness is emitted only once a real
 * address exists, because Google requires one.
 */

export const ORG_ID = absoluteUrl("/#organization");
const WEBSITE_ID = absoluteUrl("/#website");

function confirmedAreas() {
  return studio.serviceAreas
    .filter((a) => a.confirmed)
    .map((a) => ({ "@type": "AdministrativeArea", name: a.name }));
}

function sameAs() {
  return [
    studio.social.instagram,
    studio.social.facebook,
    studio.social.tiktok,
    studio.social.linkedin,
    studio.googleBusinessProfile,
  ].filter(Boolean) as string[];
}

export function organizationSchema() {
  const areas = confirmedAreas();
  const links = sameAs();
  const base: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": studio.address ? ["Organization", "LocalBusiness"] : "Organization",
    "@id": ORG_ID,
    name: SITE_NAME,
    url: absoluteUrl("/"),
    logo: { "@type": "ImageObject", url: absoluteUrl("/brand/rouang-app-icon-512.png"), width: 512, height: 512 },
    image: absoluteUrl("/brand/rouang-app-icon-512.png"),
    slogan: studio.tagline.ms,
    description: studio.positioning,
    knowsAbout: ["Interior design", "Residential interior design", "Restaurant interior design"],
  };
  if (studio.legalName) base.legalName = studio.legalName;
  if (studio.contact.email) base.email = studio.contact.email;
  if (studio.contact.phone) base.telephone = studio.contact.phone;
  if (studio.foundingYear) base.foundingDate = String(studio.foundingYear);
  if (areas.length) base.areaServed = areas;
  if (links.length) base.sameAs = links;
  if (studio.address) {
    base.address = {
      "@type": "PostalAddress",
      streetAddress: studio.address.street,
      addressLocality: studio.address.locality,
      addressRegion: studio.address.region,
      postalCode: studio.address.postalCode,
      addressCountry: studio.address.country,
    };
    if (studio.openingHours) base.openingHours = studio.openingHours;
  }
  return base;
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: absoluteUrl("/"),
    name: SITE_NAME,
    inLanguage: "en-MY",
    publisher: { "@id": ORG_ID },
  };
}

export function serviceSchema(s: { title: string; summary: string; slug: string; sector: string }) {
  const areas = confirmedAreas();
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: s.title,
    serviceType: s.title,
    description: s.summary,
    url: absoluteUrl(`/services/${s.slug}`),
    provider: { "@id": ORG_ID },
    ...(areas.length ? { areaServed: areas } : {}),
  };
}

export function articleSchema(a: {
  title: string;
  description: string;
  slug: string;
  publishedAt: string;
  updatedAt?: string;
  author: string;
}) {
  const url = absoluteUrl(`/insights/${a.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: a.title,
    description: a.description,
    datePublished: a.publishedAt,
    dateModified: a.updatedAt ?? a.publishedAt,
    mainEntityOfPage: url,
    url,
    image: absoluteUrl(`/insights/${a.slug}/opengraph-image`),
    inLanguage: "en-MY",
    author: { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
  };
}

export function breadcrumbSchema(trail: { name: string; href: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.href),
    })),
  };
}

/**
 * Studio facts. Everything the site says about the business comes from here.
 *
 * Rule: a value is either confirmed by the studio or it is `null`. Components hide whatever is
 * `null`, so nothing unconfirmed is ever shown as fact. Each `null` below is listed in
 * docs/CONFIRMATIONS.md and reported by `npm run launch-check`.
 *
 * Contact values can also be supplied through environment variables so they can be changed
 * in Vercel without a code change.
 */

export type ServiceArea = { name: string; confirmed: boolean };

export type PostalAddress = {
  street: string;
  locality: string;
  region: string;
  postalCode: string;
  country: "MY";
};

import { IS_PRODUCTION } from "@/lib/env";

const env = (key: string) => process.env[key]?.trim() || null;

export const studio = {
  name: "ROUANG",
  /** Registered company name, e.g. "ROUANG Sdn. Bhd." Not yet supplied. */
  legalName: env("STUDIO_LEGAL_NAME"),
  /** SSM registration number. Not yet supplied. */
  registrationNo: env("STUDIO_REGISTRATION_NO"),

  /** From the brand kit (tagline lockup, p.5 and p.12). */
  tagline: { ms: "Ruang tanpa batas", en: "Space without limits" },
  /** From the brand kit typography specimen (p.12–13), the studio's own line. */
  promise: {
    ms: "Anda cerita macam mana nak duduk. Kami terjemah jadi ruang.",
    en: "You tell us how you want to live. We translate it into space.",
  },
  /**
   * How the studio describes itself. "Interior Designer" is a protected title (Architects Act 1967
   * s.27A); legal advice on this wording is a launch check. Change it here and it changes everywhere.
   */
  descriptor: "Interior design studio",
  /** Working positioning from the project brief. */
  positioning:
    "A design-led interior studio creating considered spaces for homes and businesses, balancing aesthetics, functionality and the realities of each project.",

  contact: {
    /** e.g. "hello@example.com". Not yet supplied. */
    email: env("NEXT_PUBLIC_CONTACT_EMAIL"),
    /** Display format, e.g. "+60 12 345 6789". Not yet supplied. */
    phone: env("NEXT_PUBLIC_CONTACT_PHONE"),
    /** Digits only, international format without "+", e.g. "60123456789". Not yet supplied. */
    whatsapp: env("NEXT_PUBLIC_WHATSAPP_NUMBER"),
  },

  /** Studio address for the contact page and LocalBusiness schema. Not yet supplied. */
  address: null as PostalAddress | null,
  /** Opening hours in schema.org format, e.g. ["Mo-Fr 09:00-18:00"]. Not yet supplied. */
  openingHours: null as string[] | null,

  /**
   * Service areas. Kuala Lumpur and Selangor are the brief's starting assumption and are
   * consistent with the Rembayung project location. Confirm before launch.
   */
  serviceAreas: [
    { name: "Kuala Lumpur", confirmed: false },
    { name: "Selangor", confirmed: false },
  ] satisfies ServiceArea[],

  social: {
    instagram: env("NEXT_PUBLIC_INSTAGRAM_URL"),
    facebook: env("NEXT_PUBLIC_FACEBOOK_URL"),
    tiktok: env("NEXT_PUBLIC_TIKTOK_URL"),
    linkedin: env("NEXT_PUBLIC_LINKEDIN_URL"),
  },
  /** Google Business Profile URL, once the listing is verified. */
  googleBusinessProfile: env("NEXT_PUBLIC_GBP_URL"),
  foundingYear: null as number | null,

  /**
   * Capabilities beyond interior design. The brand kit shows renovation, "Build" and site
   * merchandise, but the service list is not confirmed. Copy that mentions construction,
   * renovation works, procurement or site supervision only renders when these are true.
   */
  capabilities: {
    interiorDesign: true,
    renovationAndBuild: false,
    projectManagement: false,
    architecture: false,
  },
} as const;

export function whatsappHref(message?: string) {
  const number = studio.contact.whatsapp?.replace(/\D/g, "");
  if (!number) return null;
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${number}${text}`;
}

export function telHref() {
  const phone = studio.contact.phone?.replace(/[^\d+]/g, "");
  return phone ? `tel:${phone}` : null;
}

/**
 * Where the studio works, as shown on the page. Previews show the intended areas so they can be
 * reviewed; production shows confirmed areas only, so an override of the launch check cannot ship
 * an unconfirmed location.
 */
export function areaLabel() {
  const areas = IS_PRODUCTION ? studio.serviceAreas.filter((a) => a.confirmed) : studio.serviceAreas;
  return areas.length ? areas.map((a) => a.name).join(" and ") : "Malaysia";
}

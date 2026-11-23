/**
 * Company facts. Everything the site says about the business comes from here.
 *
 * Rule: a value is either confirmed by the company or it is `null`. Components hide whatever is
 * `null`, so nothing unconfirmed is ever shown as fact. Each `null` below is listed in
 * docs/CONFIRMATIONS.md and reported by `npm run launch-check`.
 *
 * Source: the company profile ROUANG supplied in November 2026 ("ROUANG for Marketing & Branding";
 * page numbers below are the PDF's pages). Contact values can still be overridden through
 * environment variables, so they can be changed in Vercel without a code change.
 */

export type ServiceArea = { name: string; confirmed: boolean };

export type PostalAddress = {
  /** One line each, as the address is set on the page: the unit and road, then the area. */
  street: string[];
  locality: string;
  region: string;
  postalCode: string;
  country: "MY";
};

import { IS_PRODUCTION } from "@/lib/env";

const env = (key: string) => process.env[key]?.trim() || null;

export const studio = {
  name: "ROUANG",
  /** Registered business name (profile p.9). */
  legalName: env("STUDIO_LEGAL_NAME") ?? "ROUANG GLOBAL",
  /** SSM registration number (profile p.9). */
  registrationNo: env("STUDIO_REGISTRATION_NO") ?? "SA0626323-U",
  /** CIDB registration number (profile p.9). The grade is not stated, so the site makes no claim about it. */
  cidbRegistrationNo: env("STUDIO_CIDB_NO") ?? "0120250108-SL148929",

  /** From the brand kit (tagline lockup, p.5 and p.12). */
  tagline: { ms: "Ruang tanpa batas", en: "Space without limits" },
  /** From the brand kit typography specimen (p.12–13). */
  promise: {
    ms: "Anda cerita macam mana nak duduk. Kami terjemah jadi ruang.",
    en: "You tell us how you want to live. We translate it into space.",
  },
  /**
   * The company's own line, closing the About text (profile p.2). The profile capitalises every
   * word; the site sets it in sentence case, like every headline (globals.css, type scale).
   */
  line: { lead: "Spaces designed with purpose.", follow: "Delivered with precision." },
  /**
   * How the company describes itself (profile p.2). Change it here and it changes everywhere.
   * "Interior Designer" stays out of it: it is a protected title (Architects Act 1967 s.27A).
   */
  descriptor: "Design-led construction company",
  /** One sentence for descriptions and search data, condensed from the About text (profile p.2). */
  positioning:
    "A design-led construction company bringing design, planning, project management and construction together, from renovation and interiors to new builds.",

  contact: {
    /** Enquiries and data requests (profile p.9). */
    email: env("NEXT_PUBLIC_CONTACT_EMAIL") ?? "hi.rouang@gmail.com",
    /** Display format, as the profile gives it (p.9). */
    phone: env("NEXT_PUBLIC_CONTACT_PHONE") ?? "+6012-347 7170",
    /**
     * Digits only, international format without "+", e.g. "60123456789". The profile gives a phone
     * number but does not say it takes WhatsApp, so the WhatsApp buttons stay hidden until confirmed.
     */
    whatsapp: env("NEXT_PUBLIC_WHATSAPP_NUMBER"),
  },

  /** Office address for the contact page, footer and LocalBusiness schema (profile p.9). */
  address: {
    street: ["No. 52-1, Jalan Aman Sinaria 4", "Bandar Tropicana"],
    locality: "Telok Panglima Garang",
    region: "Selangor",
    postalCode: "42500",
    country: "MY",
  } as PostalAddress | null,
  /** Opening hours in schema.org format, e.g. ["Mo-Fr 09:00-18:00"]. Not yet supplied. */
  openingHours: null as string[] | null,

  /**
   * Service areas. Kuala Lumpur and Selangor are the brief's starting assumption and match the
   * office and the projects so far, but the profile does not list service areas. Confirm before launch.
   */
  serviceAreas: [
    { name: "Kuala Lumpur", confirmed: false },
    { name: "Selangor", confirmed: false },
  ] satisfies ServiceArea[],

  /** Instagram and Facebook are named in the profile (p.9); TikTok is the company's public account. */
  social: {
    instagram: env("NEXT_PUBLIC_INSTAGRAM_URL") ?? "https://www.instagram.com/rouang_official/",
    facebook: env("NEXT_PUBLIC_FACEBOOK_URL") ?? "https://www.facebook.com/profile.php?id=61571364632150",
    tiktok: env("NEXT_PUBLIC_TIKTOK_URL") ?? "https://www.tiktok.com/@rouang_official",
    linkedin: env("NEXT_PUBLIC_LINKEDIN_URL"),
  },
  /** Google Business Profile URL, once the listing is verified. */
  googleBusinessProfile: env("NEXT_PUBLIC_GBP_URL"),
  foundingYear: null as number | null,

  /**
   * What the company delivers. The profile describes design, renovation and interior work, new
   * builds, construction and project management (pp.2 and 4). Architecture is not offered as a
   * service. Copy that mentions construction or project management only renders while these are true.
   */
  capabilities: {
    interiorDesign: true,
    renovationAndBuild: true,
    projectManagement: true,
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

/** The office address on one line, as the profile sets it out. */
export function addressLine() {
  const a = studio.address;
  return a ? `${a.street.join(", ")}, ${a.postalCode} ${a.locality}, ${a.region}` : null;
}

/**
 * The office address as the lines of a postal address, for the footer and the contact page: the
 * unit and road, the area, the postcode and town, the state. Set as deliberate lines, a narrow
 * column never breaks inside a place name.
 */
export function addressLines() {
  const a = studio.address;
  return a ? [...a.street, `${a.postalCode} ${a.locality}`, a.region] : null;
}

/**
 * Where the company works, as shown on the page. Previews show the intended areas so they can be
 * reviewed; production shows confirmed areas only, so an override of the launch check cannot ship
 * an unconfirmed location.
 */
export function areaLabel() {
  const areas = IS_PRODUCTION ? studio.serviceAreas.filter((a) => a.confirmed) : studio.serviceAreas;
  return areas.length ? areas.map((a) => a.name).join(" and ") : "Malaysia";
}

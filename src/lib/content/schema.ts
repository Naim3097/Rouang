import { z } from "zod";

/**
 * Content model. Every project, service and article lives as a Markdown file in /content with
 * frontmatter validated against these schemas at build time. An invalid file fails the build
 * with a message naming the file and field, so a typo can never ship silently.
 */

const isoDate = z.preprocess(
  (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v),
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
    // The pattern alone accepts 2026-02-31; a real date survives the round trip unchanged.
    .refine((v) => !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v, "Not a real date"),
);

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase-words-with-hyphens");

export const status = z.enum(["draft", "published"]);

/** A photograph that exists. `provisional` marks brand-kit or stock imagery whose licence is unconfirmed. */
export const image = z.strictObject({
  src: z.string().startsWith("/"),
  alt: z.string().min(3),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  caption: z.string().optional(),
  credit: z.string().optional(),
  provisional: z.boolean().default(false),
  /** CSS object-position used when the frame crops the photograph, e.g. "50% 40%". */
  focus: z.string().optional(),
  /** A landscape crop of the same photograph for large screens (made by scripts/media/export.cjs). */
  wide: z
    .strictObject({ src: z.string().startsWith("/"), width: z.number().int().positive(), height: z.number().int().positive() })
    .optional(),
});

/** A photograph the studio still has to supply. Rendered as a drawing-frame placeholder in previews only. */
export const pendingImage = z.strictObject({
  pending: z.string().min(3),
  aspect: z.enum(["3/2", "4/5", "16/9", "1/1", "2/3", "21/9"]).default("3/2"),
});

export const galleryItem = z.union([
  image.extend({
    span: z.enum(["full", "wide", "half", "narrow"]).default("half"),
    /** The brand kit's three kinds of picture. */
    role: z.enum(["space", "material", "whole"]).optional(),
    /** Include in the scroll walkthrough, with this line as its caption. */
    walk: z.string().optional(),
    /** Position in the walkthrough, which tells the story in its own order (rooms first, then details). */
    walkOrder: z.number().optional(),
  }),
  pendingImage.extend({ span: z.enum(["full", "wide", "half", "narrow"]).default("half") }),
]);

/** One encoded loop: a silent H.264 MP4 and its first frame as a still (made by scripts/media/films.cjs). */
const filmClip = z.strictObject({
  src: z.string().startsWith("/"),
  poster: z.string().startsWith("/"),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

const seo = z
  .strictObject({
    title: z.string().max(65).optional(),
    description: z.string().max(170).optional(),
  })
  .default({});

/** A sourced statement. Only `verified` facts may be rendered in production. */
const fact = z.strictObject({
  label: z.string(),
  value: z.string(),
  source: z.string(),
  verified: z.boolean(),
});

export const projectSchema = z.strictObject({
  title: z.string(),
  status,
  /** Layout placeholders exist only to show the template in previews. They can never be published. */
  placeholder: z.boolean().default(false),
  featured: z.boolean().default(false),
  order: z.number().default(100),
  sector: z.enum(["residential", "commercial"]),
  type: z.string(),
  location: z.string().nullable().default(null),
  year: z.string().nullable().default(null),
  /** What ROUANG actually did on this project. */
  scope: z.array(z.string()).min(1),
  summary: z.string(),
  standfirst: z.string().nullable().default(null),
  area: z.string().nullable().default(null),
  client: z.string().nullable().default(null),
  photography: z
    .strictObject({ credit: z.string().nullable().default(null), permissionConfirmed: z.boolean().default(false) })
    .default({ credit: null, permissionConfirmed: false }),
  hero: z.union([image, pendingImage]).nullable().default(null),
  /** The picture used for this project in listings, so a listing never repeats the case-study opener. */
  card: z.union([image, pendingImage]).nullable().default(null),
  /**
   * Silent loop of real footage from the project, opening the case study. Never AI-generated.
   * `wide` plays on screens 1024 px and wider, `narrow` below; with only one of them, the other
   * screens keep the opening photograph. `source` records which footage it was cut from.
   */
  film: z
    .strictObject({
      wide: filmClip.optional(),
      narrow: filmClip.optional(),
      caption: z.string().optional(),
      source: z.string(),
    })
    .refine((f) => f.wide || f.narrow, "Give the film a wide clip, a narrow clip or both")
    .nullable()
    .default(null),
  /** Further short loops of real footage, shown together as a band in the case study. */
  loops: z.array(filmClip.extend({ alt: z.string().min(3), caption: z.string().optional(), source: z.string() })).default([]),
  /** Renders or perspectives rather than photographs of the finished space. Always labelled as such. */
  visualisation: z.boolean().default(false),
  brief: z.string().nullable().default(null),
  concept: z.string().nullable().default(null),
  planning: z.string().nullable().default(null),
  materials: z.array(z.strictObject({ name: z.string(), note: z.string() })).default([]),
  lighting: z.string().nullable().default(null),
  challenges: z.array(z.strictObject({ constraint: z.string(), response: z.string() })).default([]),
  quote: z.strictObject({ text: z.string(), attribution: z.string(), approved: z.boolean() }).nullable().default(null),
  gallery: z.array(galleryItem).default([]),
  services: z.array(slug).default([]),
  facts: z.array(fact).default([]),
  seo,
  /** Open items for the studio. Shown on the preview checklist, never on the public page. */
  todo: z.array(z.string()).default([]),
});

export const serviceSchema = z.strictObject({
  title: z.string(),
  status,
  sector: z.enum(["residential", "commercial"]),
  navLabel: z.string(),
  order: z.number().default(100),
  kicker: z.string(),
  headline: z.string(),
  headlineItalic: z.string(),
  summary: z.string(),
  audience: z.array(z.string()).min(1),
  offers: z.array(z.strictObject({ title: z.string(), body: z.string(), confirmed: z.boolean() })).min(1),
  projectTypes: z.array(z.string()).default([]),
  faqs: z.array(z.strictObject({ q: z.string(), a: z.string(), confirmed: z.boolean() })).default([]),
  relatedProjects: z.array(slug).default([]),
  /** A photograph from one of the studio's projects, shown only while that project is live. */
  feature: z.strictObject({ project: slug, image: z.string() }).nullable().default(null),
  primaryKeyword: z.string(),
  seo,
  todo: z.array(z.string()).default([]),
});

export const insightSchema = z.strictObject({
  title: z.string(),
  status,
  description: z.string().max(170),
  category: z.enum([
    "Choosing a designer",
    "Restaurants and hospitality",
    "Costs and budgeting",
    "Materials, finishes and lighting",
    "Space planning",
    "Design process",
  ]),
  publishedAt: isoDate,
  updatedAt: isoDate.optional(),
  author: z.string().default("ROUANG Studio"),
  /** Editorial intent, kept with the article so its job is never forgotten. */
  purpose: z.string(),
  audience: z.string(),
  searchIntent: z.string(),
  relatedServices: z.array(slug).default([]),
  relatedProjects: z.array(slug).default([]),
  sources: z.array(z.strictObject({ title: z.string(), url: z.string().url() })).default([]),
  seo,
  todo: z.array(z.string()).default([]),
});

export type Image = z.infer<typeof image>;
export type PendingImage = z.infer<typeof pendingImage>;
export type GalleryItem = z.infer<typeof galleryItem>;
export type ProjectData = z.infer<typeof projectSchema>;
export type ServiceData = z.infer<typeof serviceSchema>;
export type InsightData = z.infer<typeof insightSchema>;

export function isPending(img: Image | PendingImage | null | undefined): img is PendingImage {
  return !!img && "pending" in img;
}

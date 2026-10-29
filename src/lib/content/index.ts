import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { cacheLife } from "next/cache";
import type { z } from "zod";
import { SHOW_DRAFTS } from "@/lib/env";
import { renderMarkdown, type Heading } from "./markdown";
import {
  insightSchema,
  projectSchema,
  serviceSchema,
  type Image,
  type InsightData,
  type PendingImage,
  type ProjectData,
  type ServiceData,
} from "./schema";

const CONTENT_DIR = path.join(process.cwd(), "content");

type Entry<T> = T & {
  slug: string;
  html: string;
  headings: Heading[];
  readingMinutes: number;
  isDraft: boolean;
};

export type Project = Entry<ProjectData>;
export type Service = Entry<ServiceData>;
export type Insight = Entry<InsightData>;

async function loadCollection<S extends z.ZodTypeAny>(dir: string, schema: S): Promise<Entry<z.infer<S>>[]> {
  const folder = path.join(CONTENT_DIR, dir);
  const files = (await fs.readdir(folder)).filter((f) => f.endsWith(".md") && !f.startsWith("_"));

  const entries = await Promise.all(
    files.map(async (file) => {
      const raw = await fs.readFile(path.join(folder, file), "utf8");
      let data: Record<string, unknown>;
      let content: string;
      try {
        ({ data, content } = matter(raw));
      } catch (err) {
        throw new Error(`Could not read the frontmatter in content/${dir}/${file}. Put values containing ": " in quotes.\n${(err as Error).message}`);
      }
      const parsed = schema.safeParse(data);
      if (!parsed.success) {
        const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`).join("\n");
        throw new Error(`Invalid frontmatter in content/${dir}/${file}:\n${issues}`);
      }
      const value = parsed.data as z.infer<S> & { status: "draft" | "published"; placeholder?: boolean };
      if (value.placeholder && value.status === "published") {
        throw new Error(`content/${dir}/${file} is a layout placeholder and cannot be published.`);
      }
      const { html, headings, words } = renderMarkdown(content.trim());
      return {
        ...value,
        slug: file.replace(/\.md$/, ""),
        html,
        headings,
        readingMinutes: Math.max(1, Math.round(words / 220)),
        isDraft: value.status !== "published",
      };
    }),
  );

  return entries.filter((e) => SHOW_DRAFTS || !e.isDraft);
}

/**
 * Params for generateStaticParams. With Cache Components the list must never be empty, and in
 * production a collection can be (everything still in draft). The sentinel slug renders notFound()
 * and never appears in the sitemap, the pattern Next's own docs give for this case.
 */
export const NO_ENTRIES_SLUG = "__none";

export function staticSlugs(entries: { slug: string }[]) {
  return entries.length ? entries.map((e) => ({ slug: e.slug })) : [{ slug: NO_ENTRIES_SLUG }];
}

/** Drop media that may not appear on the live site: pending shots and unlicensed provisional imagery. */
export function publicImage<T extends Image | PendingImage | null>(img: T): T | null {
  if (!img) return null;
  if ("pending" in img) return SHOW_DRAFTS ? img : null;
  if (img.provisional && !SHOW_DRAFTS) return null;
  return img;
}

/**
 * A named photograph from a project's gallery ("rembayung-long-hall"), only if that project is
 * visible in this environment and the photograph is cleared. Used wherever a page borrows a
 * project's imagery, so nothing from an unpublished project can leak onto a live page.
 */
export function projectImage(project: Project | null | undefined, file: string): Image | null {
  const item = project?.gallery.find((g) => !("pending" in g) && g.src.endsWith(`/${file}.jpg`));
  const img = item ? publicImage(item) : null;
  return img && !("pending" in img) ? img : null;
}

export async function getProjects(): Promise<Project[]> {
  "use cache";
  cacheLife("max");
  const all = await loadCollection("projects", projectSchema);
  return all.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

export async function getProject(slug: string): Promise<Project | null> {
  "use cache";
  cacheLife("max");
  return (await getProjects()).find((p) => p.slug === slug) ?? null;
}

export async function getServices(): Promise<Service[]> {
  "use cache";
  cacheLife("max");
  const all = await loadCollection("services", serviceSchema);
  return all.sort((a, b) => a.order - b.order);
}

export async function getService(slug: string): Promise<Service | null> {
  "use cache";
  cacheLife("max");
  return (await getServices()).find((s) => s.slug === slug) ?? null;
}

export async function getInsights(): Promise<Insight[]> {
  "use cache";
  cacheLife("max");
  const all = await loadCollection("insights", insightSchema);
  return all.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export async function getInsight(slug: string): Promise<Insight | null> {
  "use cache";
  cacheLife("max");
  return (await getInsights()).find((i) => i.slug === slug) ?? null;
}

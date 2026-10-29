import { getProject, getProjects, publicImage, staticSlugs } from "@/lib/content";
import { asJpeg, brandCard, OG_SIZE } from "@/lib/og";

export const alt = "ROUANG project";
export const size = OG_SIZE;
export const contentType = "image/jpeg";

export async function generateStaticParams() {
  return staticSlugs(await getProjects());
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getProject(slug);
  const img = p ? publicImage(p.card ?? p.hero) : null;
  return asJpeg(
    await brandCard({
      // A render on a share card must say what it is, just as it does on the page.
      kicker: p ? [p.type, p.location, p.visualisation ? "Design proposal" : null].filter(Boolean).join(" · ") : "Project",
      title: p ? p.title : "ROUANG",
      italic: p ? (p.visualisation ? "Design proposal by ROUANG" : "Interior design by ROUANG") : undefined,
      image: img && !("pending" in img) ? img.src : null,
    }),
  );
}

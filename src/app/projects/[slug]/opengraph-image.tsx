import { getProject, getProjects, publicImage } from "@/lib/content";
import { brandCard, OG_SIZE } from "@/lib/og";

export const alt = "ROUANG project";
export const size = OG_SIZE;
export const contentType = "image/png";

export async function generateStaticParams() {
  return (await getProjects()).map((p) => ({ slug: p.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getProject(slug);
  const hero = p ? publicImage(p.hero) : null;
  return brandCard({
    kicker: p ? [p.type, p.location].filter(Boolean).join(" · ") : "Project",
    title: p ? p.title : "ROUANG",
    italic: p ? "Interior design by ROUANG" : undefined,
    image: hero && !("pending" in hero) ? hero.src : null,
  });
}

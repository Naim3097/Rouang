import { getInsight, getInsights, staticSlugs } from "@/lib/content";
import { asJpeg, brandCard, OG_SIZE } from "@/lib/og";

export const alt = "ROUANG insights";
export const size = OG_SIZE;
export const contentType = "image/jpeg";

export async function generateStaticParams() {
  return staticSlugs(await getInsights());
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = await getInsight(slug);
  return asJpeg(await brandCard({ kicker: a ? `Insights · ${a.category}` : "Insights", title: a ? a.title : "Insights" }));
}

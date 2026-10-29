import { getInsight, getInsights } from "@/lib/content";
import { brandCard, OG_SIZE } from "@/lib/og";

export const alt = "ROUANG insights";
export const size = OG_SIZE;
export const contentType = "image/png";

export async function generateStaticParams() {
  return (await getInsights()).map((a) => ({ slug: a.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = await getInsight(slug);
  return brandCard({ kicker: a ? `Insights · ${a.category}` : "Insights", title: a ? a.title : "Insights" });
}

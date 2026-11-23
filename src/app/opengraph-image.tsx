import { studio } from "@/config/studio";
import { asJpeg, brandCard, OG_SIZE } from "@/lib/og";

export const alt = `ROUANG, ${studio.descriptor.toLowerCase()}`;
export const size = OG_SIZE;
export const contentType = "image/jpeg";

export default async function Image() {
  return asJpeg(await brandCard({ kicker: studio.descriptor, title: studio.line.lead, follow: studio.line.follow }));
}

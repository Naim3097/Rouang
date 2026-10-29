import { brandCard, OG_SIZE } from "@/lib/og";

export const alt = "ROUANG, interior design studio";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return brandCard({ kicker: "Interior design studio", title: "Tell us how you want to live.", italic: "We'll translate it into space." });
}

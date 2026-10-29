import type { MetadataRoute } from "next";
import { IS_PRODUCTION } from "@/lib/env";
import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  if (!IS_PRODUCTION) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/preview"] }],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}

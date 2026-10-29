import type { NextConfig } from "next";

const isProduction = (process.env.VERCEL_ENV ?? process.env.SITE_ENV) === "production";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  env: {
    BUILD_YEAR: String(new Date().getFullYear()),
  },
  // Content is read from /content at build time and for any page rendered on demand.
  outputFileTracingIncludes: {
    "/**": ["./content/**/*"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [70, 78, 85],
    deviceSizes: [640, 828, 1080, 1280, 1600, 1920, 2560],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    const headers = [{ source: "/:path*", headers: securityHeaders }];
    // Belt and braces: nothing outside production is indexable, even if a page forgets.
    if (!isProduction) {
      headers.push({ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] });
    }
    return headers;
  },
};

export default nextConfig;

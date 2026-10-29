import type { NextConfig } from "next";

// SITE_ENV, when set, wins over Vercel's own environment, so a pre-launch site can run on the
// production deployment as a noindexed preview (see README, "Deploy to Vercel").
const isProduction = (process.env.SITE_ENV ?? process.env.VERCEL_ENV) === "production";

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
  // Lets a production-mode check build into its own folder without disturbing a running server.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  env: {
    BUILD_YEAR: String(new Date().getFullYear()),
  },
  // Content is read from /content at build time and for any page rendered on demand.
  outputFileTracingIncludes: {
    "/**": ["./content/**/*"],
    // Share cards read their fonts and the project photograph from disk when they are requested,
    // so those files have to travel with the function (public/ is not part of a server bundle).
    "/**/opengraph-image*": [
      "./node_modules/@fontsource/outfit/files/outfit-latin-{400,500}-normal.woff",
      "./node_modules/@fontsource/eb-garamond/files/eb-garamond-latin-400-italic.woff",
      "./public/images/projects/**/*.jpg",
    ],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [78, 85],
    // Sources are exported at most 2400 px wide, so nothing larger than 1920 is ever needed.
    deviceSizes: [640, 828, 1080, 1280, 1600, 1920],
    // Optimised images are kept for 31 days. A replaced photograph gets a new file name.
    minimumCacheTTL: 2678400,
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

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ROUANG",
    short_name: "ROUANG",
    description: "Interior design studio for homes and businesses.",
    start_url: "/",
    display: "browser",
    background_color: "#141414",
    theme_color: "#141414",
    icons: [
      { src: "/brand/rouang-app-icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/rouang-app-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}

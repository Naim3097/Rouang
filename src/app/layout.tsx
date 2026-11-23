import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import { Analytics } from "@/components/layout/Analytics";
import { MobileActionBar } from "@/components/layout/MobileActionBar";
import { PreviewBar } from "@/components/layout/PreviewBar";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { JsonLd } from "@/components/ui/JsonLd";
import { studio, whatsappHref } from "@/config/studio";
import { GA_MEASUREMENT_ID, GOOGLE_SITE_VERIFICATION, IS_PRODUCTION, SHOW_NOTES, SITE_URL } from "@/lib/env";
import { liveNav } from "@/lib/nav";
import { organizationSchema, websiteSchema } from "@/lib/schema";
// Lenis's own rules (SmoothScroll), before the site's so the site can override them.
import "lenis/dist/lenis.css";
import "./globals.css";

/* Outfit is the brand's one typeface (kit p.11). It loads as a single variable font, so every weight
   the site uses (Light 300, Regular 400, and Medium 500 for emphasis) is a real cut, never a faux bold. */
const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: "ROUANG",
  title: { default: `ROUANG · ${studio.descriptor}`, template: "%s · ROUANG" },
  description: studio.positioning,
  formatDetection: { telephone: false, email: false, address: false },
  robots: IS_PRODUCTION ? undefined : { index: false, follow: false },
  ...(GOOGLE_SITE_VERIFICATION ? { verification: { google: GOOGLE_SITE_VERIFICATION } } : {}),
};

export const viewport: Viewport = {
  themeColor: "#141414",
  colorScheme: "light",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const nav = await liveNav();
  const whatsapp = whatsappHref("Hello ROUANG, I'd like to talk about a project.");
  return (
    <html lang="en-MY" data-scroll-behavior="smooth" className={outfit.variable} suppressHydrationWarning>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <SiteHeader whatsapp={whatsapp} nav={nav} />
        {/* No page-wide crossfade: it ran after hydration on every load and held the first paint.
            Project images still morph between pages through their own named transitions. */}
        <main id="main" tabIndex={-1} className="outline-none">
          {children}
        </main>
        <SiteFooter nav={nav} />
        <MobileActionBar whatsapp={whatsapp} />
        <SmoothScroll />
        <Analytics measurementId={IS_PRODUCTION ? GA_MEASUREMENT_ID : null} />
        {SHOW_NOTES ? <PreviewBar /> : null}
        <JsonLd data={[organizationSchema(), websiteSchema()]} />
      </body>
    </html>
  );
}

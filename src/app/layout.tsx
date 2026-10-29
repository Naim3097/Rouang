import type { Metadata, Viewport } from "next";
import { EB_Garamond, Outfit } from "next/font/google";
import { ViewTransition } from "react";
import { Analytics } from "@/components/layout/Analytics";
import { MobileActionBar } from "@/components/layout/MobileActionBar";
import { PreviewBar } from "@/components/layout/PreviewBar";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { JsonLd } from "@/components/ui/JsonLd";
import { RevealObserver } from "@/components/ui/RevealObserver";
import { studio, whatsappHref } from "@/config/studio";
import { GA_MEASUREMENT_ID, GOOGLE_SITE_VERIFICATION, IS_PRODUCTION, SITE_URL } from "@/lib/env";
import { organizationSchema, websiteSchema } from "@/lib/schema";
import "./globals.css";

/* Outfit is the working voice of the brand; Medium for display, Regular for interface (kit p.11). */
const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

/* EB Garamond, italic 400 only, used sparingly (kit p.12). */
const garamond = EB_Garamond({
  subsets: ["latin"],
  style: ["italic"],
  weight: ["400"],
  variable: "--font-garamond",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: "ROUANG",
  title: { default: "ROUANG · Interior design studio", template: "%s · ROUANG" },
  description: studio.positioning,
  formatDetection: { telephone: false, email: false, address: false },
  robots: IS_PRODUCTION ? undefined : { index: false, follow: false },
  ...(GOOGLE_SITE_VERIFICATION ? { verification: { google: GOOGLE_SITE_VERIFICATION } } : {}),
};

export const viewport: Viewport = {
  themeColor: "#141414",
  colorScheme: "light",
};

/*
 * Motion is progressive enhancement. This runs before paint and marks the document as able to
 * animate; if the client bundle has not taken over within four seconds, the mark is removed so
 * nothing stays hidden.
 */
const motionBoot = `(function(d){d.documentElement.classList.add('js');setTimeout(function(){if(!window.__rouangReveal){d.documentElement.classList.remove('js')}},4000)})(document)`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  const whatsapp = whatsappHref("Hello ROUANG, I'd like to talk about a project.");
  return (
    <html lang="en-MY" className={`${outfit.variable} ${garamond.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: motionBoot }} />
      </head>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <SiteHeader whatsapp={whatsapp} />
        <ViewTransition>
          <main id="main" tabIndex={-1} className="outline-none">
            {children}
          </main>
        </ViewTransition>
        <SiteFooter />
        <MobileActionBar whatsapp={whatsapp} />
        <RevealObserver />
        <Analytics measurementId={IS_PRODUCTION ? GA_MEASUREMENT_ID : null} />
        {!IS_PRODUCTION ? <PreviewBar /> : null}
        <JsonLd data={[organizationSchema(), websiteSchema()]} />
      </body>
    </html>
  );
}

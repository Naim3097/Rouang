import Link from "next/link";
import { Wordmark } from "@/components/brand/Brand";
import { legalNav, primaryNav } from "@/config/navigation";
import { areaLabel, studio, telHref, whatsappHref } from "@/config/studio";
import { ConsentSettingsButton } from "./Analytics";
import { ContactLink } from "./ContactLink";

/** Footer carries the tagline lockup, as the kit assigns it (p.5: "Covers, hoardings, website footer"). */
export function SiteFooter() {
  const wa = whatsappHref("Hello ROUANG, I'd like to talk about a project.");
  const tel = telHref();
  const year = process.env.BUILD_YEAR;

  return (
    <footer data-tone="dark" className="relative overflow-hidden">
      <div className="page-x pt-24 sm:pt-32">
        <div className="page-grid gap-y-14">
          <div className="col-span-12 lg:col-span-5">
            <p className="t-italic-display text-[clamp(2rem,1.4rem+2vw,3.25rem)] text-kapur" lang="ms">
              Ruang tanpa batas.
            </p>
            <p className="t-caption mt-3 text-mouse">Space without limits.</p>
          </div>

          <nav aria-label="Footer" className="col-span-6 sm:col-span-4 lg:col-span-2 lg:col-start-7">
            <p className="t-label mb-5 text-mouse">Navigate</p>
            <ul className="space-y-2.5">
              {primaryNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="link-reveal">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="col-span-6 sm:col-span-4 lg:col-span-2">
            <p className="t-label mb-5 text-mouse">Talk to us</p>
            <ul className="space-y-2.5">
              <li>
                <Link href="/contact" className="link-reveal">
                  Project enquiry
                </Link>
              </li>
              {wa ? (
                <li>
                  <ContactLink href={wa} kind="whatsapp" location="footer" className="link-reveal">
                    WhatsApp
                  </ContactLink>
                </li>
              ) : null}
              {studio.contact.email ? (
                <li>
                  <ContactLink href={`mailto:${studio.contact.email}`} kind="email" location="footer" className="link-reveal">
                    {studio.contact.email}
                  </ContactLink>
                </li>
              ) : null}
              {tel ? (
                <li>
                  <ContactLink href={tel} kind="phone" location="footer" className="link-reveal">
                    {studio.contact.phone}
                  </ContactLink>
                </li>
              ) : null}
            </ul>
          </div>

          <div className="col-span-12 sm:col-span-4 lg:col-span-2">
            <p className="t-label mb-5 text-mouse">Studio</p>
            <p className="text-kapur/85">Interior design for homes and businesses in {areaLabel()}.</p>
            {studio.address ? (
              <address className="mt-4 not-italic text-kapur/85">
                {studio.address.street}
                <br />
                {studio.address.postalCode} {studio.address.locality}, {studio.address.region}
              </address>
            ) : null}
          </div>
        </div>

        {/* Tagline lockup: the wordmark with RUANG TANPA BATAS set to its width. */}
        <div className="mt-24 sm:mt-36 [container-type:inline-size]">
          <Wordmark className="h-auto w-full text-kapur" title="ROUANG, Ruang tanpa batas" />
          <p
            aria-hidden="true"
            lang="ms"
            className="mt-[1.6cqw] text-[2.05cqw] uppercase leading-none tracking-[0.62em] text-mouse [text-align-last:justify] [text-align:justify]"
          >
            Ruang tanpa batas
          </p>
        </div>

        <div className="t-caption mt-14 flex flex-col gap-4 border-t border-kapur/12 py-7 text-mouse sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {studio.legalName ?? studio.name}
            {studio.registrationNo ? ` (${studio.registrationNo})` : ""}. All rights reserved.
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {legalNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="link-reveal">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <ConsentSettingsButton className="link-reveal" />
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

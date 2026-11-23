import Link from "next/link";
import { Wordmark } from "@/components/brand/Brand";
import { legalNav } from "@/config/navigation";
import type { NavItem } from "@/lib/nav";
import { addressLines, studio, telHref, whatsappHref } from "@/config/studio";
import { GA_MEASUREMENT_ID, IS_PRODUCTION } from "@/lib/env";
import { ConsentSettingsButton } from "./Analytics";
import { ContactLink } from "./ContactLink";

/** Footer carries the tagline lockup, as the kit assigns it (p.5: "Covers, hoardings, website footer"). */
export function SiteFooter({ nav }: { nav: NavItem[] }) {
  const wa = whatsappHref("Hello ROUANG, I'd like to talk about a project.");
  const tel = telHref();
  const year = process.env.BUILD_YEAR;
  const address = addressLines();
  const social = [
    { label: "Instagram", href: studio.social.instagram },
    { label: "Facebook", href: studio.social.facebook },
    { label: "TikTok", href: studio.social.tiktok },
    { label: "LinkedIn", href: studio.social.linkedin },
  ].filter((s): s is { label: string; href: string } => !!s.href);

  return (
    <footer data-tone="dark" className="relative overflow-hidden border-t border-kapur/10">
      <div className="page-x pt-24 sm:pt-32">
        <div className="page-grid gap-y-14">
          <div className="col-span-12 lg:col-span-4">
            {/* The tagline lives in the lockup below; the footer opens with the company's own line. */}
            <p className="t-title max-w-[24rem] text-kapur">
              {studio.line.lead}
              <span className="t-follow block text-kapur/70">{studio.line.follow}</span>
            </p>
            <p className="mt-6 max-w-[24rem] text-kapur/70">{studio.descriptor} for homes and businesses.</p>
          </div>

          <nav aria-label="Footer" className="col-span-6 sm:col-span-3 lg:col-span-2 lg:col-start-6">
            <p className="t-label mb-5 text-mouse">Navigate</p>
            <ul className="space-y-2.5">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="link-fade">
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
                <Link href="/contact" className="link-fade">
                  Project enquiry
                </Link>
              </li>
              {wa ? (
                <li>
                  <ContactLink href={wa} kind="whatsapp" location="footer" className="link-fade">
                    WhatsApp
                  </ContactLink>
                </li>
              ) : null}
              {studio.contact.email ? (
                <li>
                  {/* Where the column is too narrow for the whole address (a small phone), it breaks after
                      the @, never in the middle of a word. */}
                  <ContactLink href={`mailto:${studio.contact.email}`} kind="email" location="footer" className="link-fade [overflow-wrap:anywhere]">
                    {studio.contact.email.split("@")[0]}@<wbr />
                    {studio.contact.email.split("@").slice(1).join("@")}
                  </ContactLink>
                </li>
              ) : null}
              {tel ? (
                <li>
                  <ContactLink href={tel} kind="phone" location="footer" className="link-fade">
                    {studio.contact.phone}
                  </ContactLink>
                </li>
              ) : null}
            </ul>
            {social.length ? (
              // One per line, like the links above: a narrow column would otherwise break the row unevenly.
              <ul className="mt-6 space-y-2.5" aria-label="ROUANG on social media">
                {social.map((s) => (
                  <li key={s.label}>
                    <a href={s.href} className="link-fade">
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="col-span-12 sm:col-span-5 lg:col-span-3">
            <p className="t-label mb-5 text-mouse">Office</p>
            {address ? (
              <address className="not-italic text-kapur/85">
                {address.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
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
            className="mt-[1.6cqw] hidden text-[2.05cqw] uppercase leading-none tracking-[0.62em] text-mouse [text-align-last:justify] [text-align:justify] sm:block"
          >
            Ruang tanpa batas
          </p>
        </div>

        <div className="t-caption mt-14 flex flex-col gap-4 border-t border-kapur/12 pb-28 pt-7 text-mouse lg:flex-row lg:items-start lg:justify-between lg:pb-7">
          <div className="space-y-1">
            <p>
              © {year} {studio.legalName}. All rights reserved.
            </p>
            {studio.registrationNo || studio.cidbRegistrationNo ? (
              <p>
                {[
                  studio.registrationNo ? `SSM registration no. ${studio.registrationNo}` : null,
                  studio.cidbRegistrationNo ? `CIDB registration no. ${studio.cidbRegistrationNo}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            ) : null}
          </div>
          {/* Set in Mouse Grey like the line beside them, so on hover they come up to Milky White. */}
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {legalNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition-colors duration-300 hover:text-kapur">
                  {item.label}
                </Link>
              </li>
            ))}
            {/* Only where analytics can actually load, so the button always does something. */}
            {IS_PRODUCTION && GA_MEASUREMENT_ID ? (
              <li>
                <ConsentSettingsButton className="transition-colors duration-300 hover:text-kapur" />
              </li>
            ) : null}
          </ul>
        </div>
      </div>
    </footer>
  );
}

import Image from "next/image";
import Link from "next/link";
import { Wordmark } from "@/components/brand/Brand";
import { placeholderImagery } from "@/config/media";
import { legalNav } from "@/config/navigation";
import { addressLines, studio, telHref, whatsappHref } from "@/config/studio";
import { publicImage } from "@/lib/content";
import type { Image as ImageData } from "@/lib/content/schema";
import { GA_MEASUREMENT_ID, IS_PRODUCTION } from "@/lib/env";
import type { NavItem } from "@/lib/nav";
import { ConsentSettingsButton } from "./Analytics";
import { ContactLink } from "./ContactLink";

/**
 * The footer stands on a full-bleed photograph of a warm, sunlit room, after the client's reference
 * (round 7b): the wordmark set small with the company's line under it, then Navigate, Talk to us and
 * Office, then a hairline and the legal lines. A shade over the photograph keeps every word legible
 * (styles/layout/footer.css). The photograph is temporary, so production has none: there the same
 * layout stands on Chinese Black.
 */
export function SiteFooter({ nav }: { nav: NavItem[] }) {
  const photo: ImageData | null = publicImage(placeholderImagery.footerRoom);
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
    <footer data-tone="dark" data-photo={photo ? "" : undefined} className="site-footer relative isolate overflow-hidden bg-ink text-kapur">
      {photo ? (
        // Atmosphere only, behind the words: it names nothing, so it is hidden from assistive technology.
        // On every page and always below the fold, so it loads late and never competes with a page's own picture.
        <div className="site-footer-photo" aria-hidden="true">
          <Image
            src={photo.src}
            alt=""
            fill
            sizes="100vw"
            quality={78}
            loading="lazy"
            className="object-cover"
            style={{ objectPosition: photo.focus ?? "50% 50%" }}
          />
        </div>
      ) : null}

      <div className="site-footer-body page-x">
        <div className="site-footer-grid">
          <div className="site-footer-brand">
            <Wordmark className="h-auto w-[8.75rem]" title="ROUANG" />
            <p className="mt-5">
              {studio.descriptor}
              <br /> for homes and businesses.
            </p>
          </div>

          <nav aria-label="Footer">
            <p className="site-footer-label t-label">Navigate</p>
            <ul className="site-footer-list t-meta">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="link-fade">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="site-footer-label t-label">Talk to us</p>
            <ul className="site-footer-list t-meta">
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
                  {/* Where the column is too narrow for the whole address, it breaks after the @, never
                      in the middle of a word. */}
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
              // By name, one per line, as in the reference.
              <ul className="site-footer-list t-meta mt-5" aria-label="ROUANG on social media">
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

          <div className="site-footer-office">
            <p className="site-footer-label t-label">Office</p>
            {address ? (
              <address className="t-meta not-italic">
                {address.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
            ) : null}
          </div>
        </div>

        <div className="site-footer-legal t-caption">
          <div>
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
          {/* Set in the quieter tone of the lines beside them; on hover they come up to Milky White. */}
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

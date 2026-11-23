import type { Metadata } from "next";
import { EnquiryForm } from "@/components/contact/EnquiryForm";
import { ContactLink } from "@/components/layout/ContactLink";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { SocialLinks } from "@/components/ui/SocialLinks";
import { TitlePair } from "@/components/ui/Typography";
import { addressLines, studio, telHref, whatsappHref } from "@/config/studio";
import { TURNSTILE_SITE_KEY } from "@/lib/env";
import { pageMetadata } from "@/lib/seo";

export const ensureStatic = "navigation";

export const metadata: Metadata = pageMetadata({
  title: "Contact: discuss your project",
  description:
    "Tell ROUANG about your home or business project. Send a short enquiry, email or call, or find the office in Bandar Tropicana, Telok Panglima Garang, Selangor.",
  path: "/contact",
});

/*
 * Round 7b: the page is the form and the few details a visitor needs to reach the company another
 * way, under the centred opening the Services, Work and About pages share. The company's
 * registration lines are in the footer, the process is on Services and About, and the social
 * accounts are icons (SocialLinks) instead of names and handles.
 */
export default function ContactPage() {
  const wa = whatsappHref("Hello ROUANG, I'd like to talk about a project.");
  const tel = telHref();
  const email = studio.contact.email;
  const address = addressLines();
  return (
    <section data-tone="light" className="bg-kapur text-ink" aria-labelledby="contact-title">
      <div className="page-x pb-[var(--section-space)] pt-[calc(var(--header-h)+3rem)]">
        <Breadcrumbs items={[{ name: "Contact", href: "/contact" }]} />
        <div className="mx-auto mt-10 flex max-w-[62rem] flex-col items-center text-center sm:mt-12">
          <TitlePair
            as="h1"
            id="contact-title"
            size="hero"
            eyebrow="Project enquiry"
            lead="Start with a few lines."
            follow="The first conversation follows."
          />
          {/* Two sentences, set as two lines where there is room for the first on its own. */}
          <p className="t-sub mt-8 max-w-[34rem] text-ink-soft">
            Tell us what the space is and what you&rsquo;d like to change. <span className="sm:block">Photos can come later.</span>
          </p>
        </div>

        {/* The form, then the other ways in: side by side from 64rem on the Services measure
            (contact.css), the form first everywhere, so on a phone it follows the opening. */}
        <div className="contact-body page-grid mt-14 sm:mt-16">
          <div className="col-span-12 lg:col-span-7">
            <h2 className="visually-hidden">Send an enquiry</h2>
            <EnquiryForm detailsOpen turnstileSiteKey={TURNSTILE_SITE_KEY} location="contact" />
          </div>

          <aside aria-labelledby="contact-direct-title" className="contact-direct col-span-12 lg:col-span-4 lg:col-start-9">
            <div>
              <h2 id="contact-direct-title" className="t-label text-ink-muted">
                Or contact us directly
              </h2>
              {email || tel || wa ? (
                <ul className="t-title mt-5 space-y-2">
                  {email ? (
                    <li>
                      {/* Where the column is too narrow for the whole address, it breaks after the @. */}
                      <ContactLink href={`mailto:${email}`} kind="email" location="contact" className="link-fade [overflow-wrap:anywhere]">
                        {email.split("@")[0]}@<wbr />
                        {email.split("@").slice(1).join("@")}
                      </ContactLink>
                    </li>
                  ) : null}
                  {tel ? (
                    <li>
                      <ContactLink href={tel} kind="phone" location="contact" className="link-fade whitespace-nowrap">
                        {studio.contact.phone}
                      </ContactLink>
                    </li>
                  ) : null}
                  {wa ? (
                    <li>
                      <ContactLink href={wa} kind="whatsapp" location="contact" className="link-fade">
                        WhatsApp
                      </ContactLink>
                    </li>
                  ) : null}
                </ul>
              ) : null}
              <SocialLinks className="mt-4 -ml-[0.6875rem]" />
            </div>

            {address ? (
              <div>
                <h3 className="t-label text-ink-muted">Office</h3>
                <address className="mt-5 not-italic text-ink-soft">
                  {address.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </address>
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </section>
  );
}

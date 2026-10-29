import type { Metadata } from "next";
import { Mark } from "@/components/brand/Brand";
import { EnquiryForm } from "@/components/contact/EnquiryForm";
import { ContactLink } from "@/components/layout/ContactLink";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Label } from "@/components/ui/Typography";
import { areaLabel, studio, telHref, whatsappHref } from "@/config/studio";
import { TURNSTILE_SITE_KEY } from "@/lib/env";
import { pageMetadata } from "@/lib/seo";

export const ensureStatic = "navigation";

export const metadata: Metadata = pageMetadata({
  title: "Contact: discuss your interior design project",
  description:
    "Tell ROUANG about your home, restaurant or café. Send a short enquiry and the studio will reply to arrange a first conversation.",
  path: "/contact",
});

const steps = [
  ["Send a few lines", "What the space is, where it is and what you would like to change. Photos can come later."],
  ["We reply", "The studio gets back to you to arrange a first conversation about the project."],
  ["Agree the scope", "If we are the right fit, we set out what the design will cover before any work starts."],
];

export default function ContactPage() {
  const wa = whatsappHref("Hello ROUANG, I'd like to talk about a project.");
  const tel = telHref();
  return (
    <section data-tone="light" className="bg-kapur text-ink">
      <div className="page-x pb-[var(--section-space)] pt-[calc(var(--header-h)+3rem)]">
        <Breadcrumbs items={[{ name: "Contact", href: "/contact" }]} />
        <div className="page-grid mt-16 gap-y-16 sm:mt-24">
          <div className="col-span-12 lg:col-span-5">
            <Label className="text-ink-muted">Project enquiry</Label>
            <h1 className="t-headline-hero mt-8">
              <span className="block">Start with a few lines.</span>
              <span className="t-italic-display mt-[0.06em] block text-[1.08em] text-rikyu">The first conversation follows.</span>
            </h1>
            <p lang="ms" className="t-quote mt-8 text-ink-muted">
              Anda cerita macam mana nak duduk. Kami terjemah jadi ruang.
            </p>

            <ol className="mt-14 border-t border-ink/15">
              {steps.map(([title, body], i) => (
                <li key={title} className="grid grid-cols-[2.5rem_1fr] gap-4 border-b border-ink/15 py-5">
                  <span className="t-label pt-1 tabular-nums text-ink-muted">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <p className="font-medium">{title}</p>
                    <p className="mt-1 text-[0.9375rem] text-ink-soft">{body}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-14 space-y-6">
              {wa || studio.contact.email || tel ? (
                <div>
                  <p className="t-label text-ink-muted">Prefer to talk directly?</p>
                  <ul className="mt-4 space-y-2">
                    {wa ? (
                      <li>
                        <ContactLink href={wa} kind="whatsapp" location="contact" className="link-line">
                          WhatsApp the studio
                        </ContactLink>
                      </li>
                    ) : null}
                    {studio.contact.email ? (
                      <li>
                        <ContactLink href={`mailto:${studio.contact.email}`} kind="email" location="contact" className="link-line">
                          {studio.contact.email}
                        </ContactLink>
                      </li>
                    ) : null}
                    {tel ? (
                      <li>
                        <ContactLink href={tel} kind="phone" location="contact" className="link-line">
                          {studio.contact.phone}
                        </ContactLink>
                      </li>
                    ) : null}
                  </ul>
                </div>
              ) : null}
              <div>
                <p className="t-label text-ink-muted">Where we work</p>
                <p className="mt-3 text-ink-soft">Homes and businesses in {areaLabel()}.</p>
                {studio.address ? (
                  <address className="mt-3 not-italic text-ink-soft">
                    {studio.address.street}
                    <br />
                    {studio.address.postalCode} {studio.address.locality}, {studio.address.region}
                  </address>
                ) : null}
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-6 lg:col-start-7">
            <div className="relative rounded-[2px] border border-ink/15 bg-kapur p-6 sm:p-10">
              <Mark className="absolute right-6 top-6 h-5 w-5 text-ink/40 sm:right-10 sm:top-10" />
              <h2 className="t-sub pr-10">Project enquiry</h2>
              <p className="t-caption mt-2 text-ink-muted">Only your name, a way to reply and a few lines are needed.</p>
              <div className="mt-10">
                <EnquiryForm detailsOpen turnstileSiteKey={TURNSTILE_SITE_KEY} location="contact" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import type { Metadata } from "next";
import { Mark } from "@/components/brand/Brand";
import { EnquiryForm } from "@/components/contact/EnquiryForm";
import { ContactLink } from "@/components/layout/ContactLink";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Label } from "@/components/ui/Typography";
import { addressLines, areaLabel, studio, telHref, whatsappHref } from "@/config/studio";
import { TURNSTILE_SITE_KEY } from "@/lib/env";
import { pageMetadata } from "@/lib/seo";

export const ensureStatic = "navigation";

export const metadata: Metadata = pageMetadata({
  title: "Contact: discuss your project",
  description:
    "Tell ROUANG about your home or business project. Send a short enquiry, email or call, or find the office in Bandar Tropicana, Telok Panglima Garang, Selangor.",
  path: "/contact",
});

/** The first steps, matching the start of the company's process (profile p.5). */
const steps = [
  ["Send a few lines", "What the space is, where it is and what you would like to change. Photos can come later."],
  ["Initial discussion", "We get back to you to arrange a first conversation about the project."],
  ["Design engagement", "If we are the right fit, we agree the design engagement before any design work starts."],
];

const social = [
  { label: "Instagram", handle: "rouang_official", href: studio.social.instagram },
  { label: "Facebook", handle: "Rouang", href: studio.social.facebook },
  { label: "TikTok", handle: "@rouang_official", href: studio.social.tiktok },
].filter((s): s is typeof s & { href: string } => !!s.href);

export default function ContactPage() {
  const wa = whatsappHref("Hello ROUANG, I'd like to talk about a project.");
  const tel = telHref();
  const address = addressLines();
  return (
    <section data-tone="light" className="bg-kapur text-ink">
      <div className="page-x pb-[var(--section-space)] pt-[calc(var(--header-h)+3rem)]">
        <Breadcrumbs items={[{ name: "Contact", href: "/contact" }]} />
        <div className="page-grid mt-16 gap-y-16 sm:mt-24">
          <div className="col-span-12 lg:col-span-5">
            <Label className="text-ink-muted">Project enquiry</Label>
            <h1 className="t-headline-hero mt-8">
              <span className="block">Start with a few lines.</span>
              <span className="t-follow block text-rikyu">The first conversation follows.</span>
            </h1>
            <p lang="ms" className="t-quote mt-8 text-ink-muted">
              {studio.promise.ms}
            </p>
            <p className="mt-6 max-w-[30rem] text-ink-soft">
              Send a short enquiry, contact us directly, or follow our work on social media.
            </p>

            <ol className="mt-14 border-t border-ink/15">
              {steps.map(([title, body], i) => (
                <li key={title} className="grid grid-cols-[2.5rem_1fr] gap-4 border-b border-ink/15 py-5">
                  <span className="t-label pt-1 tabular-nums text-ink-muted">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <p className="font-medium">{title}</p>
                    <p className="t-meta mt-1 text-ink-soft">{body}</p>
                  </div>
                </li>
              ))}
            </ol>

            <dl className="mt-14 grid gap-x-[var(--grid-gap)] gap-y-10 sm:grid-cols-2">
              {wa || studio.contact.email || tel ? (
                <div>
                  <dt className="t-label text-ink-muted">Email and phone</dt>
                  <dd className="mt-4">
                    <ul className="space-y-2">
                      {studio.contact.email ? (
                        <li>
                          <ContactLink href={`mailto:${studio.contact.email}`} kind="email" location="contact" className="link-fade">
                            {studio.contact.email}
                          </ContactLink>
                        </li>
                      ) : null}
                      {tel ? (
                        <li>
                          <ContactLink href={tel} kind="phone" location="contact" className="link-fade">
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
                  </dd>
                </div>
              ) : null}

              {social.length ? (
                <div>
                  <dt className="t-label text-ink-muted">Social media</dt>
                  <dd className="mt-4">
                    <ul className="space-y-2">
                      {social.map((s) => (
                        <li key={s.label}>
                          {/* Only the name fades on hover: the grey handle beside it would drop too far. */}
                          <a href={s.href}>
                            <span className="link-name">{s.label}</span>
                            <span className="text-ink-muted"> · {s.handle}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              ) : null}

              {address ? (
                <div>
                  <dt className="t-label text-ink-muted">Office</dt>
                  <dd className="mt-4">
                    <address className="not-italic">
                      {address.map((line) => (
                        <span key={line} className="block">
                          {line}
                        </span>
                      ))}
                    </address>
                  </dd>
                </div>
              ) : null}

              <div>
                <dt className="t-label text-ink-muted">Where we work</dt>
                <dd className="mt-4 text-ink-soft">Homes and businesses in {areaLabel()}.</dd>
              </div>

              {studio.legalName ? (
                <div className="sm:col-span-2">
                  <dt className="t-label text-ink-muted">Company</dt>
                  <dd className="mt-4 text-ink-soft">
                    <p className="font-medium text-ink">{studio.legalName}</p>
                    {studio.registrationNo ? <p className="mt-1">SSM registration no. {studio.registrationNo}</p> : null}
                    {studio.cidbRegistrationNo ? <p className="mt-1">CIDB registration no. {studio.cidbRegistrationNo}</p> : null}
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>

          <div className="col-span-12 lg:col-span-6 lg:col-start-7">
            <div className="relative rounded-[2px] border border-ink/15 bg-kapur p-6 sm:p-10">
              <Mark className="absolute right-6 top-6 h-5 w-5 text-ink/40 sm:right-10 sm:top-10" />
              <h2 className="t-title pr-10">Project enquiry</h2>
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

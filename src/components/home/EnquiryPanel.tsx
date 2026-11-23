import { EnquiryForm } from "@/components/contact/EnquiryForm";
import { ContactLink } from "@/components/layout/ContactLink";
import { Label } from "@/components/ui/Typography";
import { studio, telHref, whatsappHref } from "@/config/studio";
import { TURNSTILE_SITE_KEY } from "@/lib/env";

/* ——— 07 Start a conversation: the page ends on the green it turned to at 02 Studio ——— */

export function EnquiryPanel({ index }: { index: string }) {
  const wa = whatsappHref("Hello ROUANG, I'd like to talk about a project.");
  const tel = telHref();
  return (
    <section data-tone="rikyu" aria-labelledby="enquiry-title" className="relative overflow-hidden">
      <div className="pattern-halftone pointer-events-none absolute inset-y-0 right-0 w-[70%]" aria-hidden="true" />
      <div className="page-x section-y relative">
        <div className="page-grid gap-y-14">
          <div className="col-span-12 lg:col-span-5">
            <Label index={index} pill className="text-kapur">
              Start a conversation
            </Label>
            <h2 id="enquiry-title" className="t-headline mt-6">
              <span className="block">Tell us about the space.</span>
              <span className="t-follow block text-kapur">We&rsquo;ll take it from there.</span>
            </h2>
            <p className="mt-8 max-w-[30rem] text-kapur">
              A few lines is enough to begin. Tell us what the space is and what you would like to change, and we&rsquo;ll
              reply to arrange a first conversation.
            </p>
            {wa || studio.contact.email || tel ? (
              <div className="mt-10">
                <p className="t-label text-kapur">Or contact us directly</p>
                <ul className="mt-4 space-y-2">
                  {wa ? (
                    <li>
                      <ContactLink href={wa} kind="whatsapp" location="home_panel" className="link-fade">
                        WhatsApp
                      </ContactLink>
                    </li>
                  ) : null}
                  {studio.contact.email ? (
                    <li>
                      <ContactLink href={`mailto:${studio.contact.email}`} kind="email" location="home_panel" className="link-fade">
                        {studio.contact.email}
                      </ContactLink>
                    </li>
                  ) : null}
                  {tel ? (
                    <li>
                      <ContactLink href={tel} kind="phone" location="home_panel" className="link-fade">
                        {studio.contact.phone}
                      </ContactLink>
                    </li>
                  ) : null}
                </ul>
              </div>
            ) : null}
          </div>
          <div className="col-span-12 lg:col-span-6 lg:col-start-7">
            <EnquiryForm tone="dark" location="home" turnstileSiteKey={TURNSTILE_SITE_KEY} />
          </div>
        </div>
      </div>
    </section>
  );
}

import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Pending } from "@/components/ui/Section";
import { Label } from "@/components/ui/Typography";
import { privacyNotice, type NoticeSection } from "@/config/privacy";
import { studio } from "@/config/studio";
import { SHOW_DRAFTS } from "@/lib/env";
import { pageMetadata } from "@/lib/seo";

export const ensureStatic = "navigation";

export const metadata: Metadata = pageMetadata({
  title: "Privacy notice · Notis privasi",
  description:
    "How ROUANG collects, uses and protects the personal data you give us through this website, under Malaysia's Personal Data Protection Act 2010. In English and Bahasa Malaysia.",
  path: "/privacy",
});

const UPDATED = { iso: "2026-10-29", en: "29 October 2026", ms: "29 Oktober 2026" };

export default function PrivacyPage() {
  const notice = privacyNotice({
    controller: studio.legalName ?? "ROUANG",
    contact: studio.contact.email ?? "the contact details on our contact page",
  });

  return (
    <section data-tone="light" className="bg-kapur text-ink">
      <div className="page-x pb-[var(--section-space)] pt-[calc(var(--header-h)+3rem)]">
        <Breadcrumbs items={[{ name: "Privacy notice", href: "/privacy" }]} />
        <div className="page-grid mt-16 gap-y-10 sm:mt-24">
          <div className="col-span-12 lg:col-span-3">
            <div className="lg:sticky lg:top-[calc(var(--header-h)+2rem)]">
              <Label className="text-ink-muted">Privacy notice</Label>
              <p className="t-caption mt-3 text-ink-muted">
                Last updated <time dateTime={UPDATED.iso}>{UPDATED.en}</time>
              </p>
              <nav aria-label="Language" className="mt-8">
                <ul className="flex gap-2">
                  <li>
                    <a href="#english" className="inline-flex min-h-11 items-center rounded-full border border-ink/25 px-4 text-[0.9375rem]">
                      English
                    </a>
                  </li>
                  <li>
                    <a href="#bahasa-malaysia" lang="ms" className="inline-flex min-h-11 items-center rounded-full border border-ink/25 px-4 text-[0.9375rem]">
                      Bahasa Malaysia
                    </a>
                  </li>
                </ul>
              </nav>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-7 lg:col-start-5">
            <h1 className="t-headline-hero text-[clamp(2.375rem,1.5rem+3.4vw,4.5rem)]">
              <span className="block">How we handle your details</span>
              <span lang="ms" className="t-italic-display mt-2 block text-[0.8em] text-rikyu">
                Notis privasi
              </span>
            </h1>
            {SHOW_DRAFTS ? (
              <div className="mt-10">
                <Pending title="Legal review">
                  Written against s.7 of the Personal Data Protection Act 2010 (as amended in 2024). Needs the registered
                  company name, a contact email and address for data requests, and review by the studio&rsquo;s legal adviser
                  before launch, including the Bahasa Malaysia text.
                </Pending>
              </div>
            ) : null}

            <Notice id="english" heading="English" sections={notice.en} />
            <Notice id="bahasa-malaysia" heading="Bahasa Malaysia" sections={notice.ms} lang="ms" updated={`Kemas kini terakhir ${UPDATED.ms}`} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Notice({ id, heading, sections, lang, updated }: { id: string; heading: string; sections: NoticeSection[]; lang?: string; updated?: string }) {
  return (
    <div id={id} lang={lang} className="mt-16 scroll-mt-[calc(var(--header-h)+2rem)] border-t border-ink/15 pt-8">
      <p className="t-label text-ink-muted">{heading}</p>
      {updated ? <p className="t-caption mt-2 text-ink-muted">{updated}</p> : null}
      <div className="prose-rouang mt-6 max-w-none text-ink-soft">
        {sections.map((s) => (
          <section key={s.id} aria-labelledby={`${id}-${s.id}`}>
            <h2 id={`${id}-${s.id}`}>{s.title}</h2>
            {s.paragraphs.slice(0, 1).map((p) => (
              <p key={p}>{p}</p>
            ))}
            {s.list ? (
              <ul>
                {s.list.map((li) => (
                  <li key={li}>{li}</li>
                ))}
              </ul>
            ) : null}
            {s.paragraphs.slice(1).map((p) => (
              <p key={p}>{p}</p>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}

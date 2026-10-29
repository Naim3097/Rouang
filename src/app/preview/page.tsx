import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Label } from "@/components/ui/Typography";
import { allProcessSteps } from "@/config/process";
import { studio } from "@/config/studio";
import { getInsights, getProjects, getServices } from "@/lib/content";
import { IS_PRODUCTION, SITE_ENV } from "@/lib/env";
import { pageMetadata } from "@/lib/seo";

export const ensureStatic = "navigation";

export const metadata: Metadata = pageMetadata({ title: "Preview checklist", description: "Open items before launch.", path: "/preview", noindex: true });

type Item = { area: string; text: string; href?: string };

/** Review aid for the studio: everything the site is still waiting for. Not available in production. */
export default async function PreviewChecklist() {
  if (IS_PRODUCTION) notFound();
  const [projects, services, insights] = await Promise.all([getProjects(), getServices(), getInsights()]);

  const studioItems: Item[] = [];
  const add = (cond: boolean, text: string) => cond && studioItems.push({ area: "Studio details", text });
  add(!studio.legalName, "Registered company name (Sdn. Bhd. or enterprise) for the footer and privacy notice");
  add(!studio.registrationNo, "SSM registration number");
  add(!studio.contact.email, "Studio email address");
  add(!studio.contact.phone, "Studio phone number");
  add(!studio.contact.whatsapp, "WhatsApp number for enquiry buttons");
  add(!studio.address, "Studio address (needed for Google Business Profile and LocalBusiness search data)");
  add(!studio.openingHours, "Opening hours");
  add(!studio.foundingYear, "Year the studio was founded");
  studio.serviceAreas.filter((a) => !a.confirmed).forEach((a) => add(true, `Confirm service area: ${a.name}`));
  add(!Object.values(studio.social).some(Boolean), "Instagram, Facebook, TikTok or LinkedIn links");
  add(true, "Confirm the full list of services: is renovation or design-and-build offered, or design only?");

  const processItems: Item[] = allProcessSteps.filter((s) => !s.confirmed).map((s) => ({ area: "Process", text: `Confirm the "${s.title}" step describes how the studio works` }));

  const contentItems: Item[] = [
    ...projects.flatMap((p) => [
      ...(p.isDraft ? [{ area: `Project: ${p.title}`, text: p.placeholder ? "Layout placeholder, replace with a real project or delete" : "Draft, publish when the facts below are confirmed", href: `/projects/${p.slug}` }] : []),
      ...(!p.photography.permissionConfirmed && !p.placeholder ? [{ area: `Project: ${p.title}`, text: "Confirm permission to publish the photographs and the photographer credit", href: `/projects/${p.slug}` }] : []),
      ...p.todo.map((t) => ({ area: `Project: ${p.title}`, text: t, href: `/projects/${p.slug}` })),
      ...p.facts.filter((f) => !f.verified).map((f) => ({ area: `Project: ${p.title}`, text: `Verify: ${f.label}: ${f.value}`, href: `/projects/${p.slug}` })),
    ]),
    ...services.flatMap((s) => [
      ...(s.isDraft ? [{ area: `Service: ${s.navLabel}`, text: "Draft, publish once the service is confirmed", href: `/services/${s.slug}` }] : []),
      ...s.offers.filter((o) => !o.confirmed).map((o) => ({ area: `Service: ${s.navLabel}`, text: `Confirm offer: ${o.title}`, href: `/services/${s.slug}` })),
      ...s.faqs.filter((f) => !f.confirmed).map((f) => ({ area: `Service: ${s.navLabel}`, text: `Answer or confirm: ${f.q}`, href: `/services/${s.slug}` })),
      ...s.todo.map((t) => ({ area: `Service: ${s.navLabel}`, text: t, href: `/services/${s.slug}` })),
    ]),
    ...insights.flatMap((a) => [
      ...(a.isDraft ? [{ area: `Article: ${a.title}`, text: "Draft, needs the studio's review before publishing", href: `/insights/${a.slug}` }] : []),
      ...a.todo.map((t) => ({ area: `Article: ${a.title}`, text: t, href: `/insights/${a.slug}` })),
    ]),
  ];

  const groups = [
    { title: "Studio details", items: studioItems },
    { title: "Process", items: processItems },
    { title: "Projects, services and articles", items: contentItems },
  ];
  const total = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <section data-tone="light" className="bg-kapur text-ink">
      <div className="page-x pb-[var(--section-space)] pt-[calc(var(--header-h)+3rem)]">
        <Label className="text-ink-muted">Preview checklist · {SITE_ENV}</Label>
        <h1 className="t-headline mt-6">{total} items before launch</h1>
        <p className="mt-6 max-w-[40rem] text-ink-soft">
          This page only exists outside production. Drafts and layout placeholders are visible across this preview and
          are removed automatically on the live site. The production build also runs <code>npm run launch-check</code>,
          which blocks a release while any of these remain.
        </p>
        <div className="mt-14 space-y-16">
          {groups.map((g) =>
            g.items.length ? (
              <div key={g.title}>
                <h2 className="t-sub">
                  {g.title} <span className="t-caption text-ink-muted">({g.items.length})</span>
                </h2>
                <ul className="mt-5 border-t border-ink/15">
                  {g.items.map((it, i) => (
                    <li key={i} className="grid gap-2 border-b border-ink/15 py-4 sm:grid-cols-[16rem_1fr]">
                      <span className="t-caption text-ink-muted">{it.area}</span>
                      <span>{it.href ? <Link href={it.href} className="link-line">{it.text}</Link> : it.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null,
          )}
        </div>
      </div>
    </section>
  );
}

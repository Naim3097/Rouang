import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { Label, TitlePair } from "@/components/ui/Typography";
import type { Insight } from "@/lib/content";

/* ——— 06 Insights ———
   It follows Process on the same Milky White, so it opens closer: half the usual space above. */

export function InsightsList({ insights, index }: { insights: Insight[]; index: string }) {
  if (insights.length === 0) return null;
  const [lead, ...rest] = insights;
  return (
    <Section labelledBy="insights-title" className="bg-kapur pb-[var(--section-space)] pt-[calc(var(--section-space)*0.5)]">
      <div className="page-x">
        <Label index={index} pill className="text-ink-muted">
          Insights
        </Label>
        <TitlePair id="insights-title" lead="Notes for people planning a space" className="mt-6" />

        {/* The latest article leads, wide, with its summary; the next three are listed beside it. Every
            article title is a card title, a step under the section's own. */}
        <div className="page-grid mt-12 gap-y-12 sm:mt-16">
          <article className="col-span-12 lg:col-span-6">
            <Link href={`/insights/${lead.slug}`} className="block border-t border-ink/15 pt-6">
              <p className="t-label text-ink-muted">
                {lead.category} · {lead.readingMinutes} min read{lead.isDraft ? " · Draft" : ""}
              </p>
              <h3 className="t-title mt-4 max-w-[26ch]">
                <span className="link-name">{lead.title}</span>
              </h3>
              <p className="mt-4 max-w-[36rem] text-ink-soft">{lead.description}</p>
            </Link>
          </article>
          <ul className="col-span-12 lg:col-span-4 lg:col-start-9">
            {rest.slice(0, 3).map((a) => (
              <li key={a.slug} className="border-t border-ink/15">
                <Link href={`/insights/${a.slug}`} className="block py-6">
                  <p className="t-label text-ink-muted">{a.category}{a.isDraft ? " · Draft" : ""}</p>
                  <p className="t-title mt-3">
                    <span className="link-name">{a.title}</span>
                  </p>
                </Link>
              </li>
            ))}
            <li className="border-t border-ink/15 pt-6">
              <ButtonLink href="/insights" variant="outline">
                All insights
              </ButtonLink>
            </li>
          </ul>
        </div>
      </div>
    </Section>
  );
}

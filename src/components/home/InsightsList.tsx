import Link from "next/link";
import { insightImage, insightMeta } from "@/components/insights/imagery";
import { InsightPicture } from "@/components/insights/InsightPicture";
import { ButtonLink } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { Label, TitlePair } from "@/components/ui/Typography";
import type { Insight } from "@/lib/content";

/* ——— 06 Insights ———
   It follows Process on the same Milky White, so it opens closer: half the usual space above.
   Laid out after the client's mockup (23 Nov 2026): the latest article leads on the left with a wide
   picture, the next two are rows beside it, a thumbnail and the title side by side
   (src/styles/pages/insights.css, "Home"). */

export function InsightsList({ insights, index }: { insights: Insight[]; index: string }) {
  if (insights.length === 0) return null;
  const [lead, ...rest] = insights;
  const others = rest.slice(0, 2);
  const images = new Map(insights.map((a) => [a.slug, insightImage(a.slug)]));
  // Pictures show only where at least one article has one; where none does (a live page, while the
  // pictures are temporary) the cards are words alone, as before.
  const withPictures = [lead, ...others].some((a) => images.get(a.slug));

  return (
    <Section labelledBy="insights-title" className="bg-kapur pb-[var(--section-space)] pt-[calc(var(--section-space)*0.5)]">
      <div className="page-x">
        <Label index={index} pill className="text-ink-muted">
          Insights
        </Label>
        <TitlePair id="insights-title" lead="Notes for people planning a space" className="mt-6" />

        {/* Every article title is a card title, a step under the section's own. Each card is one link. */}
        <div className="ins-home mt-8 border-t border-ink/15 sm:mt-10">
          <article className="ins-home-lead">
            <Link href={`/insights/${lead.slug}`} className="ins-link ins-card">
              <p className="t-label text-ink-muted">{insightMeta(lead)}</p>
              <h3 className="t-title mt-3 max-w-[42ch]">
                <span className="link-name">{lead.title}</span>
              </h3>
              <p className="mt-3 max-w-[36rem] text-ink-soft">{lead.description}</p>
              {withPictures ? (
                <InsightPicture
                  image={images.get(lead.slug) ?? null}
                  className="ins-frame-feature"
                  sizes="(min-width: 1024px) 48vw, 100vw"
                />
              ) : null}
            </Link>
          </article>
          <div className="ins-home-side">
            {others.length ? (
              <ul>
                {others.map((a) => (
                  <li key={a.slug} className="ins-home-row border-b border-ink/15">
                    <Link href={`/insights/${a.slug}`} className="ins-link ins-card ins-card-row">
                      <div className="ins-card-words">
                        <p className="t-label text-ink-muted">{insightMeta(a, { readingTime: false })}</p>
                        <h3 className="t-title mt-3">
                          <span className="link-name">{a.title}</span>
                        </h3>
                      </div>
                      {withPictures ? (
                        <InsightPicture
                          image={images.get(a.slug) ?? null}
                          className="ins-frame-thumb"
                          sizes="(min-width: 1024px) 19vw, 40vw"
                        />
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="ins-home-more">
              <ButtonLink href="/insights" variant="outline">
                All insights
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

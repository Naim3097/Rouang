import type { ElementType, ReactNode } from "react";

/**
 * Small caps label. Capitals are reserved for very small labels (kit p.11).
 * With `pill` it is set in a small rounded pill, sized to its words, the index and the name parted
 * by a slash ("01 / Work"). The pill takes the label's colour for its hairline, so it reads on
 * Milky White, Chinese Black and the Rikyū green alike; centre it with mx-auto.
 */
export function Label({
  index,
  children,
  className = "",
  as: Tag = "p",
  pill = false,
}: {
  index?: string;
  children: ReactNode;
  className?: string;
  as?: ElementType;
  pill?: boolean;
}) {
  if (pill) {
    return (
      <Tag className={`t-label label-pill ${className}`}>
        {index ? (
          <>
            <span className="tabular-nums">{index}</span>
            <span aria-hidden="true" className="opacity-60">
              /
            </span>
          </>
        ) : null}
        <span>{children}</span>
      </Tag>
    );
  }
  return (
    <Tag className={`t-label flex items-baseline gap-3 ${className}`}>
      {index ? <span className="tabular-nums">{index}</span> : null}
      <span>{children}</span>
    </Tag>
  );
}

/**
 * The title pair used throughout the kit ("The / name", "About / the logo"): two lines of Outfit
 * at one size, the lead in Regular and the follow in Light, in Rikyū Grey on the page. Weight and
 * colour together carry the contrast between them.
 * `size` picks the level: "hero" is the page title (h1), "section" a section title (h2).
 */
export function TitlePair({
  as: Tag = "h2",
  lead,
  follow,
  eyebrow,
  size = "section",
  className = "",
  id,
}: {
  as?: ElementType;
  lead: ReactNode;
  follow?: ReactNode;
  /** Small caps line inside the heading, e.g. "Interior design projects", so the h1 names its subject.
   * It comes last in the markup, so assistive technology reads the page name first, and is shown above. */
  eyebrow?: ReactNode;
  size?: "hero" | "section";
  className?: string;
  id?: string;
}) {
  const leadClass = size === "hero" ? "t-headline-hero" : "t-headline";
  return (
    <Tag id={id} className={`${leadClass} ${eyebrow ? "flex flex-col" : ""} ${className}`}>
      <span className="block">{lead}</span>
      {follow ? <span className="t-follow block text-rikyu">{follow}</span> : null}
      {eyebrow ? <span className="t-label order-first mb-6 block text-ink-muted">{eyebrow}</span> : null}
    </Tag>
  );
}

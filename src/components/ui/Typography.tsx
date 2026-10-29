import type { ElementType, ReactNode } from "react";

/** Small caps label. Capitals are reserved for very small labels (kit p.11). */
export function Label({
  index,
  children,
  className = "",
  as: Tag = "p",
}: {
  index?: string;
  children: ReactNode;
  className?: string;
  as?: ElementType;
}) {
  return (
    <Tag className={`t-label flex items-baseline gap-3 ${className}`}>
      {index ? <span className="tabular-nums opacity-60">{index}</span> : null}
      <span>{children}</span>
    </Tag>
  );
}

/**
 * The title pair used throughout the kit: an Outfit Medium line, then an EB Garamond italic
 * line in Rikyū Grey ("The / name", "About / the logo"). One italic line carries the weight.
 */
export function TitlePair({
  as: Tag = "h2",
  lead,
  italic,
  size = "section",
  className = "",
  italicClassName = "",
  id,
}: {
  as?: ElementType;
  lead: ReactNode;
  italic?: ReactNode;
  size?: "hero" | "section";
  className?: string;
  italicClassName?: string;
  id?: string;
}) {
  const leadClass = size === "hero" ? "t-headline-hero" : "t-headline";
  return (
    <Tag id={id} className={`${leadClass} ${className}`}>
      <span className="block">{lead}</span>
      {italic ? (
        <span
          className={`t-italic-display mt-[0.06em] block text-[1.08em] text-rikyu ${italicClassName}`}
        >
          {italic}
        </span>
      ) : null}
    </Tag>
  );
}

/** Malay lines are set in Garamond italic and marked up as Malay for screen readers and search. */
export function Malay({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span lang="ms" className={`font-serif italic ${className}`}>
      {children}
    </span>
  );
}

/** Project titles in captions: Garamond italic, then the facts in Outfit (kit p.12). */
export function ProjectCaption({ title, facts, className = "" }: { title: string; facts: (string | null | undefined)[]; className?: string }) {
  const parts = facts.filter(Boolean);
  return (
    <p className={`t-caption ${className}`}>
      <span className="font-serif text-[1.08em] italic">{title}</span>
      {parts.map((f) => (
        <span key={f}>
          <span aria-hidden="true"> · </span>
          <span>{f}</span>
        </span>
      ))}
    </p>
  );
}

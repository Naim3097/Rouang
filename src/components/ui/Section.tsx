import type { ReactNode } from "react";
import { SHOW_DRAFTS } from "@/lib/env";

type Tone = "light" | "dark" | "rikyu";

/**
 * A page section. Sections meet on a hairline with registration crosses on the page margins,
 * the way sheets in a drawing set are framed.
 */
export function Section({
  id,
  tone = "light",
  children,
  className = "",
  crosses = true,
  guides = false,
  labelledBy,
}: {
  id?: string;
  tone?: Tone;
  children: ReactNode;
  className?: string;
  crosses?: boolean;
  guides?: boolean;
  labelledBy?: string;
}) {
  return (
    <section
      id={id}
      data-tone={tone === "light" ? "light" : tone}
      aria-labelledby={labelledBy}
      className={`relative ${tone === "light" ? "bg-kapur text-ink" : ""} ${className}`}
    >
      {guides ? <div className="sheet-guides" aria-hidden="true" /> : null}
      {crosses ? <Crosses /> : null}
      {children}
    </section>
  );
}

export function Crosses({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-x-0 top-0 ${className}`} aria-hidden="true">
      <span className="cross top-0" style={{ left: "var(--page-gutter)" }} />
      <span className="cross top-0" style={{ left: "calc(100% - var(--page-gutter))" }} />
    </div>
  );
}

/** Shown only in previews where the studio still owes content. Renders nothing in production. */
export function Pending({ title, children, tone = "light" }: { title: string; children: ReactNode; tone?: "light" | "dark" }) {
  if (!SHOW_DRAFTS) return null;
  return (
    <div
      className={`rounded-[2px] border border-dashed p-5 ${tone === "dark" ? "border-kapur/25 text-mouse" : "border-ink/25 text-ink-muted"}`}
    >
      <p className="t-label mb-2">Awaiting studio · {title}</p>
      <div className="t-caption text-[0.875rem]">{children}</div>
    </div>
  );
}

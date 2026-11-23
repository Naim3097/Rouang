import type { ElementType, ReactNode } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { TitlePair } from "@/components/ui/Typography";

/**
 * The Rikyū green field: the kit's gradient (globals.css, [data-tone="rikyu"]) with the halftone dots
 * fading in from the left across its right-hand seventy per cent (.pattern-halftone). The home page's
 * enquiry panel set it first; every other green section on the site is this same component, so the
 * gradient, the dots and the text colours never drift apart.
 *
 * Full bleed by default (the home enquiry panel, the Work page's opening). `rounded` sets it as a
 * panel inside the page margins with the panel radius (--radius-panel), as the closing calls to
 * action on Services and About are. Text on it is Milky White: 5.1:1 at the light end, more as it
 * deepens.
 */
export function RikyuField({
  as: Tag = "section",
  rounded = false,
  className = "",
  children,
  ...rest
}: {
  as?: ElementType;
  rounded?: boolean;
  className?: string;
  children: ReactNode;
  id?: string;
  "aria-labelledby"?: string;
  "aria-label"?: string;
}) {
  return (
    // A rounded panel sits inside the page's margins, so the header does not take its tone from it
    // (data-header-skip, SiteHeader): it stays the tone of the band around it rather than laying a
    // full-width green bar across the grey margins.
    <Tag
      data-tone="rikyu"
      data-header-skip={rounded ? "" : undefined}
      className={`relative isolate overflow-hidden ${rounded ? "rounded-panel" : ""} ${className}`}
      {...rest}
    >
      <div className="pattern-halftone pointer-events-none absolute inset-y-0 right-0 -z-10 w-[70%]" aria-hidden="true" />
      {children}
    </Tag>
  );
}

/**
 * A closing call to action: a title pair and one button on a rounded Rikyū panel, inside the page
 * margins (Services, "Not sure which applies?"; About, "Have a space in mind?").
 *
 * The panel sits in a band of the page's own grey (`surface`, which should match the section above,
 * so the two read as one ground). The band adds no space above the panel: the section before it
 * already ends on its own section padding. Below, the panel keeps one page margin to the footer, the
 * same distance as its sides keep to the screen's edge, so it reads as a framed panel rather than
 * a band.
 */
export function CtaPanel({
  id,
  lead,
  follow,
  body,
  href = "/contact",
  action = "Discuss your project",
  surface = "kapur",
}: {
  /** The heading's id, which labels the section. */
  id: string;
  lead: ReactNode;
  follow?: ReactNode;
  body?: ReactNode;
  href?: string;
  action?: ReactNode;
  surface?: "kapur" | "kapur-deep";
}) {
  return (
    <section data-tone="light" className={`${surface === "kapur" ? "bg-kapur" : "bg-kapur-deep"} text-ink`} aria-labelledby={id}>
      <div className="page-x pb-[var(--page-gutter)]">
        <RikyuField as="div" rounded>
          <div className="cta-panel flex flex-col items-start">
            <TitlePair id={id} lead={lead} follow={follow} followClassName="text-kapur" />
            {body ? <p className="mt-6 max-w-[34rem] text-kapur">{body}</p> : null}
            <ButtonLink href={href} variant="light" className="mt-10">
              {action}
            </ButtonLink>
          </div>
        </RikyuField>
      </div>
    </section>
  );
}

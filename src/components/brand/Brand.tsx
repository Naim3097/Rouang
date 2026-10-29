import type { SVGProps } from "react";
import { ICONS, MARK, WORDMARK, type IconName } from "./paths";

type BrandSvgProps = Omit<SVGProps<SVGSVGElement>, "viewBox" | "children"> & { title?: string };

/**
 * The primary wordmark: a single locked drawing (kit p.4). Scale it whole, in one colour.
 * It takes `currentColor`, so its colour always comes from the surface it sits on.
 */
export function Wordmark({ title = "ROUANG", className, ...props }: BrandSvgProps) {
  return (
    <svg
      viewBox={`0 0 ${WORDMARK.width} ${WORDMARK.height}`}
      role="img"
      aria-label={title}
      className={className}
      fill="currentColor"
      {...props}
    >
      {WORDMARK.paths.map((p, i) => (
        <path key={i} transform={`matrix(${p.m.join(",")})`} d={p.d} />
      ))}
    </svg>
  );
}

/** The mark: the only element that may appear without the name, and only where the brand is obvious. */
export function Mark({ title, className, ...props }: BrandSvgProps) {
  return (
    <svg
      viewBox={`0 0 ${MARK.width} ${MARK.height}`}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={className}
      fill="currentColor"
      {...props}
    >
      {MARK.paths.map((p, i) => (
        <path key={i} transform={`matrix(${p.m.join(",")})`} d={p.d} />
      ))}
    </svg>
  );
}

/** Brand icons: 56 px grid, 1.6 px stroke, round joins, circles and straight lines only (kit p.14). */
export function Icon({ name, className, ...props }: Omit<BrandSvgProps, "title"> & { name: IconName }) {
  return (
    <svg
      viewBox="0 0 42 42"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {ICONS[name].map((p, i) => (
        <path key={i} transform={`matrix(${p.m.join(",")})`} d={p.d} vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}

/**
 * The curve, lifted out of the mark and drawn as a hairline rule (kit p.14).
 * It keeps the mark's direction: it enters high on the left and settles to the right.
 * Never flipped: mirrored, it reads as a wave breaking backwards.
 */
export function CurveRule({ className = "", at = "38%" }: { className?: string; at?: string }) {
  return (
    <div className={`curve-rule flex items-stretch ${className}`} aria-hidden="true" data-curve>
      <span className="block h-px self-start bg-current" style={{ width: at }} />
      <svg viewBox="0 0 120 24" className="h-6 w-[7.5rem] shrink-0 overflow-visible" fill="none">
        <path
          d="M0 0.5 C 34 0.5, 44 4, 60 13 S 92 23.5, 120 23.5"
          stroke="currentColor"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          pathLength={1}
        />
      </svg>
      <span className="block h-px flex-1 self-end bg-current" />
    </div>
  );
}

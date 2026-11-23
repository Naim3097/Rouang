import type { ReactNode } from "react";
import { studio } from "@/config/studio";

/*
 * Each network's mark, drawn for this site on a 24-unit square in one colour (currentColor), so it
 * takes the text colour around it: ink on Milky White, Milky White on Chinese Black or the green.
 * Simple versions of the marks people know, not the companies' files, and at one optical size.
 */
const glyphs: Record<"instagram" | "facebook" | "tiktok" | "linkedin", ReactNode> = {
  // The camera: a rounded square, the lens and the viewfinder dot.
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5.25" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4.1" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.15" cy="6.85" r="1.25" fill="currentColor" />
    </>
  ),
  // The f cut out of a full circle, its stem running out at the foot.
  facebook: (
    <path
      fillRule="evenodd"
      fill="currentColor"
      d="M2 12a10 10 0 1 1 20 0a10 10 0 1 1-20 0Z M10.4 21.871V14.9H8v-2.6h2.4V9.3c0-2.45 1.6-4 4.1-4h1.6v2.8h-1.1c-.95 0-1.4.45-1.4 1.35v2.85h2.5l-.4 2.6h-2.1v6.971A10 10 0 0 1 10.4 21.871Z"
    />
  ),
  // The note: a ring for the head, the stem and the flag curling off its top. Drawn a tenth larger
  // than its box suggests, since an open shape reads smaller than the filled square and circle.
  tiktok: (
    <g transform="translate(12 12) scale(1.1) translate(-12 -12)">
      <circle cx="9.1" cy="16.3" r="3.15" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <path fill="currentColor" d="M11 3.3h2.5v13H11Z M13.5 3.3c0 2.7 2.5 4.8 5.8 4.8v2.6c-2.3 0-4.3-.8-5.8-2.1Z" />
    </g>
  ),
  // "in" cut out of a rounded square.
  linkedin: (
    <path
      fillRule="evenodd"
      fill="currentColor"
      d="M5.5 3h13A2.5 2.5 0 0 1 21 5.5v13a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 18.5v-13A2.5 2.5 0 0 1 5.5 3Z M6.15 7.6a1.45 1.45 0 1 0 2.9 0a1.45 1.45 0 1 0-2.9 0Z M6.3 10h2.6v7.6H6.3Z M10.6 10h2.5v1.2c.5-.8 1.5-1.4 2.7-1.4c2.1 0 2.6 1.4 2.6 3.3v4.5h-2.5v-4c0-1-.3-1.6-1.2-1.6c-1 0-1.6.7-1.6 1.7v3.9h-2.5Z"
    />
  ),
};

const networks = [
  { key: "instagram", name: "Instagram" },
  { key: "facebook", name: "Facebook" },
  { key: "tiktok", name: "TikTok" },
  { key: "linkedin", name: "LinkedIn" },
] as const;

/**
 * ROUANG's social accounts as a row of icons, one link each, for every account in
 * `studio.social` (an account set to null is left out, and with none the row is not drawn).
 * Each link is a 44px circle around a 22px mark, named for assistive technology ("ROUANG on
 * Instagram"), and fades a step on hover like the site's other links. The colour is inherited.
 * The glyphs sit 11px inside their targets: pass `-ml-[0.6875rem]` to line the first one up with
 * the text above it.
 */
export function SocialLinks({ className = "", label = "ROUANG on social media" }: { className?: string; label?: string }) {
  const links = networks.flatMap((n) => {
    const href = studio.social[n.key];
    return href ? [{ ...n, href }] : [];
  });
  if (!links.length) return null;
  return (
    <ul aria-label={label} className={`flex flex-wrap items-center ${className}`}>
      {links.map((l) => (
        <li key={l.key}>
          <a href={l.href} className="link-fade grid size-11 place-items-center rounded-full">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="size-[1.375rem]">
              {glyphs[l.key]}
            </svg>
            <span className="visually-hidden">ROUANG on {l.name}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

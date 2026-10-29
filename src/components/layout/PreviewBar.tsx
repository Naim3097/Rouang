import Link from "next/link";
import { SITE_ENV } from "@/lib/env";

/** Visible only outside production, so a reviewer always knows drafts and placeholders are on show. */
export function PreviewBar() {
  return (
    <div className="pointer-events-none fixed bottom-4 left-4 z-[55] hidden sm:block">
      <Link
        href="/preview"
        className="pointer-events-auto t-label inline-flex items-center gap-3 rounded-full border border-ink/15 bg-kapur/95 px-4 py-2.5 text-ink shadow-[0_10px_30px_-12px_rgb(0_0_0/0.35)]"
      >
        <span className="h-2 w-2 rounded-full bg-rikyu" aria-hidden="true" />
        <span>{SITE_ENV} build · drafts visible · open checklist</span>
      </Link>
    </div>
  );
}

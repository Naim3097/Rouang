import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/lib/content";
import { publicImage } from "@/lib/content";

/**
 * Projects as an index of rows rather than a card grid. On pointer devices, hovering a row opens
 * a circular preview of its photograph: the aperture again, at the size of a thumbnail.
 * Pure CSS; below the large breakpoint a small circle sits at the start of each row instead.
 * With `showRole` each row also states ROUANG's part in the project, for a list where the context
 * (a service that includes construction) could suggest more than ROUANG did.
 */
export function ProjectIndex({ projects, startAt = 1, showRole = false }: { projects: Project[]; startAt?: number; showRole?: boolean }) {
  return (
    <ol className="border-t border-ink/15">
      {projects.map((p, i) => {
        const img = publicImage(p.card ?? p.hero);
        const photo = img && !("pending" in img) ? img : null;
        return (
          <li key={p.slug} className="group relative border-b border-ink/15">
            <Link
              href={`/projects/${p.slug}`}
              className="page-grid relative items-baseline gap-y-2 py-6 outline-offset-[-2px] sm:py-8"
            >
              <span className="t-label col-span-2 tabular-nums text-ink-muted sm:col-span-1">
                {String(i + startAt).padStart(2, "0")}
              </span>
              <span className="t-title col-span-10 flex items-center gap-4 sm:col-span-6 lg:col-span-5">
                {photo ? (
                  <span className="relative block h-14 w-14 shrink-0 overflow-hidden rounded-full lg:hidden" aria-hidden="true">
                    <Image src={photo.src} alt="" fill sizes="56px" className="object-cover" style={photo.focus ? { objectPosition: photo.focus } : undefined} />
                  </span>
                ) : null}
                <span className="link-name">
                  {p.title}
                  {p.isDraft ? <DraftTag placeholder={p.placeholder} /> : null}
                </span>
              </span>
              <span className="t-caption col-span-10 col-start-3 text-ink-muted sm:col-span-3 sm:col-start-auto lg:col-span-3">
                {p.type}
                {p.location ? ` · ${p.location}` : ""}
                {p.visualisation ? <span className="sm:hidden"> · Design proposal</span> : null}
                {/* Each part of the role kept whole: a narrow column would otherwise split "interior / design". */}
                {showRole ? (
                  <span className="block">
                    ROUANG&rsquo;s role:{" "}
                    {p.scope.map((s, n) => (
                      <span key={s} className="whitespace-nowrap">
                        {s.toLowerCase()}
                        {n < p.scope.length - 1 ? ", " : ""}
                      </span>
                    ))}
                  </span>
                ) : null}
              </span>
              <span className="t-caption col-span-10 col-start-3 hidden text-ink-muted sm:col-span-2 sm:col-start-auto sm:block sm:text-right lg:col-span-3">
                {p.sector === "residential" ? "Residential" : "Commercial"}
                {p.visualisation ? <span className="block">Design proposal</span> : null}
              </span>
            </Link>
            {photo ? (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute left-[40%] top-1/2 z-10 hidden aspect-square w-[min(11vw,11rem)] -translate-y-1/2 overflow-hidden [clip-path:circle(0%_at_50%_50%)] transition-[clip-path] duration-700 ease-[var(--ease-settle)] group-hover:[clip-path:circle(50%_at_50%_50%)] lg:block"
              >
                <Image src={photo.src} alt="" fill sizes="11rem" className="object-cover" style={photo.focus ? { objectPosition: photo.focus } : undefined} />
              </div>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

export function DraftTag({ placeholder }: { placeholder?: boolean }) {
  return (
    <span className="t-label ml-3 inline-block rounded-full border border-current px-2 py-0.5 align-middle opacity-60">
      {placeholder ? "Layout placeholder" : "Draft"}
    </span>
  );
}

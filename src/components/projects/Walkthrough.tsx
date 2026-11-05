import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Mark } from "@/components/brand/Brand";

export type WalkFrame = {
  src: string;
  alt: string;
  width: number;
  height: number;
  focus?: string;
  /** One of the brand kit's three kinds of picture. */
  role: "Space" | "Material" | "Whole";
  /** Short name for the frame index, e.g. "Batik frame". */
  label: string;
  caption: string;
};

/**
 * A walk through a project, driven by the visitor's own scrolling. The stage stays pinned and the
 * photographs, framed in an arch, dissolve into one another: each holds still for most of its
 * stretch of scroll, then the next rises gently through it and settles. The caption, the count and
 * the index change with the photograph, on the same stretch of scroll. Real photographs only.
 *
 * All of it is CSS scroll-driven animation on opacity and transforms (globals.css, "Walkthrough"):
 * no scroll handler, no re-render while scrolling, nothing for the main thread to repaint.
 * Each frame's stretch is passed in as custom properties.
 *
 * Screen readers get every photograph and caption as a plain list in reading order; the moving
 * stack is decoration for sighted visitors and is hidden from them. With reduced motion, without
 * scroll-driven animation, or without JavaScript, the photographs are shown in sequence instead.
 */
export function Walkthrough({
  frames,
  title,
  href,
  kicker,
}: {
  frames: WalkFrame[];
  title: string;
  href: string;
  kicker: string;
}) {
  const n = frames.length;
  // Frame i holds from i/n to (i+1)/n of the pinned scroll; the dissolve into it takes the middle
  // 36% of one step, centred on i/n.
  const at = (i: number, offset: number) => `${(((i + offset) / n) * 100).toFixed(3)}%`;
  const range = (i: number): CSSProperties =>
    ({
      ["--walk-in-start" as string]: at(i, -0.18),
      ["--walk-in-end" as string]: at(i, 0.18),
      ["--walk-out-start" as string]: at(i + 1, -0.18),
      ["--walk-out-end" as string]: at(i + 1, 0.18),
    }) as CSSProperties;

  return (
    <>
      <div className="walk-pinned relative" style={{ height: `${n * 62 + 38}svh`, ["--walk-n" as string]: n }}>
        <ol className="visually-hidden">
          {frames.map((f, i) => (
            <li key={f.src}>
              <figure>
                {/* The photograph itself is shown in the stack; here it only needs its description. */}
                <span role="img" aria-label={f.alt} />
                <figcaption>
                  {String(i + 1).padStart(2, "0")} · {f.role}: {f.caption}
                </figcaption>
              </figure>
            </li>
          ))}
        </ol>
        <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden">
          <div className="page-x grid w-full grid-cols-[minmax(0,1fr)] items-center gap-6 lg:grid-cols-12 lg:gap-[var(--grid-gap)]">
            {/* The picture: photographs stacked in an arch, each dissolving into the next. */}
            <div
              aria-hidden="true"
              className="walk-arch relative mx-auto aspect-[4/5] w-[min(100%,42svh)] lg:order-2 lg:col-span-6 lg:col-start-4 lg:h-[min(82svh,56rem)] lg:w-auto"
            >
              {frames.map((f, i) => (
                <div key={f.src} className="walk-layer absolute inset-0" style={range(i)}>
                  <Image
                    src={f.src}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 50vw, 90vw"
                    className="object-cover"
                    style={f.focus ? { objectPosition: f.focus } : undefined}
                  />
                </div>
              ))}
            </div>

            {/* The words: what you are looking at, frame by frame. */}
            <div className="lg:order-1 lg:col-span-3">
              <p className="t-label text-mouse">{kicker}</p>
              <p className="mt-2 font-serif text-[clamp(1.625rem,1.2rem+2vw,3.25rem)] italic leading-none lg:mt-4">{title}</p>
              <div className="mt-4 h-px w-full bg-kapur/15 lg:mt-8" aria-hidden="true">
                <div className="walk-progress h-px bg-rikyu" />
              </div>
              <div aria-hidden="true" className="relative mt-4 min-h-[6.5rem] lg:mt-6 lg:min-h-[9.5rem]">
                {frames.map((f, i) => (
                  <div key={f.src} className="walk-cap absolute inset-x-0 top-0" style={range(i)}>
                    <p className="t-label tabular-nums text-mouse">
                      {String(i + 1).padStart(2, "0")} / {String(n).padStart(2, "0")} · {f.role}
                    </p>
                    <p className="mt-2 text-[1.0625rem] leading-relaxed text-kapur lg:mt-3 lg:text-[1.1875rem]">{f.caption}</p>
                  </div>
                ))}
              </div>
              <Link href={href} className="group mt-3 inline-flex min-h-11 items-center gap-3 text-kapur lg:mt-8">
                <span className="link-line">Read the case study</span>
                <Mark className="h-5 w-5 transition-transform duration-500 group-hover:translate-x-1" />
              </Link>
            </div>

            <ol className="hidden lg:order-3 lg:col-span-2 lg:col-start-11 lg:block" aria-hidden="true">
              {frames.map((f, i) => (
                <li key={f.src} className="walk-rail t-caption flex items-center gap-3 py-1.5" style={range(i)}>
                  <span className="walk-rail-line block h-px w-8 origin-left bg-current" />
                  {f.label}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* The same photographs in sequence, for reduced motion and where scroll-driven animation is missing. */}
      <div className="walk-static page-x space-y-16 pb-24">
        {frames.map((f, i) => (
          <figure key={f.src} className="grid gap-6 lg:grid-cols-12">
            <div className="walk-arch relative aspect-[4/5] lg:col-span-6 lg:col-start-4">
              <Image src={f.src} alt={f.alt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" style={f.focus ? { objectPosition: f.focus } : undefined} />
            </div>
            <figcaption className="lg:col-span-3">
              <p className="t-label text-mouse">
                {String(i + 1).padStart(2, "0")} · {f.role}
              </p>
              <p className="mt-2 text-kapur">{f.caption}</p>
            </figcaption>
          </figure>
        ))}
        <Link href={href} className="group inline-flex min-h-11 items-center gap-3 text-kapur">
          <span className="link-line">Read the case study</span>
          <Mark className="h-5 w-5 transition-transform duration-500 group-hover:translate-x-1" />
        </Link>
      </div>
    </>
  );
}

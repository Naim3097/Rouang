"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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
 * A walk through a project, driven by the visitor's own scrolling. The frame stays pinned while
 * each photograph opens out of the last through the circle of the mark. Real photographs only.
 *
 * Screen readers get every photograph and caption as a plain list in reading order; the moving
 * stack is decoration for sighted visitors and is hidden from them.
 *
 * The pinned layout is rendered on the server, so nothing moves when the page hydrates. With
 * reduced motion, or without JavaScript, CSS shows the photographs in sequence instead
 * (.walk-pinned / .walk-static in globals.css; the no-script rule sits with the server section).
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
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const layers = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const n = frames.length;
    const last = new Array<number>(n).fill(-1);
    let shown = 0;
    let frame = 0;
    let live = false;

    const update = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const travel = Math.max(1, rect.height - window.innerHeight);
      const p = Math.min(1, Math.max(0, -rect.top / travel));
      const pos = p * (n - 1);
      let showing = 0;
      for (let i = 1; i < n; i++) {
        // Each photograph opens over 40% of its step and then holds still, so most of the scroll
        // shows one settled picture rather than two caught mid-wipe.
        const t = Math.min(1, Math.max(0, (pos - (i - 1) - 0.3) / 0.4));
        // The caption follows the photograph that has mostly opened, not the scroll position.
        if (t >= 0.35) showing = i;
        const eased = Math.round((1 - Math.pow(1 - t, 3)) * 1000) / 1000;
        const layer = layers.current[i];
        if (!layer || eased === last[i]) continue;
        last[i] = eased;
        layer.style.clipPath = `circle(${(eased * 75).toFixed(2)}% at 50% 50%)`;
        const img = layer.firstElementChild as HTMLElement | null;
        if (img) img.style.transform = `scale(${(1.12 - 0.12 * eased).toFixed(4)})`;
      }
      if (showing !== shown) {
        shown = showing;
        setActive(showing);
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const attach = () => {
      if (live) return;
      live = true;
      el.dataset.live = "";
      update();
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
    };
    const detach = () => {
      if (!live) return;
      live = false;
      delete el.dataset.live;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    };

    // The scroll loop runs only while the track is on or near the screen. When CSS hides the
    // pinned layout (reduced motion), the track never intersects and nothing runs.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) attach();
        else detach();
      },
      { rootMargin: "100% 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      detach();
    };
  }, [frames.length]);

  const current = frames[active];

  return (
    <>
      <div ref={track} className="walk-pinned relative" style={{ height: `${frames.length * 85 + 20}svh` }}>
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
            {/* The picture: photographs stacked, each opening out of the last. */}
            <div aria-hidden="true" className="relative mx-auto aspect-[4/5] w-[min(100%,44svh)] lg:order-2 lg:col-span-6 lg:col-start-4 lg:h-[min(84svh,56rem)] lg:w-auto">
              {frames.map((f, i) => (
                <div
                  key={f.src}
                  ref={(node) => {
                    layers.current[i] = node;
                  }}
                  className="walk-layer absolute inset-0 overflow-hidden"
                  style={{ clipPath: i === 0 ? undefined : "circle(0% at 50% 50%)", zIndex: i }}
                >
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
                <div className="h-px bg-rikyu transition-[width] duration-500" style={{ width: `${((active + 1) / frames.length) * 100}%` }} />
              </div>
              <div aria-hidden="true" className="mt-4 min-h-[5.5rem] lg:mt-6 lg:min-h-[8.5rem]">
                <p className="t-label tabular-nums text-mouse">
                  {String(active + 1).padStart(2, "0")} / {String(frames.length).padStart(2, "0")} · {current.role}
                </p>
                <p key={current.src} className="mt-2 animate-[walk-in_0.7s_var(--ease-brand)_both] text-[1.0625rem] leading-relaxed text-kapur lg:mt-3 lg:text-[1.1875rem]">
                  {current.caption}
                </p>
              </div>
              <Link href={href} className="group mt-3 inline-flex min-h-11 items-center gap-3 text-kapur lg:mt-8">
                <span className="link-line">Read the case study</span>
                <Mark className="h-5 w-5 transition-transform duration-500 group-hover:translate-x-1" />
              </Link>
            </div>

            <ol className="hidden lg:order-3 lg:col-span-2 lg:col-start-11 lg:block" aria-hidden="true">
              {frames.map((f, i) => (
                <li key={f.src} className={`t-caption flex items-center gap-3 py-1.5 transition-colors duration-500 ${i === active ? "text-kapur" : "text-kapur/55"}`}>
                  <span className={`block h-px transition-all duration-500 ${i === active ? "w-8 bg-kapur" : "w-4 bg-kapur/55"}`} />
                  {f.label}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* The same photographs in sequence, for reduced motion and for browsers without JavaScript. */}
      <div className="walk-static page-x space-y-16 pb-24">
        {frames.map((f, i) => (
          <figure key={f.src} className="grid gap-6 lg:grid-cols-12">
            <div className="relative aspect-[4/5] lg:col-span-6 lg:col-start-4">
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
